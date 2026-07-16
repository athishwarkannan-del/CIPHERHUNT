import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Globe,
  AlertTriangle,
  ClipboardList,
  LogOut,
  Shield,
  User,
  Terminal
} from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Websites', path: '/websites', icon: Globe },
    { name: 'Security Alerts', path: '/alerts', icon: AlertTriangle },
    { name: 'Audit Logs', path: '/audit-logs', icon: ClipboardList }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-cyber-bg text-cyber-text overflow-hidden font-sans">
      {/* Sidebar - Redesigned to 288px (w-72) for modern spacious layout */}
      <aside className="w-72 bg-cyber-card border-r border-cyber-border/80 flex flex-col justify-between shadow-2xl z-20 transition-all duration-300">
        <div>
          {/* Logo Section - Increased padding, brand text size, and icon container */}
          <div className="p-7 border-b border-cyber-border/80 flex items-center gap-3.5">
            <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20 animate-pulse-slow">
              <Shield className="h-7 w-7 text-cyber-primary" />
            </div>
            <div>
              <h1 className="font-black text-xl tracking-wider text-white">CIPHER<span className="text-cyber-primary">UNIT</span></h1>
              <p className="text-[11px] uppercase font-mono tracking-widest text-cyber-muted/80 mt-0.5">Security Engine</p>
            </div>
          </div>

          {/* Navigation Links - Improved active glows and hover padding transitions */}
          <nav className="p-5 space-y-2.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3.5 px-5 py-3.5 rounded-xl font-semibold text-[15px] tracking-wide transition-all duration-200 group ${
                    isActive
                      ? 'bg-cyber-primary/10 border-l-4 border-cyber-primary text-white shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                      : 'text-cyber-muted hover:bg-cyber-border/40 hover:text-white hover:translate-x-1'
                  }`}
                >
                  <Icon className={`h-5.5 w-5.5 transition-colors duration-200 ${isActive ? 'text-cyber-primary' : 'text-cyber-muted group-hover:text-white'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User / Footer Section - Taller layout with larger avatar and robust styling */}
        <div className="p-6 border-t border-cyber-border/80 space-y-4">
          <div className="flex items-center gap-3.5 px-4 py-3 bg-[#0a0d14] rounded-xl border border-cyber-border/60">
            <div className="bg-cyber-border/80 p-2 rounded-full">
              <User className="h-5 w-5 text-cyber-primary" />
            </div>
            <div className="overflow-hidden">
              <p className="text-[11px] text-cyber-muted font-mono uppercase tracking-wider">Logged in as:</p>
              <p className="text-[14px] font-bold text-white truncate mt-0.5">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-red-950/20 border border-red-500/20 hover:bg-red-500/10 hover:border-red-500/40 text-red-400 hover:text-red-300 rounded-xl text-[15px] font-bold transition-all duration-200 cursor-pointer shadow-sm"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header - Height increased to h-20 (80px), padding increased, status indicator styled */}
        <header className="h-20 border-b border-cyber-border/85 bg-cyber-card/85 backdrop-blur-md flex items-center justify-between px-10 z-10">
          <div className="flex items-center gap-3">
            <Terminal className="h-5 w-5 text-cyber-primary animate-pulse" />
            <span className="text-[13px] font-mono uppercase tracking-widest text-cyber-muted">
              Security Node: {window.location.hostname || 'localhost'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5 px-3 py-1.5 bg-emerald-950/15 border border-emerald-500/10 rounded-lg">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-mono font-bold text-cyber-primary tracking-wider">SYSTEM OPERATIONAL</span>
            </div>
          </div>
        </header>

        {/* Views Container - Increased padding for modern, open visual structure */}
        <main className="flex-1 overflow-y-auto bg-[#07090e] p-10">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
