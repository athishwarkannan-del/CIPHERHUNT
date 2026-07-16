/**
 * Generate a professional HTML security alert email template.
 * @param {string} website - Name of target website
 * @param {number} score - Threat score (0-100)
 * @param {string} riskLevel - Risk tier (e.g. HIGH, CRITICAL)
 * @param {string[]} vulnerabilities - Array of identified threat issues
 * @param {string} reportUrl - Full URL to view scan details
 * @returns {string} Fully styled HTML string
 */
const generateEmailHTML = (website, score, riskLevel, vulnerabilities, reportUrl) => {
  const vulnerabilitiesLi = Array.isArray(vulnerabilities) && vulnerabilities.length > 0
    ? vulnerabilities.map(v => `<li style="margin-bottom: 8px; color: #e5e7eb;">${v}</li>`).join('')
    : '<li style="color: #9ca3af; font-style: italic;">No static headers vulnerabilities identified. Defacement risk active.</li>';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>CIPHERUNIT Threat Alert</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0b0f19; color: #f3f4f6; margin: 0; padding: 20px;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #111827; border: 1px solid #1f2937; border-top: 4px solid #ef4444; border-radius: 12px; overflow: hidden; margin: 0 auto; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.35);">
          <!-- Header -->
          <tr>
            <td style="padding: 25px 40px; border-bottom: 1px solid #1f2937; text-align: center; background-color: #0f172a;">
              <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 0; letter-spacing: 1px;">
                CIPHER<span style="color: #10b981;">UNIT</span>
              </h1>
              <p style="color: #9ca3af; font-size: 10px; text-transform: uppercase; font-family: monospace; letter-spacing: 2.5px; margin: 4px 0 0 0;">
                Threat Intelligence Hub
              </p>
            </td>
          </tr>
          
          <!-- Content Body -->
          <tr>
            <td style="padding: 35px 40px;">
              <h2 style="color: #ef4444; font-size: 18px; font-weight: 700; margin-top: 0; margin-bottom: 15px; text-align: center; letter-spacing: 0.5px;">
                ⚠️ CRITICAL SECURITY WARNING
              </h2>
              
              <p style="color: #9ca3af; font-size: 13px; line-height: 1.6; margin-bottom: 25px; text-align: center;">
                An automated scan has flagged a high-risk security status on one of your target web nodes. Review the vulnerabilities below.
              </p>
              
              <!-- Metrics Grid -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 25px;">
                <tr>
                  <td width="50%" style="padding-right: 8px;">
                    <div style="background-color: #1f2937; border: 1px solid #374151; border-radius: 8px; padding: 12px; text-align: center;">
                      <span style="display: block; font-size: 9px; text-transform: uppercase; color: #9ca3af; font-family: monospace; margin-bottom: 4px;">Threat Risk Score</span>
                      <strong style="font-size: 24px; color: #ef4444; font-family: monospace;">${score}/100</strong>
                    </div>
                  </td>
                  <td width="50%" style="padding-left: 8px;">
                    <div style="background-color: #1f2937; border: 1px solid #374151; border-radius: 8px; padding: 12px; text-align: center;">
                      <span style="display: block; font-size: 9px; text-transform: uppercase; color: #9ca3af; font-family: monospace; margin-bottom: 4px;">Audited Severity</span>
                      <strong style="font-size: 13px; color: #ef4444; text-transform: uppercase; letter-spacing: 0.5px; font-family: sans-serif;">${riskLevel}</strong>
                    </div>
                  </td>
                </tr>
              </table>
              
              <!-- Target Assets Details -->
              <div style="background-color: #0b0f19; border: 1px solid #1f2937; border-radius: 8px; padding: 18px; margin-bottom: 30px;">
                <p style="margin-top: 0; margin-bottom: 6px; font-size: 11px; color: #9ca3af; font-family: monospace;">TARGET ASSET:</p>
                <strong style="color: #ffffff; font-size: 15px; display: block; margin-bottom: 18px; word-break: break-all;">${website}</strong>
                
                <p style="margin-top: 0; margin-bottom: 8px; font-size: 11px; color: #9ca3af; font-family: monospace;">DETECTED VULNERABILITIES:</p>
                <ul style="margin: 0; padding-left: 18px; font-size: 13px; line-height: 1.6; color: #d1d5db;">
                  ${vulnerabilitiesLi}
                </ul>
              </div>
              
              <!-- Call to Action -->
              <div style="text-align: center;">
                <a href="${reportUrl}" target="_blank" style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: #000000; font-size: 13px; font-weight: 700; text-decoration: none; border-radius: 6px; letter-spacing: 0.5px;">
                  INSPECT DETAILED REPORT
                </a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; border-top: 1px solid #1f2937; background-color: #0b0f19; text-align: center; font-size: 10px; color: #4b5563; font-family: monospace; line-height: 1.4;">
              This is an automated alert generated by the CIPHERUNIT Security Engine.<br>
              Do not reply directly to this mail. Secure Link.
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
};

module.exports = { generateEmailHTML };
