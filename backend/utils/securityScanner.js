const analyzeHeaders = (url, headers) => {
  const result = {
    https: url.startsWith('https://'),
    hsts: false,
    csp: false,
    xFrameOptions: false,
    xContentTypeOptions: false,
    referrerPolicy: false,
    permissionsPolicy: false,
    server: false, // Added Server header status
    details: {}
  };

  let riskScore = 0;

  // 1. HTTPS Check
  if (!result.https) {
    riskScore += 30;
    result.details.https = 'Site is not using HTTPS. All traffic is unencrypted.';
  } else {
    result.details.https = 'HTTPS is enabled.';
  }

  // Normalize header keys for case insensitivity
  const normalizedHeaders = {};
  for (const key of Object.keys(headers)) {
    normalizedHeaders[key.toLowerCase()] = headers[key];
  }

  // 2. HSTS Check
  const hsts = normalizedHeaders['strict-transport-security'];
  if (hsts) {
    result.hsts = true;
    result.details.hsts = `HSTS enabled: ${hsts}`;
  } else {
    riskScore += 10;
    result.details.hsts = 'Strict-Transport-Security (HSTS) header is missing.';
  }

  // 3. CSP Check
  const csp = normalizedHeaders['content-security-policy'];
  if (csp) {
    result.csp = true;
    result.details.csp = 'Content-Security-Policy (CSP) is implemented.';
  } else {
    riskScore += 20;
    result.details.csp = 'Content-Security-Policy (CSP) is missing. High risk of XSS.';
  }

  // 4. X-Frame-Options Check
  const xfo = normalizedHeaders['x-frame-options'] || normalizedHeaders['frame-options'];
  if (xfo) {
    result.xFrameOptions = true;
    result.details.xFrameOptions = `X-Frame-Options enabled: ${xfo}`;
  } else {
    riskScore += 15;
    result.details.xFrameOptions = 'X-Frame-Options is missing. Vulnerable to Clickjacking.';
  }

  // 5. X-Content-Type-Options Check
  const xcto = normalizedHeaders['x-content-type-options'];
  if (xcto && xcto.toLowerCase().includes('nosniff')) {
    result.xContentTypeOptions = true;
    result.details.xContentTypeOptions = 'X-Content-Type-Options: nosniff is set.';
  } else {
    riskScore += 10;
    result.details.xContentTypeOptions = 'X-Content-Type-Options is missing or not set to nosniff.';
  }

  // 6. Referrer-Policy Check
  const rp = normalizedHeaders['referrer-policy'];
  if (rp) {
    result.referrerPolicy = true;
    result.details.referrerPolicy = `Referrer-Policy set: ${rp}`;
  } else {
    riskScore += 5;
    result.details.referrerPolicy = 'Referrer-Policy header is missing.';
  }

  // 7. Permissions-Policy Check
  const pp = normalizedHeaders['permissions-policy'] || normalizedHeaders['feature-policy'];
  if (pp) {
    result.permissionsPolicy = true;
    result.details.permissionsPolicy = 'Permissions-Policy is set.';
  } else {
    riskScore += 5;
    result.details.permissionsPolicy = 'Permissions-Policy (or Feature-Policy) header is missing.';
  }

  // 8. Server Header Check (Information disclosure check)
  const serverHeader = normalizedHeaders['server'];
  if (serverHeader) {
    result.server = true;
    // Check if the server header exposes version details (contains digits)
    const hasVersions = /\d/.test(serverHeader);
    if (hasVersions) {
      riskScore += 10;
      result.details.server = `Server header exposes server software & version: "${serverHeader}". High information disclosure risk.`;
    } else {
      riskScore += 5;
      result.details.server = `Server header is active: "${serverHeader}". Moderate information disclosure risk.`;
    }
  } else {
    result.details.server = 'Server header is hidden or masked. Compliant.';
  }

  // Cap risk score between 0 and 100
  result.calculatedRiskScore = Math.min(Math.max(riskScore, 0), 100);

  return result;
};

module.exports = { analyzeHeaders };
