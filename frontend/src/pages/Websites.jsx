import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { websiteService, scanService } from '../services/api';
import {
  Plus,
  Edit2,
  Trash2,
  Play,
  History,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ExternalLink,
  Loader,
  Globe,
  Settings,
  X
} from 'lucide-react';

const Websites = () => {
  const [websites, setWebsites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Scanning state map (websiteId => boolean)
  const [scanningMap, setScanningMap] = useState({});

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedWebsite, setSelectedWebsite] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  const fetchWebsites = async () => {
    try {
      setError('');
      const response = await websiteService.getAll();
      if (!response.success) {
        throw new Error(response.error || 'Unable to load the target inventory.');
      }
      setWebsites(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Error fetching websites:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load websites list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebsites();
    // Prevent an unavailable API from leaving this view in an invisible loader.
    const loadingTimeout = window.setTimeout(() => {
      setLoading((isLoading) => {
        if (isLoading) {
          setError('The target inventory is taking too long to respond. Refresh the page after confirming the backend is running.');
        }
        return false;
      });
    }, 12000);

    return () => window.clearTimeout(loadingTimeout);
  }, []);

  const handleOpenAddModal = () => {
    setName('');
    setUrl('');
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (website) => {
    setSelectedWebsite(website);
    setName(website.name);
    setUrl(website.url);
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleAddWebsite = async (e) => {
    e.preventDefault();
    if (!name || !url) {
      return setFormError('All fields are required.');
    }

    setFormError('');
    setSubmitting(true);

    try {
      const response = await websiteService.create(name, url);
      if (response.success) {
        setIsAddModalOpen(false);
        fetchWebsites();
      }
    } catch (err) {
      console.error('Error adding website:', err);
      const validationErrors = err.response?.data?.errors;
      if (validationErrors && validationErrors.length > 0) {
        setFormError(validationErrors.map(e => e.message).join(', '));
      } else {
        setFormError(err.response?.data?.error || 'Failed to register website.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditWebsite = async (e) => {
    e.preventDefault();
    if (!name || !url) {
      return setFormError('All fields are required.');
    }

    setFormError('');
    setSubmitting(true);

    try {
      const response = await websiteService.update(selectedWebsite.id, name, url);
      if (response.success) {
        setIsEditModalOpen(false);
        fetchWebsites();
      }
    } catch (err) {
      console.error('Error updating website:', err);
      const validationErrors = err.response?.data?.errors;
      if (validationErrors && validationErrors.length > 0) {
        setFormError(validationErrors.map(e => e.message).join(', '));
      } else {
        setFormError(err.response?.data?.error || 'Failed to update website details.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteWebsite = async (id) => {
    if (!window.confirm('WARNING: Deleting this website will permanently remove all related scans, baselines, and alerts. Do you want to proceed?')) {
      return;
    }

    try {
      const response = await websiteService.delete(id);
      if (response.success) {
        fetchWebsites();
      }
    } catch (err) {
      console.error('Error deleting website:', err);
      alert('Failed to delete website.');
    }
  };

  const handleRunScan = async (websiteId) => {
    setScanningMap(prev => ({ ...prev, [websiteId]: true }));
    try {
      const response = await scanService.run(websiteId);
      if (response.success && response.data) {
        // Redirect to new scan report
        navigate(`/scans/${response.data.id}`);
      }
    } catch (err) {
      console.error('Error running scan:', err);
      alert(err.response?.data?.error || 'Threat scan failed. Confirm that the target server is online.');
      // Refresh list anyway
      fetchWebsites();
    } finally {
      setScanningMap(prev => ({ ...prev, [websiteId]: false }));
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
          <p className="text-sm font-mono">Loading target inventory…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 font-sans">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">Target Inventory</h2>
          <p className="text-base text-cyber-muted mt-1.5">Register, edit, and launch scans against web assets.</p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2.5 px-6 py-4 bg-cyber-primary hover:bg-emerald-600 text-black text-[15px] font-bold rounded-xl transition-all duration-200 cursor-pointer shadow-[0_4px_14px_rgba(16,185,129,0.25)] hover:scale-[1.02]"
        >
          <Plus className="h-5 w-5" />
          Add Target Website
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-950/20 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-3 text-sm">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {websites.length === 0 ? (
        <div className="border border-dashed border-cyber-border rounded-2xl p-16 text-center max-w-xl mx-auto space-y-6 bg-cyber-card/30">
          <div className="inline-flex bg-cyber-primary/5 border border-cyber-primary/20 p-4 rounded-full">
            <Globe className="h-8 w-8 text-cyber-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white">No Targets in Inventory</h3>
            <p className="text-sm text-cyber-muted">
              Add your first website to the monitoring scope. Once added, you can capture its baseline HTML, analyze security headers, and query Gemini.
            </p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyber-primary hover:bg-emerald-600 text-black text-sm font-semibold rounded-lg shadow-md transition-all duration-200 cursor-pointer"
          >
            Register Website Node
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {websites.map((site) => {
            const isScanning = !!scanningMap[site.id];
            
            // Determine status style
            let statusBorder = 'border-cyber-border';
            let statusText = 'text-cyber-muted';
            let statusBg = 'bg-cyber-border/10';
            let StatusIcon = Globe;

            if (site.status === 'safe') {
              statusBorder = 'border-emerald-500/20 bg-emerald-950/5';
              statusText = 'text-cyber-primary';
              statusBg = 'bg-emerald-500/10';
              StatusIcon = ShieldCheck;
            } else if (site.status === 'vulnerable') {
              statusBorder = 'border-amber-500/20 bg-amber-950/5';
              statusText = 'text-cyber-warning';
              statusBg = 'bg-amber-500/10';
              StatusIcon = AlertTriangle;
            } else if (site.status === 'defaced') {
              statusBorder = 'border-red-500/20 bg-red-950/5';
              statusText = 'text-cyber-danger font-bold';
              statusBg = 'bg-red-500/10';
              StatusIcon = ShieldAlert;
            }

            return (
              <div
                key={site.id}
                className={`bg-cyber-card border rounded-2xl p-7 md:p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-cyber-primary/40 ${statusBorder}`}
              >
                {/* Header info */}
                <div className="space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="text-xl font-extrabold text-white tracking-tight">{site.name}</h3>
                      <a
                        href={site.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-cyber-muted font-mono hover:underline inline-flex items-center gap-1.5 mt-1"
                      >
                        {site.url}
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <span className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold border uppercase tracking-widest ${statusText} ${statusBg} ${statusBorder}`}>
                        <StatusIcon className="h-4 w-4" />
                        {site.status}
                      </span>
                      {site.status !== 'unscanned' && (
                        <span className="text-[12px] font-mono text-cyber-muted font-bold">
                          Risk: <span className={site.risk_score >= 70 ? 'text-cyber-danger' : (site.risk_score >= 40 ? 'text-cyber-warning' : 'text-cyber-primary')}>{site.risk_score}/100</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-cyber-border/60 pt-5 grid grid-cols-2 gap-4 text-sm font-mono text-cyber-muted">
                    <div>
                      <span className="block text-[11px] font-semibold text-cyber-muted/70 tracking-widest uppercase mb-0.5">Registered At</span>
                      <span className="text-cyber-text font-bold">{new Date(site.created_at).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="block text-[11px] font-semibold text-cyber-muted/70 tracking-widest uppercase mb-0.5">Last Security Scan</span>
                      <span className="text-cyber-text font-bold">
                        {site.last_scanned_at ? new Date(site.last_scanned_at).toLocaleString() : 'Never Scanned'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-cyber-border/60 pt-6 mt-7 flex justify-between items-center gap-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenEditModal(site)}
                      className="p-3.5 bg-cyber-bg border border-cyber-border text-cyber-muted hover:text-white hover:border-cyber-muted rounded-xl transition-all duration-200 cursor-pointer"
                      title="Edit Target Settings"
                      disabled={isScanning}
                    >
                      <Edit2 className="h-4.5 w-4.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteWebsite(site.id)}
                      className="p-3.5 bg-red-950/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-black rounded-xl transition-all duration-200 cursor-pointer"
                      title="Delete Target"
                      disabled={isScanning}
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>

                  <div className="flex gap-2">
                    {site.status !== 'unscanned' && (
                      <button
                        onClick={() => navigate(`/scans/website/${site.id}`)}
                        className="flex items-center gap-1.5 px-5 py-3 bg-cyber-bg border border-cyber-border text-white text-[13px] font-mono font-bold uppercase tracking-wider rounded-xl hover:bg-cyber-border transition-all duration-200 cursor-pointer"
                        disabled={isScanning}
                      >
                        <History className="h-4 w-4" />
                        Logs
                      </button>
                    )}

                    <button
                      onClick={() => handleRunScan(site.id)}
                      disabled={isScanning}
                      className="flex items-center gap-1.5 px-6 py-3 bg-cyber-primary hover:bg-emerald-600 text-black text-[13px] font-mono font-black uppercase tracking-wider rounded-xl shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:scale-[1.02]"
                    >
                      {isScanning ? (
                        <>
                          <Loader className="h-4 w-4 animate-spin" />
                          Scanning
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4" />
                          Scan Node
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD TARGET MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-cyber-card border border-cyber-border rounded-2xl w-full max-w-xl overflow-hidden relative shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-[4px] bg-cyber-primary"></div>
            
            <div className="p-7 flex justify-between items-center border-b border-cyber-border/80">
              <h3 className="text-xl font-bold text-white flex items-center gap-2.5">
                <Globe className="h-6 w-6 text-cyber-primary" />
                Register New Target Node
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-cyber-muted hover:text-white transition-all cursor-pointer"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleAddWebsite} className="p-8 space-y-7">
              {formError && (
                <div className="p-4 bg-red-950/20 border border-red-500/20 text-red-400 rounded-xl text-[14px]">
                  {formError}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[13px] font-semibold text-cyber-muted/80 uppercase font-mono tracking-widest block">Node Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Corporate Landing Page"
                  className="w-full px-5 py-4 bg-cyber-bg border border-cyber-border rounded-xl text-base text-white focus:outline-none focus:border-cyber-primary focus:ring-1 focus:ring-cyber-primary transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-semibold text-cyber-muted/80 uppercase font-mono tracking-widest block">Target URL</label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="e.g. https://www.company.com"
                  className="w-full px-5 py-4 bg-cyber-bg border border-cyber-border rounded-xl text-base text-white focus:outline-none focus:border-cyber-primary focus:ring-1 focus:ring-cyber-primary transition-all font-mono"
                  required
                />
                <span className="text-xs text-cyber-muted/70 font-mono block mt-1">Must be a reachable HTTP/HTTPS URL.</span>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-cyber-border/80">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-6 py-3.5 bg-cyber-bg border border-cyber-border rounded-xl text-[15px] font-bold hover:bg-cyber-border text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3.5 bg-cyber-primary hover:bg-emerald-600 text-black text-[15px] font-bold rounded-xl disabled:opacity-50 cursor-pointer shadow-md transition-transform duration-200"
                >
                  {submitting ? 'Registering...' : 'Register Target'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TARGET MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-cyber-card border border-cyber-border rounded-2xl w-full max-w-xl overflow-hidden relative shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-[4px] bg-cyber-primary"></div>
            
            <div className="p-7 flex justify-between items-center border-b border-cyber-border/80">
              <h3 className="text-xl font-bold text-white flex items-center gap-2.5">
                <Settings className="h-6 w-6 text-cyber-primary" />
                Configure Target Settings
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-cyber-muted hover:text-white transition-all cursor-pointer"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleEditWebsite} className="p-8 space-y-7">
              {formError && (
                <div className="p-4 bg-red-950/20 border border-red-500/20 text-red-400 rounded-xl text-[14px]">
                  {formError}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[13px] font-semibold text-cyber-muted/80 uppercase font-mono tracking-widest block">Node Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-5 py-4 bg-cyber-bg border border-cyber-border rounded-xl text-base text-white focus:outline-none focus:border-cyber-primary focus:ring-1 focus:ring-cyber-primary transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-semibold text-cyber-muted/80 uppercase font-mono tracking-widest block">Target URL</label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-5 py-4 bg-cyber-bg border border-cyber-border rounded-xl text-base text-white focus:outline-none focus:border-cyber-primary focus:ring-1 focus:ring-cyber-primary transition-all font-mono"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-cyber-border/80">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-6 py-3.5 bg-cyber-bg border border-cyber-border rounded-xl text-[15px] font-bold hover:bg-cyber-border text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3.5 bg-cyber-primary hover:bg-emerald-600 text-black text-[15px] font-bold rounded-xl disabled:opacity-50 cursor-pointer shadow-md transition-transform duration-200"
                >
                  {submitting ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Websites;
