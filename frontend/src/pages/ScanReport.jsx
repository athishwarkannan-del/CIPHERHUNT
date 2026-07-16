import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { scanService, emailService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import DiffViewer from '../components/DiffViewer';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Globe,
  Clock,
  ExternalLink,
  Cpu,
  CheckCircle,
  XCircle,
  FileText
} from 'lucide-react';

const ScanReport = () => {
  const { id, websiteId } = useParams();
  const navigate = useNavigate();

  const [scan, setScan] = useState(null);
  const [scansList, setScansList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { user } = useAuth();
  const [emailStatus, setEmailStatus] = useState('');

  const handleSendEmail = async () => {
    if (!scan) return;
    setEmailStatus('sending');
    try {
      const vulnerabilities = [];
      if (scan.security_headers) {
        const headerLabels = {
          https: 'Missing HTTPS Protocol',
          hsts: 'Missing Strict-Transport-Security (HSTS)',
          csp: 'Missing Content-Security-Policy (CSP)',
          xFrameOptions: 'Missing X-Frame-Options (Clickjacking)',
          xContentTypeOptions: 'Missing X-Content-Type-Options (Sniffing)',
          referrerPolicy: 'Missing Referrer-Policy',
          permissionsPolicy: 'Missing Permissions-Policy'
        };
        Object.keys(headerLabels).forEach(key => {
          if (!scan.security_headers[key]) {
            vulnerabilities.push(headerLabels[key]);
          }
        });
      }
      if (scan.html_changed) vulnerabilities.push('HTML defacement pattern matched baseline differences.');
      if (scan.title_changed) vulnerabilities.push('Website title mismatch (hijack warning).');
      if (scan.suspicious_text_detected) vulnerabilities.push(`Suspicious text: ${scan.suspicious_text_details}`);

      const payload = {
        website: scan.websites?.name || 'Website Asset',
        ownerEmail: user?.email || 'athishwarkannan@gmail.com',
        score: scan.risk_score,
        riskLevel: scan.severity,
        vulnerabilities,
        reportUrl: window.location.href
      };

      const response = await emailService.sendAlert(payload);
      if (response.success) {
        setEmailStatus('sent');
        setTimeout(() => setEmailStatus(''), 3000);
      } else {
        setEmailStatus('failed');
        setTimeout(() => setEmailStatus(''), 3000);
      }
    } catch (err) {
      console.error('Failed to send alert email:', err);
      setEmailStatus('failed');
      setTimeout(() => setEmailStatus(''), 3000);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        if (id) {
          // Fetch single scan details
          const response = await scanService.getById(id);
          if (response.success) {
            setScan(response.data);
          }
        } else if (websiteId) {
          // Fetch scan history list for website
          const response = await scanService.getByWebsite(websiteId);
          if (response.success) {
            setScansList(response.data);
          }
        }
      } catch (err) {
        console.error('Error fetching scan data:', err);
        setError('Failed to retrieve report information from database.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, websiteId]);

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

  if (error) {
    return (
      <div className="space-y-4 max-w-lg mx-auto text-center mt-12">
        <div className="p-4 bg-red-950/20 border border-red-500/20 text-red-400 rounded-xl">
          {error}
        </div>
        <button
          onClick={() => navigate('/websites')}
          className="inline-flex items-center gap-2 text-sm text-cyber-primary hover:underline font-mono"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Target Inventory
        </button>
      </div>
    );
  }

  // --- RENDER VIEW 1: SCANS HISTORY LIST FOR WEBSITE ---
  if (websiteId) {
    const hasNoScans = scansList.length === 0;
    const siteName = scansList[0]?.websites?.name || 'Website';
    const siteUrl = scansList[0]?.websites?.url;

    return (
      <div className="space-y-8 font-sans">
        <div>
          <button
            onClick={() => navigate('/websites')}
            className="inline-flex items-center gap-2 text-xs font-mono text-cyber-primary hover:underline mb-3"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to Inventory
          </button>
          <h2 className="text-2xl font-bold tracking-tight text-white">Scan Log History</h2>
          <p className="text-sm text-cyber-muted">Review previous security audits and baselines for {siteName}.</p>
        </div>

        {hasNoScans ? (
          <div className="border border-cyber-border bg-cyber-card rounded-2xl p-12 text-center text-cyber-muted font-mono text-sm">
            No scans recorded in history. Run a scan from the Target Inventory screen.
          </div>
        ) : (
          <div className="bg-cyber-card border border-cyber-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-cyber-border/40 border-b border-cyber-border text-cyber-muted font-mono text-xs uppercase tracking-wider">
                    <th className="p-4 pl-6">Scan Timestamp</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Response Time</th>
                    <th className="p-4">Defacement</th>
                    <th className="p-4">Risk Score</th>
                    <th className="p-4">Threat Level</th>
                    <th className="p-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyber-border/60">
                  {scansList.map((scanItem) => {
                    const hasChanges = scanItem.html_changed || scanItem.title_changed;
                    return (
                      <tr key={scanItem.id} className="hover:bg-cyber-border/20 transition-all font-mono">
                        <td className="p-4 pl-6 text-white font-semibold">
                          {new Date(scanItem.scanned_at).toLocaleString()}
                        </td>
                        <td className="p-4">
                          <span className={scanItem.status_code === 200 ? 'text-cyber-primary' : 'text-cyber-danger'}>
                            HTTP {scanItem.status_code || 'OFFLINE'}
                          </span>
                        </td>
                        <td className="p-4 text-purple-400">{scanItem.response_time}ms</td>
                        <td className="p-4">
                          <span className={hasChanges ? 'text-cyber-danger font-bold' : 'text-cyber-primary'}>
                            {hasChanges ? 'DEFACED' : 'INTEGRA SAFE'}
                          </span>
                        </td>
                        <td className="p-4 font-bold">
                          <span className={
                            scanItem.risk_score >= 70 ? 'text-cyber-danger' : (scanItem.risk_score >= 40 ? 'text-cyber-warning' : 'text-cyber-primary')
                          }>
                            {scanItem.risk_score}/100
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                            scanItem.severity === 'critical' || scanItem.severity === 'high'
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                              : (scanItem.severity === 'medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20')
                          }`}>
                            {scanItem.severity}
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <Link
                            to={`/scans/${scanItem.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-cyber-primary hover:bg-emerald-600 text-black text-xs font-sans font-semibold rounded-lg transition-all"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            Report
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- RENDER VIEW 2: SINGLE SCAN DETAILED REPORT ---
  const headerKeys = [
    { key: 'https', label: 'HTTPS Protocol Enforced', penalty: 30 },
    { key: 'hsts', label: 'Strict-Transport-Security (HSTS)', penalty: 10 },
    { key: 'csp', label: 'Content-Security-Policy (CSP)', penalty: 20 },
    { key: 'xFrameOptions', label: 'X-Frame-Options (Clickjacking)', penalty: 15 },
    { key: 'xContentTypeOptions', label: 'X-Content-Type-Options (Sniffing)', penalty: 10 },
    { key: 'referrerPolicy', label: 'Referrer-Policy Header', penalty: 5 },
    { key: 'permissionsPolicy', label: 'Permissions-Policy Header', penalty: 5 }
  ];

  const hasDefacementAlert = scan.html_changed || scan.title_changed;

  return (
    <div className="space-y-8 font-sans pb-16">
      {/* Header bar */}
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <button
            onClick={() => navigate(`/scans/website/${scan.website_id}`)}
            className="inline-flex items-center gap-2 text-xs font-mono text-cyber-primary hover:underline mb-3 cursor-pointer"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to Scan Logs
          </button>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            Threat Analysis Report
          </h2>
          <div className="flex flex-wrap items-center gap-3 text-xs text-cyber-muted font-mono mt-1.5">
            <span className="flex items-center gap-1">
              <Globe className="h-3.5 w-3.5 text-cyber-primary" />
              {scan.websites?.name}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(scan.scanned_at).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {scan.risk_score >= 80 && (
            <button
              onClick={handleSendEmail}
              disabled={emailStatus === 'sending'}
              className="flex items-center gap-2 px-6 py-3.5 bg-red-950/20 border border-red-500/30 rounded-xl text-[13px] font-mono text-red-400 hover:bg-red-500/10 transition-all duration-200 cursor-pointer disabled:opacity-50"
            >
              {emailStatus === '' && 'Send Alert Email'}
              {emailStatus === 'sending' && '📧 Sending...'}
              {emailStatus === 'sent' && '✅ Email Sent'}
              {emailStatus === 'failed' && '❌ Failed to Send'}
            </button>
          )}

          <a
            href={scan.websites?.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-6 py-3.5 border border-cyber-border rounded-xl text-[13px] font-mono text-white hover:bg-cyber-border transition-all duration-200"
          >
            Visit Site Node
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* KPI Stats Panel - Upgraded padding, hover animation effects, and value fonts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-cyber-card border border-cyber-border rounded-2xl p-7 md:p-8 flex flex-col justify-center items-center text-center shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <span className="text-[11px] uppercase font-semibold text-cyber-muted/80 tracking-widest mb-1.5">Threat Score</span>
          <span className={`text-5xl font-extrabold font-mono leading-none ${
            scan.risk_score >= 70 ? 'text-cyber-danger' : (scan.risk_score >= 40 ? 'text-cyber-warning' : 'text-cyber-primary')
          }`}>
            {scan.risk_score}/100
          </span>
          <span className="text-[11px] font-mono text-cyber-muted mt-2.5">GEMINI AI EVALUATED</span>
        </div>

        <div className="bg-cyber-card border border-cyber-border rounded-2xl p-7 md:p-8 flex flex-col justify-center items-center text-center shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <span className="text-[11px] uppercase font-semibold text-cyber-muted/80 tracking-widest mb-1.5">Threat Level</span>
          <span className={`text-base uppercase font-extrabold tracking-widest px-4.5 py-2 rounded-xl border ${
            scan.severity === 'critical' || scan.severity === 'high'
              ? 'bg-red-500/10 text-red-400 border-red-500/20'
              : (scan.severity === 'medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20')
          }`}>
            {scan.severity}
          </span>
          <span className="text-[11px] font-mono text-cyber-muted mt-3">SEVERITY VALUE</span>
        </div>

        <div className="bg-cyber-card border border-cyber-border rounded-2xl p-7 md:p-8 flex flex-col justify-center items-center text-center shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <span className="text-[11px] uppercase font-semibold text-cyber-muted/80 tracking-widest mb-1.5">Defacement Status</span>
          <span className={`text-base font-bold flex items-center gap-2 px-4 py-2 rounded-xl border ${
            hasDefacementAlert ? 'bg-red-500/10 text-cyber-danger border-red-500/20 font-bold tracking-wide' : 'bg-emerald-500/10 text-cyber-primary border-emerald-500/20 font-semibold'
          }`}>
            {hasDefacementAlert ? (
              <>
                <AlertTriangle className="h-5 w-5 shrink-0 animate-bounce" />
                Defacement Alert
              </>
            ) : (
              <>
                <ShieldCheck className="h-5 w-5 shrink-0" />
                Integrity Secure
              </>
            )}
          </span>
          <span className="text-[11px] font-mono text-cyber-muted mt-3">STRUCTURE & TITLE COMPARE</span>
        </div>
      </div>

      {/* Gemini AI explanation - Increased container padding and typography */}
      <div className="bg-cyber-card border border-cyber-border rounded-2xl p-7 md:p-8 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 bg-cyber-primary/5 border-l border-b border-cyber-border/80 px-3.5 py-1.5 text-[10px] font-mono uppercase tracking-widest text-cyber-primary flex items-center gap-1.5 rounded-bl-lg">
          <Cpu className="h-3.5 w-3.5" />
          Gemini Security Analyzer {scan.ai_confidence && `(Confidence: ${scan.ai_confidence}%)`}
        </div>
        <h3 className="text-xl font-bold text-white border-b border-cyber-border/80 pb-5 mb-5">
          Analysis Justification
        </h3>
        <p className="text-base leading-relaxed text-cyber-text/90 font-sans">
          {scan.ai_explanation}
        </p>
      </div>

      {/* Security Headers Breakdown Table */}
      <div className="bg-cyber-card border border-cyber-border rounded-2xl p-7 md:p-8 shadow-xl">
        <h3 className="text-xl font-bold text-white border-b border-cyber-border/80 pb-5 mb-6">
          HTTP Response Header Audit
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[15px] font-mono">
            <thead>
              <tr className="border-b border-cyber-border/80 text-cyber-muted uppercase text-xs tracking-widest">
                <th className="pb-4 font-bold">Security Metric</th>
                <th className="pb-4 font-bold">Audit Verdict</th>
                <th className="pb-4 font-bold">Impact Details</th>
                <th className="pb-4 font-bold text-right">Risk Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyber-border/40">
              {headerKeys.map((item) => {
                const headerStatus = scan.security_headers?.[item.key];
                const headerDetail = scan.security_headers?.details?.[item.key];

                return (
                  <tr key={item.key} className="hover:bg-cyber-border/10">
                    <td className="py-5 text-white font-semibold">{item.label}</td>
                    <td className="py-5">
                      {headerStatus ? (
                        <span className="text-cyber-primary flex items-center gap-1.5 font-bold">
                          <CheckCircle className="h-4.5 w-4.5" />
                          COMPLIANT
                        </span>
                      ) : (
                        <span className="text-cyber-danger flex items-center gap-1.5 font-bold">
                          <XCircle className="h-4.5 w-4.5" />
                          VULNERABLE
                        </span>
                      )}
                    </td>
                    <td className="py-5 text-xs text-cyber-muted max-w-sm font-sans leading-relaxed">{headerDetail || 'No details analyzed.'}</td>
                    <td className={`py-5 text-right font-bold ${headerStatus ? 'text-cyber-muted' : 'text-cyber-danger'}`}>
                      {headerStatus ? '0' : `+${item.penalty}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gemini AI Recommendations - Larger list items */}
      {scan.ai_recommendations && scan.ai_recommendations.length > 0 && (
        <div className="bg-cyber-card border border-cyber-border rounded-2xl p-7 md:p-8 shadow-xl">
          <h3 className="text-xl font-bold text-white border-b border-cyber-border/80 pb-5 mb-6">
            Prioritized Risk Mitigations
          </h3>
          <div className="space-y-5">
            {scan.ai_recommendations.map((rec, index) => {
              let badgeColor = 'bg-cyber-border/40 text-cyber-muted border-cyber-border';
              if (rec.priority === 'high') {
                badgeColor = 'bg-red-500/10 text-red-400 border-red-500/20';
              } else if (rec.priority === 'medium') {
                badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
              } else if (rec.priority === 'low') {
                badgeColor = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
              }

              return (
                <div key={index} className="p-6 bg-cyber-bg/60 border border-cyber-border rounded-xl flex flex-col md:flex-row gap-4 justify-between items-start md:items-center hover:border-cyber-primary/20 transition-all duration-200">
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center gap-2.5">
                      <span className={`text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-md border ${badgeColor}`}>
                        {rec.priority} Priority
                      </span>
                      <h4 className="text-base font-bold text-white">{rec.issue}</h4>
                    </div>
                    <p className="text-[14px] text-cyber-muted leading-relaxed font-sans">{rec.fix}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Defacement details and Diff Viewer - Expanded visual styles */}
      {hasDefacementAlert && (
        <div className="space-y-8">
          <div className="bg-red-950/15 border border-red-500/20 rounded-2xl p-7 md:p-8 space-y-5 shadow-lg">
            <h3 className="text-xl font-bold text-red-400 flex items-center gap-2.5">
              <AlertTriangle className="h-6 w-6 animate-pulse" />
              Defacement Flags Triggered
            </h3>
            <ul className="list-disc list-inside text-sm text-red-200 font-mono space-y-2.5">
              {scan.title_changed && (
                <li>
                  <strong className="text-red-400">Title Modification:</strong> Page title changed from baseline.
                </li>
              )}
              {scan.html_changed && (
                <li>
                  <strong className="text-red-400">Content Integrity:</strong> Body HTML changed from baseline state.
                </li>
              )}
              {scan.suspicious_text_detected && (
                <li>
                  <strong className="text-red-400">Suspicious Keywords:</strong> Defacement keywords detected. {scan.suspicious_text_details}
                </li>
              )}
              {scan.missing_elements && scan.missing_elements.length > 0 && (
                <li>
                  <strong className="text-red-400">Missing Elements:</strong> The following tags disappeared: {scan.missing_elements.map(e => e.label).join(', ')}.
                </li>
              )}
            </ul>
          </div>

          {/* Title Compare */}
          <div className="space-y-4">
            <h4 className="text-base font-bold text-white font-mono uppercase tracking-widest">Page Title Integrity</h4>
            <DiffViewer
              oldText={scan.websites?.baseline_title}
              newText={scan.title}
              type="title"
            />
          </div>

          {/* HTML Diff Viewer */}
          <div className="space-y-4">
            <h4 className="text-base font-bold text-white font-mono uppercase tracking-widest">HTML Diff Matrix</h4>
            <DiffViewer
              oldText={scan.websites?.baseline_html}
              newText={scan.html}
              type="html"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ScanReport;
