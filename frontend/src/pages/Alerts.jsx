import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { alertService } from '../services/api';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Search
} from 'lucide-react';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('unresolved'); // 'all', 'unresolved', 'resolved'

  const fetchAlerts = async () => {
    try {
      setError('');
      const response = await alertService.getAll();
      if (response.success) {
        setAlerts(response.data);
      }
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError('Failed to query the security threat alerts stream.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleResolve = async (id) => {
    try {
      const response = await alertService.resolve(id);
      if (response.success) {
        fetchAlerts();
      }
    } catch (err) {
      console.error('Error resolving alert:', err);
      alert('Failed to resolve alert.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('WARNING: Are you sure you want to permanently delete this alert log?')) {
      return;
    }
    try {
      const response = await alertService.delete(id);
      if (response.success) {
        fetchAlerts();
      }
    } catch (err) {
      console.error('Error deleting alert:', err);
      alert('Failed to delete alert.');
    }
  };

  // Filter logic
  const filteredAlerts = alerts.filter((alert) => {
    if (filter === 'unresolved') return !alert.resolved;
    if (filter === 'resolved') return alert.resolved;
    return true; // 'all'
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-cyber-border"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-cyber-primary animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 font-sans">
      {/* Title */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <AlertTriangle className="h-7 w-7 text-cyber-danger" />
            Security Alert Center
          </h2>
          <p className="text-base text-cyber-muted mt-1.5">Inspect and manage automated warnings for defacements and header gaps.</p>
        </div>

        {/* Filters - Increased tab height, rounded corners, and text size */}
        <div className="flex border border-cyber-border bg-cyber-card p-1.5 rounded-xl">
          <button
            onClick={() => setFilter('unresolved')}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all cursor-pointer ${
              filter === 'unresolved'
                ? 'bg-red-500/10 border border-red-500/20 text-red-400 font-bold'
                : 'text-cyber-muted hover:text-white'
            }`}
          >
            Unresolved ({alerts.filter(a => !a.resolved).length})
          </button>
          <button
            onClick={() => setFilter('resolved')}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all cursor-pointer ${
              filter === 'resolved'
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-cyber-primary font-bold'
                : 'text-cyber-muted hover:text-white'
            }`}
          >
            Resolved ({alerts.filter(a => a.resolved).length})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-cyber-border border border-cyber-border text-white font-bold'
                : 'text-cyber-muted hover:text-white'
            }`}
          >
            All Logs ({alerts.length})
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/20 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-3 text-sm">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {filteredAlerts.length === 0 ? (
        <div className="border border-cyber-border bg-cyber-card rounded-2xl p-16 text-center max-w-xl mx-auto space-y-4">
          <div className="inline-flex bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-full">
            <ShieldCheck className="h-8 w-8 text-cyber-primary" />
          </div>
          <h3 className="text-lg font-bold text-white">Stream Clear</h3>
          <p className="text-sm text-cyber-muted font-mono">
            No active threat indicators matching your filter criteria. System integrity confirmed.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => {
            const isDefacement = alert.type === 'defacement';
            let alertClass = 'border-red-500/20 bg-red-950/5';
            let iconColor = 'text-cyber-danger';

            if (alert.resolved) {
              alertClass = 'border-emerald-500/20 bg-emerald-950/5 opacity-70';
              iconColor = 'text-cyber-primary';
            } else if (alert.type === 'security_headers' || alert.type === 'missing_https') {
              alertClass = 'border-amber-500/20 bg-amber-950/5';
              iconColor = 'text-cyber-warning';
            }

            return (
              <div
                key={alert.id}
                className={`bg-cyber-card border rounded-2xl p-7 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:-translate-y-0.5 hover:shadow-lg ${alertClass}`}
              >
                <div className="flex gap-4 items-start">
                  <div className={`p-4 bg-cyber-bg border border-cyber-border rounded-xl mt-1 ${iconColor}`}>
                    {alert.resolved ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      <AlertTriangle className={`h-6 w-6 ${isDefacement ? 'animate-pulse' : ''}`} />
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-sm uppercase font-mono tracking-widest text-cyber-muted/80 font-black">
                        {alert.websites?.name}
                      </span>
                      <span className="text-cyber-muted/40 font-mono">•</span>
                      <span className={`text-[11px] uppercase font-mono font-bold tracking-widest px-2.5 py-1 border rounded-md ${
                        alert.resolved ? 'bg-emerald-500/10 text-cyber-primary border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {alert.type}
                      </span>
                      <span className="text-cyber-muted/40 font-mono">•</span>
                      <span className="text-[11px] font-mono text-cyber-muted flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(alert.created_at).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-[15px] leading-relaxed text-white font-semibold">{alert.message}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                  {alert.scan_id && (
                    <Link
                      to={`/scans/${alert.scan_id}`}
                      className="flex items-center gap-2 px-5 py-3 bg-cyber-bg border border-cyber-border text-white text-[13px] font-mono font-bold uppercase tracking-wider rounded-xl hover:bg-cyber-border transition-all"
                    >
                      Inspect Scan
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  )}

                  {!alert.resolved && (
                    <button
                      onClick={() => handleResolve(alert.id)}
                      className="flex items-center gap-2 px-5 py-3 bg-cyber-primary hover:bg-emerald-600 text-black text-[13px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md"
                    >
                      Resolve Threat
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(alert.id)}
                    className="flex items-center gap-2 px-4 py-3 bg-red-950/20 border border-red-500/20 text-red-400 hover:bg-red-500/30 hover:border-red-500 rounded-xl text-[13px] transition-all cursor-pointer font-mono font-bold"
                    title="Delete Alert Log"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Alerts;
