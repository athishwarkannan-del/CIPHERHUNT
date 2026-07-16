import React, { useState, useEffect } from 'react';
import { auditService } from '../services/api';
import { ClipboardList, Terminal, Activity, Calendar, Search } from 'lucide-react';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = async () => {
    try {
      setError('');
      const response = await auditService.getAll();
      if (response.success) {
        setLogs(response.data);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError('Failed to fetch platform logs database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const query = searchQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(query) ||
      (log.details && log.details.toLowerCase().includes(query)) ||
      (log.websites?.name && log.websites.name.toLowerCase().includes(query)) ||
      (log.ip_address && log.ip_address.includes(query))
    );
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
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <ClipboardList className="h-7 w-7 text-cyber-primary" />
            Security Audit Trail
          </h2>
          <p className="text-base text-cyber-muted mt-1.5">Immutable log stream tracing user management operations, logs, and scans.</p>
        </div>

        {/* Search - Enlarged search bar and icon alignment */}
        <div className="relative w-full sm:w-96 shadow-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-cyber-muted/80">
            <Search className="h-5 w-5" />
          </div>
          <input
            type="text"
            placeholder="Search audit trail..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-5 py-3.5 bg-cyber-card border border-cyber-border rounded-xl text-sm text-white placeholder-cyber-muted/60 focus:outline-none focus:border-cyber-primary transition-all font-mono"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/20 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-3 text-sm">
          <Activity className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Terminal Board wrapper - Premium card roundedness and header */}
      <div className="bg-cyber-card border border-cyber-border rounded-2xl overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 left-0 w-full h-[4px] bg-cyber-primary"></div>
        
        {/* Terminal Header */}
        <div className="bg-cyber-border/40 px-7 py-5 border-b border-cyber-border/80 flex items-center gap-2.5">
          <Terminal className="h-5 w-5 text-cyber-primary animate-pulse" />
          <span className="text-xs font-mono uppercase tracking-widest text-white font-bold">OPERATOR_AUDIT_LOG_SHELL (~/db/logs)</span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-16 text-center text-cyber-muted font-mono text-sm">
            No audit records matched query filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[14px] font-mono">
              <thead>
                <tr className="bg-cyber-border/20 border-b border-cyber-border text-cyber-muted uppercase tracking-widest text-xs">
                  <th className="p-5 pl-7 font-bold">Timestamp</th>
                  <th className="p-5 font-bold">Action</th>
                  <th className="p-5 font-bold">Monitored Target</th>
                  <th className="p-5 font-bold">Description</th>
                  <th className="p-5 pr-7 text-right font-bold">IP Node</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyber-border/40 text-cyber-text">
                {filteredLogs.map((log) => {
                  // Color highlights for action tags
                  let actionClass = 'text-white border-cyber-border bg-cyber-border/50';
                  if (log.action.startsWith('USER_')) {
                    actionClass = 'text-cyber-secondary border-blue-500/20 bg-blue-500/5';
                  } else if (log.action.includes('ADD')) {
                    actionClass = 'text-cyber-primary border-emerald-500/20 bg-emerald-500/5';
                  } else if (log.action.includes('DELETE')) {
                    actionClass = 'text-cyber-danger border-red-500/20 bg-red-500/5';
                  } else if (log.action.includes('SCAN_')) {
                    actionClass = 'text-purple-400 border-purple-500/20 bg-purple-500/5';
                  }

                  return (
                    <tr key={log.id} className="hover:bg-cyber-border/10 transition-all">
                      <td className="p-5 pl-7 text-cyber-muted flex items-center gap-1.5 whitespace-nowrap">
                        <Calendar className="h-4 w-4 shrink-0" />
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="p-5">
                        <span className={`inline-block px-3 py-1 border rounded-lg text-[11px] font-extrabold uppercase tracking-widest ${actionClass}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-5 font-semibold text-white">
                        {log.websites?.name || 'N/A'}
                      </td>
                      <td className="p-5 max-w-sm whitespace-pre-wrap font-sans text-cyber-text leading-relaxed text-sm">
                        {log.details}
                      </td>
                      <td className="p-4 pr-6 text-right text-cyber-muted">
                        {log.ip_address || 'localhost'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
