import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService, alertService } from '../services/api';
import StatCard from '../components/StatCard';
import {
  Globe,
  ScanEye,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Play,
  ArrowRight,
  ExternalLink,
  Activity,
  CheckCircle,
  Clock
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setError('');
      const [statsData, alertsData] = await Promise.all([
        dashboardService.getStats(),
        alertService.getAll()
      ]);

      if (!statsData.success) {
        throw new Error(statsData.error || 'Unable to load dashboard statistics.');
      }
      if (!alertsData.success) {
        throw new Error(alertsData.error || 'Unable to load security alerts.');
      }

      setStats(statsData.data);
      if (alertsData.success) {
        // filter to show only unresolved alerts in dashboard preview
        setAlerts(alertsData.data.filter(a => !a.resolved).slice(0, 5));
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError(err.response?.data?.error || err.message || 'Failed to establish connection with secure node backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleResolveAlert = async (id) => {
    try {
      const response = await alertService.resolve(id);
      if (response.success) {
        // Refresh data
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Error resolving alert:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4 text-cyber-muted">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-4 border-cyber-border"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-cyber-primary animate-spin"></div>
          </div>
          <p className="text-sm font-mono">Loading dashboard data…</p>
        </div>
      </div>
    );
  }

  // Do not attempt to read dashboard fields until the API returned valid data.
  // This prevents a backend error from crashing the entire authenticated view.
  if (!stats) {
    return (
      <div className="max-w-2xl mx-auto mt-16 p-6 bg-red-950/20 border border-red-500/30 text-red-300 rounded-xl space-y-2">
        <h2 className="text-lg font-bold text-white">Dashboard data unavailable</h2>
        <p className="text-sm">{error || 'The dashboard API did not return any data. Please refresh and try again.'}</p>
      </div>
    );
  }

  // Prepare chart data
  const lowRiskWebsites = (stats?.protectedWebsites || 0) - (stats?.highRiskWebsites || 0) - (stats?.criticalWebsites || 0);
  const riskChartData = [
    { name: 'Critical (>=85)', value: stats?.criticalWebsites || 0, color: '#ef4444' },
    { name: 'High Risk (70-84)', value: stats?.highRiskWebsites || 0, color: '#f59e0b' },
    { name: 'Low Risk (<70)', value: Math.max(lowRiskWebsites, 0), color: '#10b981' }
  ].filter(d => d.value > 0);

  // If no websites monitored yet
  const hasNoWebsites = stats?.protectedWebsites === 0;

  return (
    <div className="space-y-10 font-sans">
      {/* Title - Enlarged typography to meet design guidelines */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">Operations Control Center</h2>
          <p className="text-base text-cyber-muted mt-1.5">Real-time status monitor and automated threat assessments.</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="inline-flex items-center justify-center gap-2.5 px-5.5 py-3.5 border border-cyber-border rounded-xl text-xs font-mono font-bold tracking-widest text-cyber-primary hover:bg-cyber-primary/10 transition-all duration-200 cursor-pointer shadow-md hover:scale-[1.02]"
        >
          <Activity className="h-4.5 w-4.5 animate-pulse" />
          REFRESH CORE
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-950/20 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-3 text-sm">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {hasNoWebsites ? (
        <div className="border border-dashed border-cyber-border rounded-2xl p-16 text-center max-w-2xl mx-auto space-y-8 bg-cyber-card/30 mt-12 shadow-2xl">
          <div className="inline-flex bg-cyber-primary/5 border border-cyber-primary/20 p-5.5 rounded-full">
            <Globe className="h-10 w-10 text-cyber-primary animate-pulse" />
          </div>
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-white">No Target Node Registered</h3>
            <p className="text-base text-cyber-muted leading-relaxed max-w-md mx-auto">
              Begin by registering your first domain target for monitoring. The security engine will track defacement, title changes, security headers, and query Gemini AI.
            </p>
          </div>
          <Link
            to="/websites"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-cyber-primary hover:bg-emerald-600 text-black text-[15px] font-bold rounded-xl shadow-lg transition-all duration-200 hover:-translate-y-0.5"
          >
            Register Website Node
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      ) : (
        <>
          {/* STATS MATRIX */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Protected Websites"
              value={stats.protectedWebsites}
              icon={Globe}
              iconColorClass="text-cyber-secondary"
            />
            <StatCard
              title="Critical Websites"
              value={stats.criticalWebsites}
              icon={ShieldAlert}
              colorClass={stats.criticalWebsites > 0 ? 'border-red-500/30 bg-red-950/10 text-red-500 animate-pulse-slow' : 'border-cyber-border text-white'}
              iconColorClass="text-red-500"
            />
            <StatCard
              title="High Risk Websites"
              value={stats.highRiskWebsites}
              icon={AlertTriangle}
              colorClass={stats.highRiskWebsites > 0 ? 'border-amber-500/30 bg-amber-950/10 text-amber-500' : 'border-cyber-border text-white'}
              iconColorClass="text-amber-500"
            />
            <StatCard
              title="Average Threat Risk"
              value={`${stats.averageRisk}/100`}
              icon={ShieldCheck}
              colorClass="border-emerald-500/10 text-white"
              iconColorClass="text-cyber-primary"
            />
          </div>

          {/* LOWER GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LATEST SCAN OVERVIEW */}
            <div className="lg:col-span-2 space-y-8">
              {/* Latest Scan Report panel - Increased card padding and typography */}
              <div className="bg-cyber-card border border-cyber-border rounded-2xl p-7 md:p-8 shadow-xl">
                <div className="flex justify-between items-center border-b border-cyber-border/80 pb-5 mb-6">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2.5">
                    <Clock className="h-5.5 w-5.5 text-cyber-primary" />
                    Latest Scan Report
                  </h3>
                  {stats.latestScan && (
                    <Link
                      to={`/scans/${stats.latestScan.id}`}
                      className="text-xs font-mono text-cyber-primary hover:underline flex items-center gap-1"
                    >
                      Full Report
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                </div>

                {stats.latestScan ? (
                  <div className="space-y-6">
                    {/* Header Block */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <h4 className="text-lg font-bold text-white">{stats.latestScan.websites?.name}</h4>
                        <a
                          href={stats.latestScan.websites?.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-cyber-muted font-mono hover:underline flex items-center gap-1 mt-0.5"
                        >
                          {stats.latestScan.websites?.url}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>

                      <div className="flex gap-3">
                        <div className="bg-cyber-bg px-3 py-1.5 border border-cyber-border rounded-lg font-mono text-xs">
                          <span className="text-cyber-muted">Status: </span>
                          <span className={stats.latestScan.status_code === 200 ? 'text-cyber-primary' : 'text-cyber-danger'}>
                            {stats.latestScan.status_code || 'Offline'}
                          </span>
                        </div>
                        <div className="bg-cyber-bg px-3 py-1.5 border border-cyber-border rounded-lg font-mono text-xs">
                          <span className="text-cyber-muted">Response: </span>
                          <span className="text-purple-400">{stats.latestScan.response_time}ms</span>
                        </div>
                      </div>
                    </div>

                    {/* Threat Score Card */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-cyber-bg border border-cyber-border rounded-lg p-4 flex flex-col justify-center items-center text-center">
                        <span className="text-[10px] uppercase font-mono tracking-wider text-cyber-muted mb-1">Risk Score</span>
                        <span className={`text-4xl font-extrabold font-mono ${
                          stats.latestScan.risk_score >= 70 ? 'text-cyber-danger' : (stats.latestScan.risk_score >= 40 ? 'text-cyber-warning' : 'text-cyber-primary')
                        }`}>
                          {stats.latestScan.risk_score}/100
                        </span>
                      </div>

                      <div className="bg-cyber-bg border border-cyber-border rounded-lg p-4 flex flex-col justify-center items-center text-center">
                        <span className="text-[10px] uppercase font-mono tracking-wider text-cyber-muted mb-1">Threat Level</span>
                        <span className={`text-sm uppercase font-extrabold tracking-wider px-2.5 py-1 rounded-md ${
                          stats.latestScan.severity === 'critical' || stats.latestScan.severity === 'high'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : (stats.latestScan.severity === 'medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20')
                        }`}>
                          {stats.latestScan.severity}
                        </span>
                      </div>

                      <div className="bg-cyber-bg border border-cyber-border rounded-lg p-4 flex flex-col justify-center items-center text-center">
                        <span className="text-[10px] uppercase font-mono tracking-wider text-cyber-muted mb-1">Defacement</span>
                        <span className={`text-sm font-bold flex items-center gap-1.5 ${
                          stats.latestScan.html_changed || stats.latestScan.title_changed ? 'text-cyber-danger' : 'text-cyber-primary'
                        }`}>
                          {stats.latestScan.html_changed || stats.latestScan.title_changed ? (
                            <>
                              <AlertTriangle className="h-4 w-4 shrink-0" />
                              Changes Detected
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 shrink-0" />
                              Integra Safe
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* AI Explanation Snippet */}
                    <div className="bg-[#0c0f17] border border-cyber-border rounded-xl p-4 space-y-2">
                      <p className="text-xs uppercase font-mono tracking-wider text-cyber-primary">Gemini Security Analysis</p>
                      <p className="text-sm leading-relaxed text-cyber-text italic font-sans">
                        "{stats.latestScan.ai_explanation}"
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-12 text-center text-cyber-muted font-mono text-sm">
                    No scans logged. Select a node in 'Websites' and trigger scan.
                  </div>
                )}
              </div>

              {/* RISK DISTRIBUTION VISUALIZER */}
              {riskChartData.length > 0 && (
                <div className="bg-cyber-card border border-cyber-border rounded-2xl p-7 md:p-8 shadow-xl">
                  <h3 className="text-xl font-semibold text-white border-b border-cyber-border/80 pb-5 mb-6">
                    Risk Breakdown Matrix
                  </h3>
                  <div className="flex flex-col md:flex-row items-center justify-around gap-8 h-60">
                    <div className="w-48 h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={riskChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {riskChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ backgroundColor: '#0f131a', border: '1px solid #1b2330', borderRadius: '8px' }}
                            itemStyle={{ color: '#fff' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-4">
                      {riskChartData.map((item) => (
                        <div key={item.name} className="flex items-center gap-3">
                          <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                          <span className="text-sm font-semibold text-white">{item.name}:</span>
                          <span className="text-sm font-mono text-cyber-muted font-bold">{item.value} ({Math.round(item.value / stats.protectedWebsites * 100)}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* RECENT ACTIVITY TRAIL - Enlarged header and container */}
              {stats.recentActivity && stats.recentActivity.length > 0 && (
                <div className="bg-cyber-card border border-cyber-border rounded-2xl p-7 md:p-8 shadow-xl">
                  <h3 className="text-xl font-semibold text-white border-b border-cyber-border/80 pb-5 mb-5 flex items-center gap-2.5">
                    <Activity className="h-5.5 w-5.5 text-cyber-primary" />
                    Recent Activity Logs
                  </h3>
                  <div className="space-y-3 font-mono text-xs max-h-60 overflow-y-auto">
                    {stats.recentActivity.map((log) => (
                      <div key={log.id} className="flex justify-between items-start gap-4 py-2 border-b border-cyber-border/40 last:border-0">
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-cyber-muted mr-2">
                            [{new Date(log.created_at).toLocaleTimeString()}]
                          </span>
                          <span className="text-cyber-primary font-bold mr-2">{log.action}:</span>
                          <span className="text-cyber-text font-sans">{log.details}</span>
                        </div>
                        <span className="text-[10px] text-cyber-muted shrink-0">{log.ip_address || 'system'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ALERTS CONTROL PANEL - Taller panel padding and rounded corners */}
            <div className="bg-cyber-card border border-cyber-border rounded-2xl p-7 md:p-8 h-fit shadow-xl">
              <h3 className="text-xl font-bold text-white border-b border-cyber-border/80 pb-5 mb-5 flex items-center gap-2.5">
                <AlertTriangle className="h-5.5 w-5.5 text-cyber-danger" />
                Security Threat Stream
              </h3>

              <div className="space-y-5">
                {alerts.length > 0 ? (
                  alerts.map((alert) => (
                    <div key={alert.id} className="p-5 bg-red-950/15 border border-red-500/10 rounded-xl space-y-4 shadow-sm hover:border-red-500/30 transition-all duration-200">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[10px] uppercase font-mono tracking-widest px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-md">
                          {alert.type}
                        </span>
                        <span className="text-[10px] font-mono text-cyber-muted">
                          {new Date(alert.created_at).toLocaleTimeString()}
                        </span>
                      </div>

                      <div>
                        <p className="text-xs font-mono text-cyber-muted mb-0.5">{alert.websites?.name}</p>
                        <p className="text-sm text-white leading-relaxed font-sans">{alert.message}</p>
                      </div>

                      <div className="flex justify-between items-center pt-1">
                        {alert.scan_id && (
                          <Link
                            to={`/scans/${alert.scan_id}`}
                            className="text-[10px] font-mono text-cyber-primary hover:underline"
                          >
                            Inspect Scan &gt;
                          </Link>
                        )}
                        <button
                          onClick={() => handleResolveAlert(alert.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-cyber-primary hover:bg-emerald-600 text-black text-[11px] font-bold rounded-lg transition-all duration-200 cursor-pointer"
                        >
                          Resolve Alert
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center bg-cyber-bg/30 border border-cyber-border rounded-xl text-cyber-muted font-mono text-xs">
                    No active threat alerts in stream. Core intact.
                  </div>
                )}

                <Link
                  to="/alerts"
                  className="w-full flex items-center justify-center gap-2 py-3.5 border border-cyber-border/80 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-cyber-muted hover:bg-cyber-border/50 hover:text-white transition-all duration-200"
                >
                  View Alert History
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
