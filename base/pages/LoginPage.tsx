
import React, { useState } from 'react';
import { DesignSystem, User } from '../types';

interface LoginPageProps {
  theme: DesignSystem;
  onLogin: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ theme, onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { colors, fontHeader, borderRadius } = theme;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simplified login logic
    if (username && password) {
      onLogin({ id: '1', username, role: 'admin' });
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${colors.background} ${colors.text} p-6`}>
      <div className={`w-full max-w-md bg-white border ${colors.border} p-12 shadow-2xl ${borderRadius}`}>
        <div className="text-center mb-10">
          <h1 className={`${fontHeader} text-3xl font-bold ${colors.primary} mb-2`}>EarthyDesign</h1>
          <p className={`text-sm ${colors.muted} font-medium`}>Access the editorial dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className={`block text-[10px] uppercase font-bold tracking-widest ${colors.text} opacity-80`}>
              Username
            </label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`w-full border ${colors.border} p-4 text-sm ${colors.text} bg-white focus:outline-none focus:ring-1 focus:ring-[#3d2b1f] ${borderRadius} placeholder:text-neutral-400`}
              placeholder="Enter your username"
              required
            />
          </div>
          <div className="space-y-2">
            <label className={`block text-[10px] uppercase font-bold tracking-widest ${colors.text} opacity-80`}>
              Password
            </label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full border ${colors.border} p-4 text-sm ${colors.text} bg-white focus:outline-none focus:ring-1 focus:ring-[#3d2b1f] ${borderRadius} placeholder:text-neutral-400`}
              placeholder="Enter your password"
              required
            />
          </div>
          
          <button 
            type="submit" 
            className={`w-full py-4 ${colors.accent} text-white font-bold text-sm tracking-widest hover:brightness-125 transition-all uppercase ${borderRadius} mt-4 shadow-sm`}
          >
            Authenticate
          </button>
        </form>

        <div className="mt-10 text-center border-t ${colors.border} pt-6">
            <p className={`text-[11px] ${colors.muted} italic font-medium`}>"Precision is the soul of elegance."</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
