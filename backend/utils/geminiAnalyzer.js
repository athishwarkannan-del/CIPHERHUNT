const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;

let genAI = null;
if (apiKey && apiKey !== 'your-gemini-api-key') {
  genAI = new GoogleGenerativeAI(apiKey);
}

/**
 * Clean model output and parse to JSON.
 * @param {string} text 
 */
const parseGeminiJson = (text) => {
  try {
    let cleanText = text.trim();
    if (cleanText.startsWith('```')) {
      const firstNewline = cleanText.indexOf('\n');
      const lastBacktick = cleanText.lastIndexOf('```');
      if (firstNewline !== -1 && lastBacktick !== -1) {
        cleanText = cleanText.slice(firstNewline + 1, lastBacktick).trim();
      }
    }
    return JSON.parse(cleanText);
  } catch (error) {
    console.error('Failed to parse Gemini response as JSON. Raw text was:', text);
    throw new Error('Invalid JSON format returned from AI model.');
  }
};

/**
 * Call Gemini to perform a security scan analysis.
 * @param {object} scanData 
 */
const analyzeWithGemini = async (scanData) => {
  const defaultFallback = {
    risk_score: scanData.initial_risk_score || 30,
    severity: scanData.initial_risk_score > 70 ? 'high' : (scanData.initial_risk_score > 40 ? 'medium' : 'low'),
    summary: 'Automated rule-based evaluation completed successfully.',
    explanation: 'AI analysis bypassed or failed to complete. Using basic rule-based security evaluation.',
    recommendations: [
      {
        priority: 'high',
        issue: 'Missing security headers',
        fix: 'Configure Content-Security-Policy and HTTP Strict-Transport-Security on the host server.'
      }
    ],
    confidence: 100 // Default fallback confidence
  };

  if (!genAI) {
    console.warn('[WARNING] GEMINI_API_KEY is not configured. Falling back to rule-based evaluation.');
    return defaultFallback;
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json'
      }
    });

    const truncatedHtml = scanData.html ? scanData.html.substring(0, 4000) + '\n...[TRUNCATED]...' : 'No HTML content fetched.';

    const systemPrompt = `You are a cybersecurity expert auditing a website. Analyze the provided site details, fetched HTML snippets, HTTP response headers, and static security checks. Output a JSON object containing:
    1. "risk_score": integer between 0 and 100 representing the security risk.
    2. "severity": string ("info", "low", "medium", "high", "critical").
    3. "summary": A single concise sentence summarizing the security posture or defacement status.
    4. "explanation": A detailed, professional paragraph explaining the vulnerabilities or defacement risk.
    5. "recommendations": An array of objects, where each object has:
       - "priority": string ("high", "medium", "low")
       - "issue": short string describing the security issue
       - "fix": action plan to resolve this issue
    6. "confidence": integer between 0 and 100 representing your confidence in this assessment.

    You must output ONLY a valid JSON object matching this structure. Do not wrap in markdown or add text outside of JSON.`;

    const userPrompt = `
    Website: ${scanData.url}
    Title: ${scanData.title}
    Status Code: ${scanData.status_code}
    Response Time: ${scanData.response_time}ms

    Headers:
    ${JSON.stringify(scanData.headers, null, 2)}

    Defacement Scans:
    - HTML Changed: ${scanData.defacement.html_changed}
    - Title Changed: ${scanData.defacement.title_changed}
    - Meta Tags Changed: ${scanData.defacement.meta_changed} (Details: ${JSON.stringify(scanData.defacement.meta_changes)})
    - Missing Core Layout Elements: ${JSON.stringify(scanData.defacement.missing_elements)}
    - Suspicious text keywords detected: ${scanData.defacement.suspicious_text_detected} (Details: ${scanData.defacement.suspicious_text_details})

    Initial rule-based Risk Score: ${scanData.initial_risk_score}

    HTML Content Snippet:
    ${truncatedHtml}
    `;

    const result = await model.generateContent([
      { text: systemPrompt },
      { text: userPrompt }
    ]);

    const responseText = result.response.text();
    return parseGeminiJson(responseText);

  } catch (error) {
    console.error('Gemini Analysis API Error:', error);
    return defaultFallback;
  }
};

module.exports = { analyzeWithGemini };
