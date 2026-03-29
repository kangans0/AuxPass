require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const axios = require('axios');
const authRoutes = require('./routes/auth');

const app = express();
const server = http.createServer(app);

// 1. SETUP SOCKET WITH HIGH LIMITS (For Image Uploads)
const io = new Server(server, { 
  cors: { origin: "*" },
  maxHttpBufferSize: 1e8 // 100 MB limit for socket messages
});

// 2. SETUP EXPRESS WITH HIGH LIMITS
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/api/auth', authRoutes);

// --- MODELS ---

const SongSchema = new mongoose.Schema({
  title: String,
  artist: String,
  cover: String,
  status: { type: String, enum: ['requested', 'queued', 'rejected'], default: 'requested' },
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 },
  voteHistory: [{ 
    username: String, 
    voteType: String, 
    timestamp: Date 
  }]
});

const RoomSchema = new mongoose.Schema({
  name: String,
  code: { type: String, unique: true },
  hostId: String,
  image: String, // Stores the Base64 image string
  category: String,
  users: [{ username: String, socketId: String }],
  queue: [SongSchema],
  requests: [SongSchema]
});

const Room = mongoose.model('Room', RoomSchema);

// --- API ROUTES ---

// 1. Global Charts (Proxy to Apple Music)
app.get('/api/top-global', async (req, res) => {
  try {
    const response = await axios.get('https://rss.applemarketingtools.com/api/v2/us/music/most-played/10/songs.json');
    const songs = response.data.feed.results.map(item => ({
      title: item.name,
      artist: item.artistName,
      cover: item.artworkUrl100.replace('100x100bb', '600x600bb')
    }));
    res.json(songs);
  } catch (e) { res.status(500).json({ error: "Failed to fetch charts" }); }
});

// 2. India Charts
app.get('/api/top-india', async (req, res) => {
  try {
    const response = await axios.get('https://rss.applemarketingtools.com/api/v2/in/music/most-played/10/songs.json');
    const songs = response.data.feed.results.map(item => ({
      title: item.name,
      artist: item.artistName,
      cover: item.artworkUrl100.replace('100x100bb', '600x600bb')
    }));
    res.json(songs);
  } catch (e) { res.status(500).json({ error: "Failed to fetch charts" }); }
});

// 3. Search
app.get('/api/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);
  try {
    const response = await axios.get(`https://itunes.apple.com/search`, {
      params: { term: q, media: 'music', limit: 5 }
    });
    const songs = response.data.results.map(item => ({
      title: item.trackName,
      artist: item.artistName,
      cover: item.artworkUrl100.replace('100x100bb', '600x600bb') 
    }));
    res.json(songs);
  } catch (e) { res.status(500).json({ error: "Failed to search" }); }
});

// 4. Trending Rooms
app.get('/api/trending', async (req, res) => {
  try {
    const rooms = await Room.find().lean();
    // Sort by number of users connected
    rooms.sort((a, b) => (b.users?.length || 0) - (a.users?.length || 0));
    res.json(rooms.slice(0, 5));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 5. Get All Rooms
app.get('/api/rooms', async (req, res) => {
  try {
    const rooms = await Room.find();
    res.json(rooms);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 6. Create Room
app.post('/api/room', async (req, res) => {
  const { name, code, category, image, hostId } = req.body;
  try {
    const newRoom = new Room({ 
      name, 
      code: code.toUpperCase(), 
      category, 
      // Use provided image or fallback
      image: image || "https://images.unsplash.com/photo-1514525253440-b393452e8d03?auto=format&fit=crop&q=80&w=1000", 
      hostId, 
      users: [] 
    });
    await newRoom.save();
    res.json(newRoom);
  } catch (e) { res.status(500).json({ error: "Room creation failed. Code might exist." }); }
});

// 7. Get Specific Room
app.get('/api/room/:code', async (req, res) => {
  try {
    const code = req.params.code.toUpperCase(); 
    const room = await Room.findOne({ code });
    if (room) res.json(room);
    else res.status(404).json({ error: "Room not found" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- SOCKET EVENTS ---

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // 1. Join Room
  socket.on('join_room', async ({ roomCode, username }) => {
    const fixedCode = roomCode.toUpperCase();
    socket.join(fixedCode);
    try {
      // Check if user exists to update socket ID, else add new user
      let room = await Room.findOneAndUpdate(
        { code: fixedCode, "users.username": username },
        { $set: { "users.$.socketId": socket.id } },
        { new: true }
      );
      if (!room) {
        room = await Room.findOneAndUpdate(
          { code: fixedCode },
          { $push: { users: { username, socketId: socket.id } } },
          { new: true }
        );
      }
      if (room) io.to(fixedCode).emit('room_update', room);
    } catch (err) { console.error("Join Error:", err.message); }
  });

  // 2. User Leaves (Graceful Exit)
  socket.on('leave_room', async ({ roomCode, socketId }) => {
    const fixedCode = roomCode.toUpperCase();
    try {
      const room = await Room.findOneAndUpdate(
        { code: fixedCode },
        { $pull: { users: { socketId: socketId } } },
        { new: true }
      );
      if(room) io.to(fixedCode).emit('room_update', room);
    } catch(err) { console.error("Leave error", err); }
  });

  // 3. Kick User (Host Action)
  socket.on('kick_user', async ({ roomCode, socketId }) => {
    const fixedCode = roomCode.toUpperCase();
    try {
      const room = await Room.findOneAndUpdate(
        { code: fixedCode },
        { $pull: { users: { socketId: socketId } } },
        { new: true }
      );
      // Notify the specific user they got kicked
      io.to(socketId).emit('kicked');
      // Update everyone else
      if(room) io.to(fixedCode).emit('room_update', room);
    } catch(err) { console.error("Kick error", err); }
  });

  // 4. Update Cover Image
  socket.on('update_image', async ({ roomCode, imageUrl }) => {
    const fixedCode = roomCode.toUpperCase();
    try {
      const room = await Room.findOneAndUpdate(
        { code: fixedCode },
        { image: imageUrl },
        { new: true }
      );
      if(room) io.to(fixedCode).emit('room_update', room);
    } catch(err) { console.error("Update Image Error", err); }
  });

  // 5. Close Room (End Session)
  socket.on('close_room', async ({ roomCode }) => {
    const fixedCode = roomCode.toUpperCase();
    await Room.deleteOne({ code: fixedCode });
    io.to(fixedCode).emit('room_closed');
  });

  // 6. Queue Management
  socket.on('host_add_song', async ({ roomCode, title, artist, cover }) => {
    const fixedCode = roomCode.toUpperCase();
    const room = await Room.findOneAndUpdate(
      { code: fixedCode },
      { $push: { queue: { title, artist, cover, status: 'queued', upvotes: 0, downvotes: 0 } } },
      { new: true }
    );
    if(room) io.to(fixedCode).emit('room_update', room);
  });

  socket.on('request_song', async ({ roomCode, title, artist, cover }) => {
    const fixedCode = roomCode.toUpperCase();
    const room = await Room.findOneAndUpdate(
      { code: fixedCode },
      { $push: { requests: { title, artist, cover, status: 'requested' } } },
      { new: true }
    );
    if(room) io.to(fixedCode).emit('room_update', room);
  });

  socket.on('accept_request', async ({ roomCode, songId }) => {
    const fixedCode = roomCode.toUpperCase();
    const room = await Room.findOne({ code: fixedCode });
    if(room) {
      const song = room.requests.id(songId);
      if(song) {
        song.status = 'queued';
        room.queue.push(song); 
        room.requests.pull(songId); 
        await room.save();
        io.to(fixedCode).emit('room_update', room);
      }
    }
  });

  socket.on('reject_request', async ({ roomCode, songId }) => {
    const fixedCode = roomCode.toUpperCase();
    const room = await Room.findOneAndUpdate(
      { code: fixedCode },
      { $pull: { requests: { _id: songId } } },
      { new: true }
    );
    if(room) io.to(fixedCode).emit('room_update', room);
  });

  // 7. Voting Logic
  socket.on('vote_song', async ({ roomCode, songId, type, username }) => {
    const fixedCode = roomCode.toUpperCase();
    try {
      const room = await Room.findOne({ code: fixedCode });
      if(room) {
        const song = room.queue.id(songId);
        if(song) {
          // Check for duplicate votes (rate limiting)
          const existingVote = song.voteHistory.find(v => v.username === username);
          if (existingVote && (Date.now() - new Date(existingVote.timestamp).getTime() < 2000)) return;

          if (type === 'up') {
            if (!existingVote) {
              song.upvotes++;
              song.voteHistory.push({ username, voteType: 'up', timestamp: new Date() });
            } else if (existingVote.voteType === 'down') {
              song.downvotes--; song.upvotes++; existingVote.voteType = 'up'; existingVote.timestamp = new Date();
            }
          } else if (type === 'down') {
            if (!existingVote) {
              song.downvotes++;
              song.voteHistory.push({ username, voteType: 'down', timestamp: new Date() });
            } else if (existingVote.voteType === 'up') {
              song.upvotes--; song.downvotes++; existingVote.voteType = 'down'; existingVote.timestamp = new Date();
            }
          }
          
          // Sort queue by net score (upvotes - downvotes)
          room.queue.sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));
          room.markModified('queue'); 
          await room.save();
          io.to(fixedCode).emit('room_update', room);
        }
      }
    } catch (e) { console.log("Vote conflict ignored"); }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/auxpass-final')
  .then(() => server.listen(PORT, () => console.log(`🔥 Server running on ${PORT}`)))
  .catch(err => console.error(err));