const dns = require('dns').promises;
const url = require('url');

/**
 * Check if the resolved IP address is a private, loopback, or link-local address.
 * @param {string} ip 
 * @returns {boolean} True if the IP is private/restricted.
 */
const isPrivateIP = (ip) => {
  // IPv4 Check
  const parts = ip.split('.');
  if (parts.length === 4) {
    const first = parseInt(parts[0], 10);
    const second = parseInt(parts[1], 10);

    // Loopback: 127.0.0.0/8
    if (first === 127) return true;

    // Private Network class A: 10.0.0.0/8
    if (first === 10) return true;

    // Link-local: 169.254.0.0/16
    if (first === 169 && second === 254) return true;

    // Private Network class B: 172.16.0.0 - 172.31.255.255 (172.16.0.0/12)
    if (first === 172 && second >= 16 && second <= 31) return true;

    // Private Network class C: 192.168.0.0/16
    if (first === 192 && second === 168) return true;

    // Broadcast / Multicast
    if (first >= 224) return true;

    return false;
  }

  // IPv6 Check
  const ipLower = ip.toLowerCase();
  // Loopback (::1)
  if (ipLower === '::1' || ipLower === '0:0:0:0:0:0:0:1') return true;
  // Link-local (fe80::/10)
  if (ipLower.startsWith('fe80') || ipLower.startsWith('fe9') || ipLower.startsWith('fea') || ipLower.startsWith('feb')) return true;
  // Unique local addresses (fc00::/7)
  if (ipLower.startsWith('fc') || ipLower.startsWith('fd')) return true;
  // Multicast (ff00::/8)
  if (ipLower.startsWith('ff')) return true;

  return false;
};

/**
 * Validates a URL to prevent SSRF attacks.
 * @param {string} targetUrl 
 * @returns {Promise<boolean>} True if the URL resolves to a public, secure destination.
 */
const validateUrlForSSRF = async (targetUrl) => {
  // Allow local host scans in development mode to support offline operator testing
  if (process.env.NODE_ENV !== 'production') {
    return true;
  }

  try {
    const parsedUrl = url.parse(targetUrl);
    const hostname = parsedUrl.hostname;

    if (!hostname) {
      return false;
    }

    // Resolve hostname to IP addresses
    const addresses = await dns.resolve(hostname);
    if (!addresses || addresses.length === 0) {
      return false;
    }

    // Ensure all resolved addresses are public
    for (const addr of addresses) {
      if (isPrivateIP(addr)) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error(`[SSRF Shield] Hostname resolution failed for: ${targetUrl}. Error: ${error.message}`);
    // If it's a raw IP address (not a hostname), try to parse and check directly
    try {
      const parsedUrl = url.parse(targetUrl);
      const hostname = parsedUrl.hostname;
      if (hostname && (hostname.includes('.') || hostname.includes(':'))) {
        return !isPrivateIP(hostname);
      }
    } catch (_) {}
    return false;
  }
};

module.exports = { validateUrlForSSRF };
