import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import cows from './assets/cows.jpg';
import logo from './assets/logo2web.png';

export default function Inicio() {
  const [description, setDescription] = useState('');
  const navigate = useNavigate();

  return (
    <div
      className="relative flex items-center justify-center h-screen bg-cover bg-center"
      style={{
        backgroundImage: `url(${cows})`,
      }}
    >
      {}
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative text-center text-white max-w-2xl px-4">
        
        {}
        <div className="flex justify-center mb-4">
          <img 
            src={logo} 
            alt="AniManager Logo" 
            className="w-40 h-40 rounded-full shadow-lg border-4 border-yellow-300"
          />
        </div>

        {}
        <h1 className="text-6xl font-bold tracking-wide"></h1>
        <p className="mt-4 text-lg tracking-[0.3em]">INNOVA SYSTEM</p>

        {}
        <button
          onClick={() => navigate('/auth')}
          className="mt-6 px-6 py-3 bg-yellow-300 text-orange-800 rounded-full font-semibold hover:bg-orange-400 transition"
        >
          Comenzar
        </button>
      </div>
    </div>
  );
}
