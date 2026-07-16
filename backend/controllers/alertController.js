const { supabase } = require('../utils/supabaseClient');

// @desc    Get all alerts for the user
// @route   GET /api/alerts
// @access  Private
const getAlerts = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('alerts')
      .select('*, websites(name, url)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    console.error('getAlerts controller error:', error);
    res.status(500).json({ success: false, error: 'Server error retrieving alerts' });
  }
};

// @desc    Mark an alert as resolved
// @route   PUT /api/alerts/:id/resolve
// @access  Private
const resolveAlert = async (req, res) => {
  const { id } = req.params;

  try {
    const { data: alert, error: alertError } = await supabase
      .from('alerts')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (alertError || !alert) {
      return res.status(404).json({ success: false, error: 'Alert not found or unauthorized' });
    }

    const { data, error } = await supabase
      .from('alerts')
      .update({ resolved: true })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    // Log in audit log
    await supabase.from('audit_logs').insert({
      user_id: req.user.id,
      website_id: alert.website_id,
      action: 'ALERT_RESOLVE',
      details: `Resolved alert: "${alert.message}"`,
      ip_address: req.ip
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('resolveAlert controller error:', error);
    res.status(500).json({ success: false, error: 'Server error resolving alert' });
  }
};

// @desc    Delete an alert
// @route   DELETE /api/alerts/:id
// @access  Private
const deleteAlert = async (req, res) => {
  const { id } = req.params;

  try {
    // Confirm ownership
    const { data: alert, error: alertError } = await supabase
      .from('alerts')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (alertError || !alert) {
      return res.status(404).json({ success: false, error: 'Alert not found or unauthorized' });
    }

    const { error } = await supabase
      .from('alerts')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    // Log action
    await supabase.from('audit_logs').insert({
      user_id: req.user.id,
      website_id: alert.website_id,
      action: 'ALERT_DELETE',
      details: `Deleted alert: "${alert.message}"`,
      ip_address: req.ip
    });

    res.status(200).json({ success: true, message: 'Alert deleted successfully' });
  } catch (error) {
    console.error('deleteAlert controller error:', error);
    res.status(500).json({ success: false, error: 'Server error deleting alert' });
  }
};

module.exports = {
  getAlerts,
  resolveAlert,
  deleteAlert
};
