const { supabase } = require('../utils/supabaseClient');

// @desc    Get dashboard metrics and statistics
// @route   GET /api/dashboard
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Get monitored websites
    const { data: websites, error: webError } = await supabase
      .from('websites')
      .select('id, risk_score, status')
      .eq('user_id', userId);

    if (webError) {
      return res.status(400).json({ success: false, error: webError.message });
    }

    const protectedWebsites = websites.length;

    // 2. Count risk sub-categories
    let highRiskWebsites = 0;
    let criticalWebsites = 0;
    let scannedCount = 0;
    let totalRisk = 0;

    websites.forEach((site) => {
      if (site.status !== 'unscanned') {
        scannedCount++;
        totalRisk += site.risk_score;

        if (site.risk_score >= 85 || site.status === 'defaced') {
          criticalWebsites++;
        } else if (site.risk_score >= 70) {
          highRiskWebsites++;
        }
      }
    });

    const averageRisk = scannedCount > 0 ? Math.round(totalRisk / scannedCount) : 0;

    // 3. Get total scans count
    const { count: totalScans, error: scanCountError } = await supabase
      .from('scan_history') // Query scan_history table
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (scanCountError) {
      return res.status(400).json({ success: false, error: scanCountError.message });
    }

    // 4. Get the latest scan across all websites
    const { data: latestScans, error: latestScanError } = await supabase
      .from('scan_history') // Query scan_history table
      .select('*, websites(name, url)')
      .eq('user_id', userId)
      .order('scanned_at', { ascending: false })
      .limit(1);

    if (latestScanError) {
      return res.status(400).json({ success: false, error: latestScanError.message });
    }

    const latestScan = latestScans.length > 0 ? latestScans[0] : null;

    // 5. Get recent activity audit logs
    const { data: recentActivity, error: activityError } = await supabase
      .from('audit_logs')
      .select('*, websites(name, url)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(6);

    if (activityError) {
      return res.status(400).json({ success: false, error: activityError.message });
    }

    res.status(200).json({
      success: true,
      data: {
        protectedWebsites,
        totalScans: totalScans || 0,
        highRiskWebsites,
        criticalWebsites,
        latestScan,
        averageRisk,
        recentActivity
      }
    });
  } catch (error) {
    console.error('getDashboardStats controller error:', error);
    res.status(500).json({ success: false, error: 'Server error retrieving dashboard stats' });
  }
};

module.exports = {
  getDashboardStats
};
