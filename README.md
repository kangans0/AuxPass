# 🎵 AuxPass - Sonic Control

AuxPass is a real-time, collaborative music voting platform. It allows users to host rooms where guests can join via a code, vote on songs in a shared queue, and influence what plays next. Built with a focus on high-end UI/UX, featuring glassmorphism, 3D tilt effects, and Aurora gradients.

## ✨ Features

- **Real-time Synchronization:** Powered by Socket.io, queues and votes update instantly for all users.
- **Collaborative Queue:** Guests can add songs, upvote their favorites, and downvote tracks they dislike.
- **Host Dashboard:** Hosts have full control to kick users, manage requests, and play music.
- **Global Music Charts:** Integration with Apple Music RSS to show Top Global and Local hits.
- **Visuals:** Audio visualizers, vinyl animations, and interactive cursor effects.
- **Secure Auth:** JWT Authentication with BCrypt password hashing.

## 🛠️ Tech Stack

- **Frontend:** React + Vite, Tailwind CSS, Framer Motion (Animations), Lucide React (Icons).
- **Backend:** Node.js, Express.js, Socket.io.
- **Database:** MongoDB (Mongoose).
- **API:** iTunes Search API & Apple Music RSS.

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- MongoDB (Local or Atlas URL)

### Installation

1. **Clone the repository**
   ```bash
   git clone [https://github.com/your-username/auxpass.git](https://github.com/your-username/auxpass.git)
   cd auxpass