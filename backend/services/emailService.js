const nodemailer = require('nodemailer');
const { generateEmailHTML } = require('../utils/emailTemplate');
require('dotenv').config();

/**
 * Dispatch an email alert using Nodemailer SMTP configuration.
 * @param {object} params
 * @param {string} params.website - Name of target website
 * @param {string} params.ownerEmail - Destination address
 * @param {number} params.score - Calculated threat level score
 * @param {string} params.riskLevel - Word description of severity
 * @param {string[]} params.vulnerabilities - List of security failures
 * @param {string} params.reportUrl - URL reference to view scan
 */
const sendAlertEmail = async ({ website, ownerEmail, score, riskLevel, vulnerabilities, reportUrl }) => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    throw new Error('SMTP Config Error: EMAIL_USER or EMAIL_PASS environment variables are missing.');
  }

  // Create transporter configuration (Gmail SMTP)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass
    }
  });

  // Compile mail headers and HTML payload
  const mailOptions = {
    from: `"CIPHERUNIT Alerts" <${emailUser}>`,
    to: ownerEmail,
    subject: `🚨 [SECURITY ALERT] Critical risk detected on target: ${website} (Threat Score: ${score}/100)`,
    html: generateEmailHTML(website, score, riskLevel, vulnerabilities, reportUrl)
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
};

module.exports = { sendAlertEmail };
