import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Music, Zap, Users, Plus, ThumbsUp, ThumbsDown, Disc, LogOut, 
  Trash2, MapPin, Radio, ArrowRight, Power, Search, 
  PlayCircle, Activity, BarChart3, ChevronRight, Play, Globe, Upload, X, Trophy, Star, Youtube, RefreshCw
} from 'lucide-react';
import Login from './Login'; 

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const socket = io(BACKEND_URL);
const API = `${BACKEND_URL}/api`;

const CATEGORY_IMAGES = {
  'Cafe': 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=1000',
  'Bar': 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&q=80&w=1000',
  'Event': 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=1000',
  'Shop': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1000',
  'Study': 'https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?auto=format&fit=crop&q=80&w=1000',
  'Party': 'https://images.unsplash.com/photo-1533174072545-e8d4aa97edf9?auto=format&fit=crop&q=80&w=1000'
};

const convertToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.readAsDataURL(file);
    fileReader.onload = () => resolve(fileReader.result);
    fileReader.onerror = (error) => reject(error);
  });
};

// --- COMPONENTS ---

// 🎹 AUDIO VISUALIZER
const AudioVisualizer = ({ height = "h-4", color = "bg-[#1db954]" }) => (
  <div className={`flex items-end gap-[2px] ${height}`}>
    {[0.2, 0.5, 0.3, 0.7, 0.4].map((delay, i) => (
      <motion.div
        key={i}
        className={`w-[3px] rounded-full ${color}`}
        animate={{ height: ['20%', '100%', '40%'] }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          repeatType: "reverse",
          delay: delay,
          ease: "easeInOut"
        }}
      />
    ))}
  </div>
);

// 🎵 VINYL HERO
const VinylHero = ({ imageUrl }) => {
  const defaultImage = "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80&w=400";
  
  return (
    <div className="relative w-64 h-64 md:w-80 md:h-80 flex-shrink-0 group perspective-1000">
      <div className="absolute inset-0 bg-[#1db954] rounded-full blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity duration-700 animate-pulse"></div>
      
      <motion.div 
        initial={{ rotateY: -10, rotateX: 5 }}
        whileHover={{ rotateY: 0, rotateX: 0 }}
        className="relative w-full h-full bg-[#121212] border border-white/10 rounded-2xl shadow-2xl flex items-center justify-center p-4"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 4, ease: "linear", repeat: Infinity }}
          className="relative w-full h-full rounded-full bg-black border-4 border-[#181818] shadow-xl overflow-hidden flex items-center justify-center"
        >
          <div className="absolute inset-0 rounded-full border border-white/5 scale-90"></div>
          <div className="absolute inset-0 rounded-full border border-white/5 scale-75"></div>
          <div className="absolute inset-0 rounded-full border border-white/5 scale-60"></div>
          
          <div className="w-1/2 h-1/2 rounded-full overflow-hidden relative z-10 border-4 border-[#121212]">
            <img 
              src={imageUrl || defaultImage} 
              onError={(e) => { e.target.onerror = null; e.target.src = defaultImage; }}
              className="w-full h-full object-cover opacity-90"
            />
          </div>
        </motion.div>

        <div className="absolute top-4 right-4 w-4 h-24 bg-[#333] rounded-full origin-top transform -rotate-12 group-hover:rotate-12 transition-transform duration-700 shadow-lg z-20 border border-white/10">
           <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-6 bg-[#555] rounded-full border-2 border-black"></div>
        </div>
        
        <div className="absolute bottom-4 left-4 z-20 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-white/50 border border-white/5 flex items-center gap-2">
          {imageUrl ? <><AudioVisualizer height="h-3" color="bg-white" /> Live</> : "AuxPass"}
        </div>
      </motion.div>
    </div>
  );
};

// 🏆 SESSION SUMMARY
const SessionSummary = ({ room, onClose }) => {
  const totalVotes = room.queue.reduce((acc, s) => acc + s.upvotes + s.downvotes, 0);
  const topSong = [...room.queue].sort((a,b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes))[0];

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
    >
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-[#121212] border border-white/10 w-full max-w-md rounded-3xl p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#1db954] to-blue-500"></div>
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#1db954]/20 blur-[50px] rounded-full pointer-events-none"></div>
        <h2 className="text-3xl font-black font-display text-white mb-2">Session Wrapped</h2>
        <p className="text-gray-400 text-sm mb-8">Here's how your party went down.</p>
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5"><div className="text-gray-400 text-xs uppercase font-bold mb-1">Total Listeners</div><div className="text-3xl font-black text-white">{room.users.length}</div></div>
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5"><div className="text-gray-400 text-xs uppercase font-bold mb-1">Total Votes</div><div className="text-3xl font-black text-[#1db954]">{totalVotes}</div></div>
        </div>
        {topSong && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3"><Trophy size={16} className="text-yellow-400" /><span className="text-xs font-bold text-yellow-400 uppercase tracking-widest">Crowd Favorite</span></div>
            <div className="flex items-center gap-4 bg-gradient-to-r from-white/10 to-transparent p-4 rounded-xl border border-white/10"><img src={topSong.cover} className="w-16 h-16 rounded-lg shadow-lg" /><div><div className="font-bold text-white text-lg leading-tight">{topSong.title}</div><div className="text-gray-400 text-sm">{topSong.artist}</div></div></div>
          </div>
        )}
        <button onClick={onClose} className="w-full bg-[#1db954] text-black font-bold py-4 rounded-xl hover:scale-[1.02] transition-transform">Close Room</button>
      </motion.div>
    </motion.div>
  );
};

const BrandLogo = () => (
  <div className="relative w-10 h-10 flex items-center justify-center group cursor-pointer">
    <div className="absolute inset-0 bg-[#1db954] rounded-full blur-xl opacity-20 group-hover:opacity-50 transition-opacity duration-500" />
    <div className="relative w-full h-full bg-gradient-to-tr from-black to-[#111] rounded-xl border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl group-hover:scale-105 transition-transform duration-300">
      <div className="absolute inset-0 bg-gradient-to-tr from-[#1db954]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10">
        <motion.path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#1db954" strokeWidth="2" strokeLinecap="round" initial={{ pathLength: 0, rotate: 0 }} animate={{ pathLength: 1, rotate: 360 }} transition={{ duration: 2, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }} />
        <path d="M10 8L16 12L10 16V8Z" fill="white" className="group-hover:fill-[#1db954] transition-colors duration-300"/>
      </svg>
    </div>
  </div>
);

const MusicCursor = () => {
  const [notes, setNotes] = useState([]);
  useEffect(() => {
    let idCounter = 0; const symbols = ['♪', '♫', '♩', '♬']; const colors = ['#1db954', '#1ed760', '#fff']; 
    const handleMouseMove = (e) => {
      if (Math.random() < 0.85) return; 
      const id = idCounter++; const newNote = { id, x: e.clientX, y: e.clientY, symbol: symbols[Math.floor(Math.random() * symbols.length)], color: colors[Math.floor(Math.random() * colors.length)] };
      setNotes(p => [...p, newNote]); setTimeout(() => setNotes(p => p.filter(n => n.id !== id)), 1000);
    };
    window.addEventListener('mousemove', handleMouseMove); return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      <AnimatePresence>{notes.map(n => (<motion.div key={n.id} initial={{ opacity: 1, x: n.x, y: n.y, scale: 0.5 }} animate={{ opacity: 0, y: n.y - 100, x: n.x + (Math.random() * 40 - 20), scale: 1.5 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }} className="absolute text-2xl font-bold" style={{ color: n.color, left: 0, top: 0 }}>{n.symbol}</motion.div>))}</AnimatePresence>
    </div>
  );
};

const Navbar = ({ user, handleLogout }) => {
  const [scrolled, setScrolled] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const location = useLocation();
  useEffect(() => { const onScroll = () => setScrolled(window.scrollY > 20); window.addEventListener('scroll', onScroll); return () => window.removeEventListener('scroll', onScroll); }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-[#090909]/80 backdrop-blur-xl border-b border-white/5 py-3' : 'py-6 bg-transparent'}`}>
      <div className="max-w-[1600px] mx-auto px-8 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-3 group"><BrandLogo /><div className="flex flex-col"><span className="text-xl font-display font-black tracking-tighter leading-none text-white group-hover:text-[#1db954] transition-colors">AUX<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1db954] to-[#1ed760]">PASS</span></span><span className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-500 group-hover:text-white transition-colors">Sonic Control</span></div></Link>
        <div className="hidden md:flex items-center gap-1 bg-[#121212] p-1 rounded-full border border-white/5 shadow-inner">
          {['Home', 'Explore', 'Host'].map((item) => {
            let path = item === 'Host' ? '/create' : item === 'Explore' ? '/explore' : '/'; const isActive = location.pathname === '/' && item === 'Home' || location.pathname === path;
            return (
              <Link key={item} to={path} className={`relative px-6 py-2 rounded-full text-xs font-bold transition-all duration-300 ${isActive ? 'text-black' : 'text-gray-400 hover:text-white'}`}>
                {isActive && (<motion.div layoutId="nav-pill" className="absolute inset-0 bg-[#1db954] rounded-full shadow-[0_0_15px_rgba(29,185,84,0.4)]" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />)}
                <span className="relative z-10">{item.toUpperCase()}</span>
              </Link>
            )
          })}
        </div>
        {user ? (
          <div className="relative">
            <button onClick={() => setShowDropdown(!showDropdown)} className="flex items-center gap-3 pl-1 pr-4 py-1 rounded-full bg-[#121212] border border-white/10 hover:border-[#1db954]/50 transition-all group"><div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1db954] to-emerald-700 flex items-center justify-center text-black font-black text-xs shadow-lg group-hover:scale-105 transition-transform">{user.username[0].toUpperCase()}</div><span className="text-xs font-bold text-gray-300 group-hover:text-white hidden sm:block">{user.username}</span></button>
            <AnimatePresence>{showDropdown && (<motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute right-0 mt-2 w-48 glass-panel rounded-xl overflow-hidden py-1 border border-white/10"><div className="px-4 py-3 border-b border-white/5"><p className="text-[10px] uppercase font-bold text-gray-500">Signed in as</p><p className="text-sm font-bold text-white truncate">{user.username}</p></div><button onClick={() => { setShowDropdown(false); handleLogout(); }} className="flex items-center gap-3 w-full px-4 py-3 text-left text-xs font-bold text-red-400 hover:bg-white/5 transition-colors"><LogOut size={14} /> LOG OUT</button></motion.div>)}</AnimatePresence>
          </div>
        ) : (<Link to="/login" className="text-xs font-bold text-white hover:text-[#1db954] transition-colors tracking-wide">LOG IN</Link>)}
      </div>
    </nav>
  );
};

// 🎬 UPDATED ROOM CARD (3D Tilt + Glassmorphism)
const RoomCard = ({ room, rank }) => (
  <Link to="/join" state={{ name: room.name }} className="block group relative w-[280px] h-[380px] flex-shrink-0 perspective-1000">
    {/* Rank Number */}
    {rank && (
      <div className="absolute -left-4 -bottom-2 z-20 rank-number text-[8rem] font-black italic drop-shadow-2xl">
        {rank}
      </div>
    )}

    {/* Tilt Container */}
    <motion.div 
      whileHover={{ scale: 1.05, rotateX: 5, rotateY: 5 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="w-full h-full rounded-2xl overflow-hidden border border-white/10 relative z-10 bg-white/5 backdrop-blur-md shadow-2xl"
    >
      <img src={room.image} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90"></div>
      
      {/* Visualizer */}
      <div className="absolute top-3 right-3 z-20 bg-black/40 backdrop-blur-md p-1.5 rounded-lg border border-white/10 flex items-center gap-1">
         <AudioVisualizer height="h-3" />
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-5 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
        <div className="flex items-center gap-2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity delay-100">
          <div className="bg-[#1db954] text-black text-[10px] font-black px-2 py-0.5 rounded uppercase">Live</div>
          <span className="text-[10px] font-bold text-white/70">{room.category}</span>
        </div>
        <h3 className="text-xl font-bold leading-none mb-1 text-white">{room.name}</h3>
        <p className="text-xs text-gray-400 font-medium">{room.users?.length || 0} listening now</p>
      </div>
    </motion.div>
  </Link>
);

const SongRow = ({ song, idx, onClick }) => (
  <div onClick={onClick} className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 cursor-pointer group transition-colors border-b border-white/5 last:border-0">
    <div className="w-6 text-center text-sm font-medium text-gray-500 group-hover:text-[#1db954]">{idx + 1}</div>
    <div className="relative w-10 h-10 rounded shadow-lg overflow-hidden"><img src={song.cover} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Play size={12} fill="white" className="text-white"/></div></div>
    <div className="flex-1 min-w-0"><div className="text-sm font-semibold text-white truncate group-hover:text-[#1db954] transition-colors">{song.title}</div><div className="text-xs text-gray-400 truncate">{song.artist}</div></div>
    <div className="text-xs text-gray-500 font-medium">3:24</div>
  </div>
);

// --- PAGES ---

const Home = () => {
  const [trending, setTrending] = useState([]);
  const [globalTop, setGlobalTop] = useState([]);
  const [indiaTop, setIndiaTop] = useState([]);
  const [activeChart, setActiveChart] = useState('Global');
  
  useEffect(() => {
    axios.get(`${API}/trending`).then(res => setTrending(res.data)).catch(console.error);
    axios.get(`${API}/top-global`).then(res => setGlobalTop(res.data)).catch(console.error);
    axios.get(`${API}/top-india`).then(res => setIndiaTop(res.data)).catch(console.error);
  }, []);

  const openSpotify = (song) => {
    const query = encodeURIComponent(`${song.title} ${song.artist}`);
    window.open(`https://open.spotify.com/search/${query}`, '_blank');
  };

  const heroImage = trending.length > 0 ? trending[0].image : null;

  return (
    <div className="pt-28 pb-20 max-w-[1600px] mx-auto min-h-screen px-8">
      <div className="flex flex-col lg:flex-row gap-12 mb-20 items-center">
        <div className="lg:w-2/3 pt-10 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
             <VinylHero imageUrl={heroImage} />
             <div>
                <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9]">
                  Music is <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1db954] to-white">Better Together.</span>
                </motion.h1>
                <p className="text-xl text-gray-400 max-w-xl mt-6 leading-relaxed">Host live music rooms, vote on the queue, and discover what the world is listening to right now.</p>
             </div>
          </div>
          <div className="flex gap-4 ml-0 md:ml-4">
             <Link to="/join" className="bg-[#1db954] text-black px-10 py-4 rounded-full font-bold text-sm tracking-wide hover:scale-105 transition-transform shadow-[0_0_30px_rgba(29,185,84,0.4)]">START LISTENING</Link>
             <Link to="/create" className="bg-white/10 text-white px-10 py-4 rounded-full font-bold text-sm tracking-wide hover:bg-white/20 transition-colors border border-white/5">HOST A ROOM</Link>
          </div>
        </div>
        <div className="lg:w-1/3 w-full">
          <div className="glass-panel rounded-2xl p-5 h-[450px] flex flex-col border border-white/10">
            <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-lg flex items-center gap-2"><BarChart3 size={18} className="text-[#1db954]"/> {activeChart} Top 10</h3><div className="flex bg-black/40 p-1 rounded-lg"><button onClick={() => setActiveChart('Global')} className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${activeChart === 'Global' ? 'bg-[#1db954] text-black' : 'text-gray-400 hover:text-white'}`}>GLOBAL</button><button onClick={() => setActiveChart('India')} className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${activeChart === 'India' ? 'bg-[#1db954] text-black' : 'text-gray-400 hover:text-white'}`}>INDIA</button></div></div>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">{(activeChart === 'Global' ? globalTop : indiaTop).map((s, i) => (<SongRow key={i} song={s} idx={i} onClick={() => openSpotify(s)}/>))}</div>
          </div>
        </div>
      </div>
      <div className="mb-16"><h2 className="text-2xl font-bold mb-6 flex items-center gap-2">Trending Now <ChevronRight size={20} className="text-gray-500"/></h2><div className="flex gap-12 overflow-x-auto pb-16 pt-4 pl-4 no-scrollbar">{trending.map((room, i) => (<RoomCard key={room._id} room={room} rank={i + 1} />))}</div></div>
    </div>
  );
};

const Explore = () => {
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const categories = ['All', 'Cafe', 'Bar', 'Event', 'Shop', 'Study', 'Party'];
  useEffect(() => { axios.get(`${API}/rooms`).then(res => { setRooms(res.data); setFilteredRooms(res.data); }).catch(console.error); }, []);
  useEffect(() => {
    let res = rooms; if(category !== 'All') res = res.filter(r => r.category === category);
    if(search) { const q = search.toLowerCase(); res = res.filter(r => r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q)); }
    setFilteredRooms(res);
  }, [category, search, rooms]);
  return (
    <div className="pt-28 px-8 max-w-[1600px] mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12"><div><motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-5xl md:text-7xl font-black tracking-tight mb-2">Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1db954] to-white">Vibe</span></motion.h1></div><div className="relative w-full md:w-96 group z-20"><div className="absolute inset-0 bg-[#1db954] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full"></div><div className="relative flex items-center bg-[#181818] border border-white/10 rounded-full px-6 py-4 shadow-2xl focus-within:border-[#1db954]/50 transition-colors"><Search className="text-gray-400 mr-3" size={20} /><input placeholder="Search rooms or codes..." value={search} onChange={e => setSearch(e.target.value)} className="bg-transparent border-none outline-none text-white w-full placeholder-gray-500 font-medium text-lg"/></div></div></div>
      <div className="flex gap-3 overflow-x-auto pb-8 no-scrollbar mask-linear-fade">{categories.map((cat, i) => (<motion.button key={cat} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} onClick={() => setCategory(cat)} className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${category === cat ? 'bg-[#1db954] text-black border-[#1db954] scale-105 shadow-lg shadow-green-900/20' : 'bg-white/5 text-gray-400 border-white/5 hover:border-white/20 hover:text-white'}`}>{cat}</motion.button>))}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-12 pb-20"><AnimatePresence>{filteredRooms.map((room, i) => (<motion.div key={room._id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: i * 0.05 }}><RoomCard room={room} /></motion.div>))}</AnimatePresence></div>
    </div>
  );
};

// --- HOST DASHBOARD (UPDATED) ---

const HostPage = ({ user }) => {
  const { code } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [showSummary, setShowSummary] = useState(false);
  const fileInputRef = useRef(null); 

  useEffect(() => {
    const isHostByStorage = localStorage.getItem(`isHost_${code.toUpperCase()}`);
    socket.emit('join_room', { roomCode: code, username: 'Host' });
    socket.on('room_update', (updatedRoom) => {
      if(!isHostByStorage && (!user || updatedRoom.hostId !== user.username)) {
         // navigate('/join'); 
      }
      setRoom(updatedRoom);
    });
    return () => socket.off('room_update');
  }, [code, user]);

  useEffect(() => {
    const delay = setTimeout(async () => { if(search.length > 2) { const res = await axios.get(`${API}/search?q=${search}`); setResults(res.data); } else setResults([]); }, 500);
    return () => clearTimeout(delay);
  }, [search]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if(file.size > 5000000) { alert("Max 5MB"); return; }
      try { const base64 = await convertToBase64(file); socket.emit('update_image', { roomCode: code, imageUrl: base64 }); } catch (err) {}
    }
  };

  const kickUser = (socketId) => {
    if(window.confirm("Kick this user?")) { socket.emit('kick_user', { roomCode: code, socketId }); }
  };

  const finishSession = () => { setShowSummary(true); };
  const closeRoomFinally = () => { 
    localStorage.removeItem(`isHost_${code.toUpperCase()}`); 
    socket.emit('close_room', { roomCode: code }); 
    navigate('/'); 
  };

  if(!room) return <div className="h-screen flex items-center justify-center text-[#1db954]">CONNECTING...</div>;

  return (
    <div className="pt-20 h-screen flex flex-col px-6 pb-6 bg-transparent">
      {showSummary && <SessionSummary room={room} onClose={closeRoomFinally} />}
      <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />

      <div className="flex items-end gap-6 mb-8">
        <div onClick={() => fileInputRef.current.click()} className="w-48 h-48 bg-gray-800 rounded shadow-2xl overflow-hidden relative group cursor-pointer border border-white/5 hover:border-[#1db954]/50 transition-all">
          <img src={room.image} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white border border-white px-3 py-1 rounded-full hover:bg-white hover:text-black transition-colors"><Upload size={14}/> Change Cover</span></div>
        </div>
        <div className="flex-1">
          <span className="text-xs font-bold uppercase tracking-widest text-white/60">LIVE SESSION</span>
          <h1 className="text-7xl font-black text-white tracking-tight mb-4">{room.name}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-300 font-medium">
             <span className="flex items-center gap-2"><div className="w-2 h-2 bg-[#1db954] rounded-full animate-pulse"/> Live</span>
             <span>•</span>
             <span>{room.users?.length || 0} Listeners</span>
             <span>•</span>
             <span className="font-mono text-white bg-white/10 px-2 py-0.5 rounded">CODE: {code}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-8 min-h-0">
        <div className="flex-1 flex flex-col bg-[#121212]/50 rounded-lg overflow-hidden backdrop-blur-sm">
          <div className="p-4 border-b border-white/5 sticky top-0 bg-[#090909]/80 z-10 flex justify-between items-center"><h3 className="font-bold text-lg">Queue</h3><div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input placeholder="Add to queue" value={search} onChange={e => setSearch(e.target.value)} className="bg-[#282828] text-white text-sm pl-9 pr-4 py-2 rounded-full outline-none focus:ring-2 focus:ring-white/20 w-64"/></div></div>
          {results.length > 0 ? (
            <div className="p-4 space-y-2"><div className="text-xs font-bold text-gray-400 mb-2 uppercase">Search Results</div>{results.map((s, i) => (<div key={i} onClick={() => { socket.emit('host_add_song', { roomCode: code, ...s }); setSearch(''); }} className="flex items-center gap-3 p-2 hover:bg-white/10 rounded cursor-pointer"><img src={s.cover} className="w-10 h-10 rounded"/><div><div className="font-bold text-sm">{s.title}</div><div className="text-xs text-gray-400">{s.artist}</div></div><Plus size={16} className="ml-auto text-[#1db954]"/></div>))}</div>
          ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="px-4 py-2 text-xs text-gray-400 border-b border-white/5 grid grid-cols-[30px_1fr_1fr_40px] gap-4 uppercase tracking-wider"><div>#</div><div>Title</div><div>Votes</div><div></div></div>
              {room.queue.map((s, i) => (
                <div key={s._id} className="px-4 py-3 hover:bg-white/5 grid grid-cols-[30px_1fr_1fr_40px] gap-4 items-center group text-sm text-gray-300">
                  <div className="group-hover:text-white">{i + 1}</div>
                  <div className="flex items-center gap-3 overflow-hidden"><img src={s.cover} className="w-10 h-10 rounded shadow-md"/><div className="truncate"><div className="font-bold text-white truncate">{s.title}</div><div className="text-xs">{s.artist}</div></div></div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-[#1db954]"><ThumbsUp size={14} /><span className="font-mono">{s.upvotes}</span></div>
                    <div className="flex items-center gap-1 text-red-500"><ThumbsDown size={14} /><span className="font-mono">{s.downvotes}</span></div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => window.open(`https://open.spotify.com/search/${encodeURIComponent(s.title + " " + s.artist)}`, '_blank')} className="hover:scale-110 transition" title="Open Spotify"><Disc size={20} className="text-[#1db954]" /></button>
                    <button onClick={() => window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(s.title + " " + s.artist)}`, '_blank')} className="hover:scale-110 transition" title="Search YouTube"><Youtube size={20} className="text-red-500" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="w-80 flex flex-col gap-6">
          <div className="bg-[#181818]/60 backdrop-blur-md rounded-lg p-4 flex-1 overflow-hidden flex flex-col border border-white/5">
            <h3 className="font-bold text-sm mb-4 text-white">Requests ({room.requests.length})</h3>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 h-1/3 mb-4 border-b border-white/5 pb-4">
              {room.requests.map(req => (<div key={req._id} className="flex gap-3 items-center"><img src={req.cover} className="w-10 h-10 rounded"/><div className="flex-1 min-w-0"><div className="font-bold text-xs truncate text-white">{req.title}</div><div className="text-[10px] text-gray-400">{req.artist}</div></div><div className="flex gap-1"><button onClick={() => socket.emit('accept_request', { roomCode: code, songId: req._id })} className="bg-[#1db954] p-1.5 rounded-full text-black hover:scale-110"><Plus size={12}/></button><button onClick={() => socket.emit('reject_request', { roomCode: code, songId: req._id })} className="bg-white/10 p-1.5 rounded-full hover:bg-red-500/20 text-red-500 hover:scale-110"><Trash2 size={12}/></button></div></div>))}
            </div>
            <h3 className="font-bold text-sm mb-4 text-white mt-2">Listeners ({room.users.length})</h3>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
               {room.users.map((u, idx) => (
                 <div key={idx} className="flex items-center justify-between bg-white/5 p-2 rounded">
                    <span className="text-xs font-bold text-gray-300 truncate w-32">{u.username}</span>
                    {u.username !== 'Host' && (
                      <button onClick={() => kickUser(u.socketId)} className="text-red-500 hover:bg-red-500/20 p-1 rounded transition"><X size={14}/></button>
                    )}
                 </div>
               ))}
            </div>
          </div>
          <button onClick={finishSession} className="bg-red-500/10 text-red-500 border border-red-500/20 py-3 rounded-lg font-bold text-xs hover:bg-red-500 hover:text-white transition-colors">END SESSION</button>
        </div>
      </div>
    </div>
  );
};

// --- JOIN PAGE (UPDATED) ---

const JoinPage = ({ user }) => { 
  const location = useLocation();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [room, setRoom] = useState(null);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  
  useEffect(() => { 
    socket.on('room_update', setRoom);
    socket.on('room_closed', () => { alert("Session Ended by Host"); navigate('/'); });
    socket.on('kicked', () => { alert("You have been kicked from the room."); navigate('/'); });
    return () => { socket.off('room_update'); socket.off('room_closed'); socket.off('kicked'); }; 
  }, []);

  const handleJoin = async (e) => { 
    e.preventDefault(); 
    if (!code) return; 
    const cleanCode = code.toUpperCase();
    try { 
        const res = await axios.get(`${API}/room/${cleanCode}`); 
        const roomData = res.data;
        const isHost = (user && user.username === roomData.hostId) || localStorage.getItem(`isHost_${cleanCode}`);
        if(isHost) { navigate(`/host/${cleanCode}`); return; }
        socket.emit('join_room', { roomCode: cleanCode, username: user?.username || `Guest-${Math.floor(Math.random()*1000)}` });
        setRoom(roomData); 
    } catch { alert('Invalid Room or Network Error'); } 
  };

  const handleLeave = () => { if(window.confirm("Leave this room?")) { socket.emit('leave_room', { roomCode: room.code, socketId: socket.id }); navigate('/'); } };

  useEffect(() => { const d = setTimeout(async () => { if(search.length > 2) { const res = await axios.get(`${API}/search?q=${search}`); setResults(res.data); } else setResults([]); }, 500); return () => clearTimeout(d); }, [search]);
  
  if(!room) return (<div className="h-screen flex items-center justify-center bg-transparent"><div className="text-center"><motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 bg-[#1db954] rounded-full mx-auto mb-6 flex items-center justify-center shadow-[0_0_50px_rgba(29,185,84,0.4)]"><Radio size={40} className="text-black"/></motion.div><h1 className="text-4xl font-black mb-2">Join the Vibe</h1><form onSubmit={handleJoin} className="mt-8 relative"><input autoFocus placeholder="ROOM CODE" value={code} onChange={e => setCode(e.target.value)} className="bg-transparent border-b-2 border-[#333] text-center text-4xl font-mono py-2 text-white uppercase focus:border-[#1db954] outline-none w-64 transition-colors placeholder-gray-700"/><button className="block w-full mt-8 bg-white text-black font-bold py-4 rounded-full hover:bg-[#1db954] transition-colors">CONNECT</button></form></div></div>);
  
  return (
    <div className="pt-24 px-4 max-w-lg mx-auto pb-32">
       <div className="flex justify-between items-start mb-10">
         <div className="flex-1 text-center pr-8"><span className="text-[10px] font-bold text-[#1db954] uppercase tracking-widest">Connected to</span><h1 className="text-4xl font-black">{room.name}</h1></div>
         <button onClick={handleLeave} className="bg-white/10 p-2 rounded-full hover:bg-red-500 hover:text-white transition-colors"><LogOut size={18} /></button>
       </div>

       <div className="space-y-4">{room.queue.map((s, idx) => (
         <div key={s._id} className="flex items-center gap-4 bg-white/5 p-2 rounded-lg backdrop-blur-sm">
           <div className="relative w-14 h-14 flex-shrink-0"><img src={s.cover} className="w-full h-full rounded-md object-cover"/>{idx === 0 && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><div className="w-2 h-2 bg-[#1db954] rounded-full animate-ping"/></div>}</div>
           <div className="flex-1 min-w-0"><h3 className={`font-bold truncate ${idx === 0 ? 'text-[#1db954]' : 'text-white'}`}>{s.title}</h3><p className="text-xs text-gray-400">{s.artist}</p></div>
           
           <div className="flex flex-col items-end gap-2">
             <button onClick={() => socket.emit('vote_song', { roomCode: room.code, songId: s._id, type: 'up', username: user?.username || 'G' })} className="flex items-center gap-1.5 text-gray-400 hover:text-[#1db954] transition-colors">
               <ThumbsUp size={18} /><span className="text-xs font-bold">{s.upvotes}</span>
             </button>
             <button onClick={() => socket.emit('vote_song', { roomCode: room.code, songId: s._id, type: 'down', username: user?.username || 'G' })} className="flex items-center gap-1.5 text-gray-400 hover:text-red-500 transition-colors">
               <ThumbsDown size={18} /><span className="text-xs font-bold">{s.downvotes}</span>
             </button>
           </div>
         </div>
       ))}</div>
       <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent z-40"><div className="max-w-lg mx-auto relative"><input placeholder="Request a song..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-[#282828] text-white py-4 pl-6 pr-12 rounded-full shadow-2xl outline-none focus:ring-2 focus:ring-[#1db954] transition-all"/><Search className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>{results.length > 0 && (<div className="absolute bottom-full left-0 right-0 mb-2 bg-[#282828] rounded-2xl overflow-hidden shadow-2xl max-h-60 overflow-y-auto">{results.map((s, i) => (<div key={i} onClick={() => { socket.emit('request_song', { roomCode: room.code, ...s }); setSearch(''); setResults([]); }} className="flex gap-3 p-3 hover:bg-white/5 border-b border-white/5"><img src={s.cover} className="w-10 h-10 rounded"/><div><div className="font-bold text-sm text-white">{s.title}</div><div className="text-xs text-gray-400">{s.artist}</div></div></div>))}</div>)}</div></div>
    </div>
  );
};

// --- CREATE ROOM (UPDATED) ---

const CreateRoom = () => {
    const [form, setForm] = useState({ name: '', code: '', category: 'Cafe', image: '' });
    const navigate = useNavigate();
    const handleFileChange = async (e) => { const file = e.target.files[0]; if(file) { if(file.size > 5000000) { alert("Max 5MB"); return; } const base64 = await convertToBase64(file); setForm({ ...form, image: base64 }); } };
    
    const handleCreate = async () => { 
      const user = JSON.parse(localStorage.getItem('user'));
      const finalImage = form.image || CATEGORY_IMAGES[form.category] || CATEGORY_IMAGES['Cafe'];
      
      try { 
        await axios.post(`${API}/room`, { ...form, code: form.code.toUpperCase(), image: finalImage, hostId: user?.username || 'Host' }); 
        localStorage.setItem(`isHost_${form.code.toUpperCase()}`, 'true');
        navigate(`/host/${form.code.toUpperCase()}`); 
      } catch { alert('Error creating room. Code might be taken.'); } 
    };
  
    return (
      <div className="min-h-screen flex items-center justify-center pt-20 px-4">
        <div className="glass-panel p-10 rounded-3xl w-full max-w-lg">
          <h1 className="text-3xl font-black mb-8">Create Space</h1>
          <div className="space-y-6">
            <div><label className="text-xs font-bold text-gray-500 ml-2 mb-2 block uppercase">Name</label><input onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-[#090909] border border-white/10 p-4 rounded-xl text-white outline-none focus:border-[#1db954] transition"/></div>
            <div><label className="text-xs font-bold text-gray-500 ml-2 mb-2 block uppercase">Code</label><input onChange={e => setForm({...form, code: e.target.value})} className="w-full bg-[#090909] border border-white/10 p-4 rounded-xl text-white outline-none focus:border-[#1db954] transition uppercase font-mono"/></div>
            <div>
              <label className="text-xs font-bold text-gray-500 ml-2 mb-2 block uppercase">Cover Image</label>
              <div className="relative"><input type="file" onChange={handleFileChange} accept="image/*" className="w-full bg-[#090909] border border-white/10 p-3 rounded-xl text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#1db954] file:text-black hover:file:bg-[#1ed760]"/></div>
              {form.image && <p className="text-[10px] text-[#1db954] mt-2 ml-2">✓ Image Selected</p>}
            </div>
            <div><label className="text-xs font-bold text-gray-500 ml-2 mb-2 block uppercase">Type</label><select onChange={e => setForm({...form, category: e.target.value})} className="w-full bg-[#090909] border border-white/10 p-4 rounded-xl text-white outline-none focus:border-[#1db954] appearance-none"><option>Cafe</option><option>Bar</option><option>Event</option><option>Shop</option><option>Study</option><option>Party</option></select></div>
            <button onClick={handleCreate} className="w-full bg-[#1db954] text-black font-bold text-lg p-4 rounded-xl hover:scale-[1.02] transition-transform mt-4">Launch</button>
          </div>
        </div>
      </div>
    );
};

function App() {
  const [user, setUser] = useState(null);
  useEffect(() => { const stored = localStorage.getItem('user'); if (stored) setUser(JSON.parse(stored)); }, []);
  const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); setUser(null); window.location.href = '/'; };
  return (
    <Router>
      <div className="min-h-screen font-sans text-white bg-aurora">
        <MusicCursor />
        <Navbar user={user} handleLogout={handleLogout} />
        <AnimatePresence mode="wait"><Routes><Route path="/" element={<Home />} /><Route path="/explore" element={<Explore />} /><Route path="/create" element={<CreateRoom />} /><Route path="/join" element={<JoinPage user={user} />} /><Route path="/host/:code" element={<HostPage user={user} />} /><Route path="/login" element={<Login setUser={setUser} />} /></Routes></AnimatePresence>
      </div>
    </Router>
  );
}

export default App;