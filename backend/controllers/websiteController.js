const { supabase } = require('../utils/supabaseClient');

// @desc    Get all monitored websites for user
// @route   GET /api/websites
// @access  Private
const getWebsites = async (req, res) => {
  try {
    console.log('[DEBUG] getWebsites called by user ID:', req.user.id);
    const { data, error } = await supabase
      .from('websites')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    console.log('[DEBUG] getWebsites database response - rows found:', data ? data.length : 0);

    if (error) {
      console.error('[DEBUG] getWebsites database error:', error.message);
      return res.status(400).json({ success: false, error: error.message });
    }

    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    console.error('getWebsites controller error:', error);
    res.status(500).json({ success: false, error: 'Server error retrieving websites' });
  }
};

// @desc    Get a single website details
// @route   GET /api/websites/:id
// @access  Private
const getWebsiteById = async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('websites')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, error: 'Website not found' });
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('getWebsiteById controller error:', error);
    res.status(500).json({ success: false, error: 'Server error retrieving website' });
  }
};

// @desc    Add a website for monitoring
// @route   POST /api/websites
// @access  Private
const addWebsite = async (req, res) => {
  const { name, url } = req.body; // Removed description

  try {
    let targetUrl = url.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }

    // Prevent duplicate URLs for the same user
    const { data: duplicateCheck, error: checkError } = await supabase
      .from('websites')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('url', targetUrl);

    if (checkError) {
      return res.status(400).json({ success: false, error: checkError.message });
    }

    if (duplicateCheck && duplicateCheck.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Duplicate URL Node: This website URL is already registered under your account.'
      });
    }

    const { data, error } = await supabase
      .from('websites')
      .insert({
        user_id: req.user.id,
        name: name.trim(),
        url: targetUrl,
        status: 'unscanned'
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    // Log action
    await supabase.from('audit_logs').insert({
      user_id: req.user.id,
      website_id: data.id,
      action: 'WEBSITE_ADD',
      details: `Added website: ${name} (${targetUrl})`,
      ip_address: req.ip
    });

    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error('addWebsite controller error:', error);
    res.status(500).json({ success: false, error: 'Server error adding website' });
  }
};

// @desc    Update website details
// @route   PUT /api/websites/:id
// @access  Private
const updateWebsite = async (req, res) => {
  const { id } = req.params;
  const { name, url } = req.body; // Removed description

  try {
    // Confirm ownership
    const { data: checkData, error: checkError } = await supabase
      .from('websites')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (checkError || !checkData) {
      return res.status(404).json({ success: false, error: 'Website not found or unauthorized' });
    }

    let targetUrl = url.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }

    // Prevent duplicate URLs
    const { data: duplicateCheck, error: duplicateError } = await supabase
      .from('websites')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('url', targetUrl)
      .neq('id', id);

    if (duplicateError) {
      return res.status(400).json({ success: false, error: duplicateError.message });
    }

    if (duplicateCheck && duplicateCheck.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Duplicate URL Node: Another website is already registered with this URL.'
      });
    }

    const { data, error } = await supabase
      .from('websites')
      .update({
        name: name.trim(),
        url: targetUrl
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    // Log action
    await supabase.from('audit_logs').insert({
      user_id: req.user.id,
      website_id: id,
      action: 'WEBSITE_EDIT',
      details: `Updated website details: ${name} (${targetUrl})`,
      ip_address: req.ip
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('updateWebsite controller error:', error);
    res.status(500).json({ success: false, error: 'Server error updating website' });
  }
};

// @desc    Delete website
// @route   DELETE /api/websites/:id
// @access  Private
const deleteWebsite = async (req, res) => {
  const { id } = req.params;

  try {
    // Confirm ownership
    const { data: checkData, error: checkError } = await supabase
      .from('websites')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (checkError || !checkData) {
      return res.status(404).json({ success: false, error: 'Website not found or unauthorized' });
    }

    const { error } = await supabase
      .from('websites')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    // Log action
    await supabase.from('audit_logs').insert({
      user_id: req.user.id,
      action: 'WEBSITE_DELETE',
      details: `Deleted website: ${checkData.name} (${checkData.url})`,
      ip_address: req.ip
    });

    res.status(200).json({ success: true, message: 'Website and related scan logs deleted successfully' });
  } catch (error) {
    console.error('deleteWebsite controller error:', error);
    res.status(500).json({ success: false, error: 'Server error deleting website' });
  }
};

module.exports = {
  getWebsites,
  getWebsiteById,
  addWebsite,
  updateWebsite,
  deleteWebsite
};
