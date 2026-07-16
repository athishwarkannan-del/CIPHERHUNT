const express = require('express');
const router = express.Router();
const { sendAlertEmail } = require('../services/emailService');

// @desc    Send a security threat alert notification email
// @route   POST /api/email/send-alert
// @access  Public
router.post('/send-alert', async (req, res) => {
  const { website, ownerEmail, score, riskLevel, vulnerabilities, reportUrl } = req.body;

  // Basic validation check
  if (!website || !ownerEmail || score === undefined || !riskLevel || !reportUrl) {
    return res.status(400).json({
      success: false,
      error: 'Bad Request: Missing required email payload variables.'
    });
  }

  try {
    await sendAlertEmail({
      website,
      ownerEmail,
      score,
      riskLevel,
      vulnerabilities: vulnerabilities || [],
      reportUrl
    });

    res.status(200).json({
      success: true,
      message: 'Security threat alert email dispatched successfully.'
    });
  } catch (error) {
    console.error('[EMAIL ERROR] Alert route dispatch failure:', error);
    res.status(500).json({
      success: false,
      error: `Service Failure: ${error.message}`
    });
  }
});

module.exports = router;
