const { supabase } = require('../utils/supabaseClient');

// @desc    Get user's platform audit logs
// @route   GET /api/audit
// @access  Private
const getAuditLogs = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*, websites(name, url)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    console.error('getAuditLogs controller error:', error);
    res.status(500).json({ success: false, error: 'Server error retrieving audit logs' });
  }
};

module.exports = {
  getAuditLogs
};
