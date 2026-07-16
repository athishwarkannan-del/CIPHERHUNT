const cheerio = require('cheerio');

/**
 * Detect defacement by comparing baseline HTML with current HTML.
 * @param {string} baselineHtml 
 * @param {string} currentHtml 
 * @param {string} baselineTitle 
 * @param {string} currentTitle 
 */
const detectDefacement = (baselineHtml, currentHtml, baselineTitle, currentTitle) => {
  const result = {
    html_changed: false,
    title_changed: false,
    meta_changed: false, // Added meta changed indicator
    meta_changes: [], // List of specific meta differences
    missing_elements: [],
    suspicious_text_detected: false,
    suspicious_text_details: null,
    defacement_risk_delta: 0
  };

  // If there's no baseline, we cannot detect changes
  if (!baselineHtml) {
    return result;
  }

  // 1. Title Changed Check
  if (baselineTitle !== currentTitle) {
    result.title_changed = true;
    result.defacement_risk_delta += 40;
  }

  // 2. HTML Changed Check
  const cleanBaseline = baselineHtml.replace(/\s+/g, ' ').trim();
  const cleanCurrent = currentHtml.replace(/\s+/g, ' ').trim();
  if (cleanBaseline !== cleanCurrent) {
    result.html_changed = true;
    result.defacement_risk_delta += 10;
  }

  const $baseline = cheerio.load(baselineHtml);
  const $current = cheerio.load(currentHtml);

  // 3. Meta Tags Changes Check
  const baselineMetas = {};
  const currentMetas = {};

  $baseline('meta').each((i, el) => {
    const name = $baseline(el).attr('name') || $baseline(el).attr('property');
    const content = $baseline(el).attr('content');
    if (name && content) {
      baselineMetas[name.toLowerCase()] = content;
    }
  });

  $current('meta').each((i, el) => {
    const name = $current(el).attr('name') || $current(el).attr('property');
    const content = $current(el).attr('content');
    if (name && content) {
      currentMetas[name.toLowerCase()] = content;
    }
  });

  const targetMetas = ['description', 'keywords', 'robots', 'viewport'];
  targetMetas.forEach(meta => {
    const baseVal = baselineMetas[meta];
    const currVal = currentMetas[meta];
    if (baseVal !== currVal) {
      result.meta_changed = true;
      result.meta_changes.push({
        name: meta,
        baseline: baseVal || '[Not Set]',
        current: currVal || '[Not Set]'
      });
      result.defacement_risk_delta += 10;
    }
  });

  // 4. Missing Elements Check
  const importantSelectors = [
    { selector: 'h1', label: 'Primary Header (h1)' },
    { selector: 'nav', label: 'Navigation Bar (nav)' },
    { selector: 'footer', label: 'Footer (footer)' },
    { selector: 'form', label: 'Interactive Forms (form)' },
    { selector: 'main', label: 'Main Content Area (main)' }
  ];

  for (const item of importantSelectors) {
    const baselineCount = $baseline(item.selector).length;
    const currentCount = $current(item.selector).length;
    
    if (baselineCount > 0 && currentCount === 0) {
      result.missing_elements.push({
        selector: item.selector,
        label: item.label,
        message: `Missing ${item.label} tag which was present in baseline.`
      });
      result.defacement_risk_delta += 15;
    }
  }

  // 5. Suspicious Text Check
  const suspiciousKeywords = [
    'hacked', 'defaced', 'pwned', 'ownz', 'compromised',
    'security team', 'greets to', 'hacked by', 'rootkit', 'exploited'
  ];

  const currentTextLower = $current('body').text().toLowerCase();
  const baselineTextLower = $baseline('body').text().toLowerCase();

  const foundKeywords = [];
  for (const keyword of suspiciousKeywords) {
    if (currentTextLower.includes(keyword) && !baselineTextLower.includes(keyword)) {
      foundKeywords.push(keyword);
    }
  }

  if (foundKeywords.length > 0) {
    result.suspicious_text_detected = true;
    result.suspicious_text_details = `Suspicious keywords found: ${foundKeywords.join(', ')}`;
    result.defacement_risk_delta += 50;
  }

  result.defacement_risk_delta = Math.min(result.defacement_risk_delta, 100);

  return result;
};

module.exports = { detectDefacement };
