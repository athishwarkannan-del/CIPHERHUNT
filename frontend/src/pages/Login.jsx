import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Key, Mail, AlertCircle, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return setError('Please enter both email and password.');
    }

    setError('');
    setLoading(true);

    const result = await login(email, password);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Invalid credentials');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cyber-bg flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background cyber grid effect */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1b2330_1px,transparent_1px),linear-gradient(to_bottom,#1b2330_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30"></div>

      {/* Main card */}
      <div className="relative w-full max-w-lg bg-cyber-card border border-cyber-border rounded-2xl shadow-2xl overflow-hidden z-10">
        <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-emerald-500 via-cyan-500 to-purple-500"></div>

        <div className="p-10">
          {/* Logo Section */}
          <div className="flex flex-col items-center mb-10">
            <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/30 mb-4 animate-pulse-slow">
              <Shield className="h-9 w-9 text-cyber-primary" />
            </div>
            <h2 className="text-3xl font-black text-white tracking-wider">
              CIPHER<span className="text-cyber-primary">UNIT</span>
            </h2>
            <p className="text-xs uppercase font-mono tracking-widest text-cyber-muted/80 mt-1.5">Defacement Platform Access</p>
          </div>

          {error && (
            <div className="mb-6 p-4.5 bg-red-950/30 border border-red-500/30 text-red-400 rounded-xl flex items-start gap-3 text-sm animate-shake">
              <AlertCircle className="h-5.5 w-5.5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Address */}
            <div className="space-y-2">
              <label className="text-[13px] uppercase font-mono tracking-widest text-cyber-muted/80 font-bold block">Operator Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-cyber-muted/80">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full pl-12 pr-4 py-4 bg-cyber-bg border border-cyber-border rounded-xl text-base text-white placeholder-cyber-muted focus:outline-none focus:border-cyber-primary focus:ring-1 focus:ring-cyber-primary transition-all duration-200"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[13px] uppercase font-mono tracking-widest text-cyber-muted/80 font-bold block">Password</label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-cyber-muted/80">
                  <Key className="h-5 w-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-10 py-4 bg-cyber-bg border border-cyber-border rounded-xl text-base text-white placeholder-cyber-muted focus:outline-none focus:border-cyber-primary focus:ring-1 focus:ring-cyber-primary transition-all duration-200"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-cyber-muted hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 bg-cyber-primary hover:bg-emerald-600 active:bg-emerald-700 text-black font-extrabold rounded-xl text-base transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_14px_rgba(16,185,129,0.3)] hover:scale-[1.01] ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <>
                  <div className="h-5 w-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  Verifying Operator Node...
                </>
              ) : (
                'Access Terminal'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
