import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Disc, Music } from 'lucide-react';

const Login = ({ setUser }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const API = `${BACKEND_URL}/api/auth`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const endpoint = isLogin ? '/login' : '/register';
    
    try {
      const res = await axios.post(API + endpoint, formData);
      if (isLogin) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        if(setUser) setUser(res.data.user);
        navigate('/'); 
      } else {
        alert('Account created! Now login.');
        setIsLogin(true);
      }
    } catch (err) {
      setError(err.response?.data?.msg || 'Something went wrong');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#090909]">
      
      {/* Background Ambience */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#1db954]/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#7000ff]/10 rounded-full blur-[120px]" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md bg-[#181818] border border-white/5 p-8 rounded-3xl shadow-2xl relative z-10 backdrop-blur-xl"
      >
        
        {/* Header Icon */}
        <div className="text-center mb-8">
          <motion.div 
            initial={{ rotate: -180, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="w-16 h-16 bg-[#1db954] rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(29,185,84,0.3)]"
          >
            {isLogin ? <Disc size={32} className="text-black animate-spin-slow" /> : <Music size={32} className="text-black" />}
          </motion.div>
          
          <h2 className="text-4xl font-black text-white mb-2 tracking-tight">
            {isLogin ? 'Welcome Back' : 'Join the Vibe'}
          </h2>
          <p className="text-gray-400 font-medium">
            {isLogin ? 'Control the queue from anywhere.' : 'Start your music journey today.'}
          </p>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl mb-6 text-center text-sm font-bold flex items-center justify-center gap-2"
            >
              <span>⚠️</span> {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode='popLayout'>
            {!isLogin && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="group relative"
              >
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#1db954] transition-colors" />
                <input 
                  placeholder="Username" 
                  className="w-full bg-[#0a0a0a] border border-white/10 text-white pl-12 pr-4 py-4 rounded-xl outline-none focus:border-[#1db954] focus:shadow-[0_0_15px_rgba(29,185,84,0.1)] transition-all font-medium placeholder-gray-600"
                  onChange={e => setFormData({...formData, username: e.target.value})}
                />
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="group relative">
            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#1db954] transition-colors" />
            <input 
              type="email" 
              placeholder="Email Address" 
              className="w-full bg-[#0a0a0a] border border-white/10 text-white pl-12 pr-4 py-4 rounded-xl outline-none focus:border-[#1db954] focus:shadow-[0_0_15px_rgba(29,185,84,0.1)] transition-all font-medium placeholder-gray-600"
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div className="group relative">
            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#1db954] transition-colors" />
            <input 
              type="password" 
              placeholder="Password" 
              className="w-full bg-[#0a0a0a] border border-white/10 text-white pl-12 pr-4 py-4 rounded-xl outline-none focus:border-[#1db954] focus:shadow-[0_0_15px_rgba(29,185,84,0.1)] transition-all font-medium placeholder-gray-600"
              onChange={e => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <button className="w-full bg-[#1db954] text-black font-black text-lg py-4 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(29,185,84,0.2)] flex justify-center items-center gap-2 mt-2">
            {isLogin ? 'LOG IN' : 'CREATE ACCOUNT'} <ArrowRight size={20} />
          </button>
        </form>

        <div className="text-center mt-8 text-gray-400 text-sm font-medium">
          {isLogin ? "New to AuxPass?" : "Already vibing?"}
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(''); }} 
            className="text-white ml-2 hover:text-[#1db954] transition-colors underline decoration-white/20 hover:decoration-[#1db954] underline-offset-4"
          >
            {isLogin ? 'Create Account' : 'Log In'}
          </button>
        </div>

      </motion.div>
    </div>
  );
};

export default Login;