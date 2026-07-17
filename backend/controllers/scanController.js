const axios = require('axios');
const cheerio = require('cheerio');
const { supabase } = require('../utils/supabaseClient');
const { analyzeHeaders } = require('../utils/securityScanner');
const { detectDefacement } = require('../utils/defacementDetector');
const { analyzeWithGemini } = require('../utils/geminiAnalyzer');
const { validateUrlForSSRF } = require('../utils/ssrfProtector');
const { sendAlertEmail } = require('../services/emailService');

// @desc    Get scan history for a website
// @route   GET /api/scans/website/:websiteId
// @access  Private
const getScansByWebsite = async (req, res) => {
  const { websiteId } = req.params;

  try {
    // Confirm ownership
    const { data: website, error: webError } = await supabase
      .from('websites')
      .select('id')
      .eq('id', websiteId)
      .eq('user_id', req.user.id)
      .single();

    if (webError || !website) {
      return res.status(404).json({ success: false, error: 'Website not found or unauthorized' });
    }

    const { data, error } = await supabase
      .from('scan_history') // Query scan_history table
      .select('*')
      .eq('website_id', websiteId)
      .order('scanned_at', { ascending: false });

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    console.error('getScansByWebsite error:', error);
    res.status(500).json({ success: false, error: 'Server error retrieving scan history' });
  }
};

// @desc    Get detailed report for a specific scan
// @route   GET /api/scans/:id
// @access  Private
const getScanById = async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from('scan_history') // Query scan_history table
      .select('*, websites(name, url, baseline_html, baseline_title, baseline_headers)')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, error: 'Scan report not found' });
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('getScanById error:', error);
    res.status(500).json({ success: false, error: 'Server error retrieving scan report' });
  }
};

// @desc    Run automated scanner and defacement/vulnerability checks on a website
// @route   POST /api/scans/:websiteId
// @access  Private
const runScan = async (req, res) => {
  const { websiteId } = req.params;

  try {
    // 1. Fetch website and confirm ownership
    const { data: website, error: webError } = await supabase
      .from('websites')
      .select('*')
      .eq('id', websiteId)
      .eq('user_id', req.user.id)
      .single();

    if (webError || !website) {
      return res.status(404).json({ success: false, error: 'Website not found or unauthorized' });
    }

    const targetUrl = website.url;

    // SSRF Prevention validation
    const isSafeUrl = await validateUrlForSSRF(targetUrl);
    if (!isSafeUrl) {
      return res.status(400).json({
        success: false,
        error: 'Security Alert: Forbidden target URL. Scans targeting loopback, multicast, or private IP networks are blocked.'
      });
    }

    let statusCode = 0;
    let responseTime = 0;
    let html = '';
    let title = '';
    let responseHeaders = {};

    // 2. Fetch live website contents
    const startTime = Date.now();
    try {
      const response = await axios.get(targetUrl, {
        timeout: 8000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) CIPHERUNIT-SecurityScanner/1.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        },
        validateStatus: () => true // Allow any status code to complete request
      });

      responseTime = Date.now() - startTime;
      statusCode = response.status;
      responseHeaders = response.headers;
      html = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);

      // Parse HTML title
      const $ = cheerio.load(html);
      title = $('title').text().trim() || 'No Title';
    } catch (fetchError) {
      console.error(`Axios scan fetch failed for ${targetUrl}:`, fetchError.message);
      statusCode = 0;
      responseTime = Date.now() - startTime;
      title = 'Website Unreachable';
      html = `Failed to establish connection to: ${targetUrl}. Error: ${fetchError.message}`;
      responseHeaders = {};
    }

    // 3. Static Security Header Vulnerability Scan
    const securityHeaderCheck = analyzeHeaders(targetUrl, responseHeaders);

    // 4. Defacement Detection (Compare with baseline if it exists)
    const defacementCheck = detectDefacement(
      website.baseline_html,
      html,
      website.baseline_title,
      title
    );

    // 5. Gemini AI Analysis
    const initialRiskScore = securityHeaderCheck.calculatedRiskScore + defacementCheck.defacement_risk_delta;
    const aiAnalysisResult = await analyzeWithGemini({
      url: targetUrl,
      title,
      status_code: statusCode,
      response_time: responseTime,
      headers: responseHeaders,
      html,
      defacement: defacementCheck,
      initial_risk_score: Math.min(initialRiskScore, 100)
    });

    const finalRiskScore = aiAnalysisResult.risk_score;
    const severity = aiAnalysisResult.severity;

    // Determine status of website based on findings
    let websiteStatus = 'safe';
    if (defacementCheck.title_changed || defacementCheck.suspicious_text_detected) {
      websiteStatus = 'defaced';
    } else if (finalRiskScore > 70) {
      websiteStatus = 'vulnerable';
    } else if (finalRiskScore > 35) {
      websiteStatus = 'vulnerable';
    }

    // 6. Save Scan History
    const { data: scan, error: scanInsertError } = await supabase
      .from('scan_history') // Insert to scan_history table
      .insert({
        website_id: websiteId,
        user_id: req.user.id,
        status_code: statusCode,
        response_time: responseTime,
        title,
        html,
        html_changed: defacementCheck.html_changed,
        title_changed: defacementCheck.title_changed,
        missing_elements: defacementCheck.missing_elements,
        suspicious_text_detected: defacementCheck.suspicious_text_detected,
        suspicious_text_details: defacementCheck.suspicious_text_details,
        risk_score: finalRiskScore,
        severity,
        security_headers: securityHeaderCheck,
        ai_explanation: aiAnalysisResult.explanation,
        ai_recommendations: aiAnalysisResult.recommendations,
        ai_confidence: aiAnalysisResult.confidence || 100 // Save confidence
      })
      .select()
      .single();

    if (scanInsertError) {
      return res.status(400).json({ success: false, error: scanInsertError.message });
    }

    // 7. Manage Baseline & Update Website
    const isFirstScan = !website.baseline_html;
    const updatePayload = {
      last_scanned_at: new Date().toISOString(),
      status: websiteStatus,
      risk_score: finalRiskScore
    };

    if (isFirstScan && statusCode === 200) {
      updatePayload.baseline_html = html;
      updatePayload.baseline_title = title;
      updatePayload.baseline_headers = responseHeaders;
    }

    await supabase
      .from('websites')
      .update(updatePayload)
      .eq('id', websiteId);

    // 8. Generate Alerts
    const alertsToCreate = [];
    const auditLogsToCreate = [];

    // Alert 1: Website Defacement Changed (Only if baseline existed)
    if (!isFirstScan && (defacementCheck.title_changed || defacementCheck.suspicious_text_detected)) {
      alertsToCreate.push({
        website_id: websiteId,
        user_id: req.user.id,
        scan_id: scan.id,
        type: 'defacement',
        message: `Potential defacement detected on ${website.name}! ${defacementCheck.title_changed ? 'Title changed.' : ''} ${defacementCheck.suspicious_text_detected ? 'Suspicious keywords: ' + defacementCheck.suspicious_text_details : ''}`,
        severity: 'critical' // Critical severity for defacements
      });
      auditLogsToCreate.push({
        user_id: req.user.id,
        website_id: websiteId,
        action: 'ALERT_GENERATED',
        details: `Defacement alert generated for ${website.name}.`,
        ip_address: req.ip
      });
    }

    // Alert 2: High Risk Score (Risk >= 70)
    if (finalRiskScore >= 70) {
      alertsToCreate.push({
        website_id: websiteId,
        user_id: req.user.id,
        scan_id: scan.id,
        type: 'high_risk',
        message: `High risk vulnerabilities identified on ${website.name}. Threat Risk Score: ${finalRiskScore}/100.`,
        severity: 'high' // High severity
      });
      auditLogsToCreate.push({
        user_id: req.user.id,
        website_id: websiteId,
        action: 'ALERT_GENERATED',
        details: `High risk alert generated for ${website.name} (Risk: ${finalRiskScore}).`,
        ip_address: req.ip
      });
    }

    // Alert 3: Missing HTTPS
    if (!securityHeaderCheck.https) {
      alertsToCreate.push({
        website_id: websiteId,
        user_id: req.user.id,
        scan_id: scan.id,
        type: 'missing_https',
        message: `Insecure protocol! ${website.name} does not enforce HTTPS.`,
        severity: 'medium' // Medium severity
      });
      auditLogsToCreate.push({
        user_id: req.user.id,
        website_id: websiteId,
        action: 'ALERT_GENERATED',
        details: `Protocol alert generated: HTTPS missing on ${website.name}.`,
        ip_address: req.ip
      });
    }

    // Alert 4: Missing Critical Security Headers (CSP or HSTS)
    if (!securityHeaderCheck.csp || (securityHeaderCheck.https && !securityHeaderCheck.hsts)) {
      const missing = [];
      if (!securityHeaderCheck.csp) missing.push('Content-Security-Policy');
      if (securityHeaderCheck.https && !securityHeaderCheck.hsts) missing.push('Strict-Transport-Security (HSTS)');
      
      alertsToCreate.push({
        website_id: websiteId,
        user_id: req.user.id,
        scan_id: scan.id,
        type: 'security_headers',
        message: `Missing critical security headers on ${website.name}: ${missing.join(', ')}.`,
        severity: 'low' // Low severity
      });
      auditLogsToCreate.push({
        user_id: req.user.id,
        website_id: websiteId,
        action: 'ALERT_GENERATED',
        details: `Headers compliance alert generated: missing [${missing.join(', ')}] on ${website.name}.`,
        ip_address: req.ip
      });
    }

    if (alertsToCreate.length > 0) {
      await supabase.from('alerts').insert(alertsToCreate);
    }

    // Insert alert audit logs
    if (auditLogsToCreate.length > 0) {
      await supabase.from('audit_logs').insert(auditLogsToCreate);
    }

    // AI Analysis audit log
    await supabase.from('audit_logs').insert({
      user_id: req.user.id,
      website_id: websiteId,
      action: 'AI_ANALYSIS',
      details: `Gemini AI completed threat evaluation on ${website.name}. Risk Score: ${finalRiskScore}, Confidence: ${aiAnalysisResult.confidence}%.`,
      ip_address: req.ip
    });

    // 9. Scan Run audit log
    await supabase.from('audit_logs').insert({
      user_id: req.user.id,
      website_id: websiteId,
      action: 'SCAN_RUN',
      details: `Completed security scan on: ${website.name}. Status: ${statusCode}. Risk Score: ${finalRiskScore}.`,
      ip_address: req.ip
    });

    // 10. Automated Email Alert Notification
    if (finalRiskScore >= 80) {
      try {
        const vulnerabilities = [];
        if (defacementCheck.title_changed) vulnerabilities.push('Website title changed (Potential defacement)');
        if (defacementCheck.suspicious_text_detected) vulnerabilities.push('Suspicious keywords injected');
        if (!securityHeaderCheck.https) vulnerabilities.push('HTTPS not enforced');
        if (!securityHeaderCheck.csp) vulnerabilities.push('Content-Security-Policy missing');
        if (!securityHeaderCheck.hsts) vulnerabilities.push('HSTS missing');
        if (!securityHeaderCheck.xFrameOptions) vulnerabilities.push('X-Frame-Options missing (Clickjacking risk)');
        if (!securityHeaderCheck.xContentTypeOptions) vulnerabilities.push('X-Content-Type-Options missing');

        const reportUrl = `${req.headers.origin || 'http://localhost:3000'}/scans/${scan.id}`;

        // Send in the background asynchronously to prevent blocking the HTTP response
        sendAlertEmail({
          website: website.name,
          ownerEmail: req.user.email,
          score: finalRiskScore,
          riskLevel: severity,
          vulnerabilities,
          reportUrl
        })
        .then(() => {
          console.log(`[EMAIL] Auto-sent high risk alert email for ${website.name} to ${req.user.email}`);
        })
        .catch((emailErr) => {
          console.error('[EMAIL] Failed to auto-send alert email:', emailErr.message);
        });
      } catch (emailErr) {
        console.error('[EMAIL] Failed to compile auto-send alert email data:', emailErr.message);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Scan executed and analyzed successfully',
      data: scan
    });

  } catch (error) {
    console.error('runScan controller error:', error);
    res.status(500).json({ success: false, error: 'Server error executing scan engine' });
  }
};

module.exports = {
  getScansByWebsite,
  getScanById,
  runScan
};
