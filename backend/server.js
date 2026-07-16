const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const websiteRoutes = require('./routes/websites');
const scanRoutes = require('./routes/scans');
const dashboardRoutes = require('./routes/dashboard');
const alertRoutes = require('./routes/alerts');
const auditRoutes = require('./routes/audit');
const emailRoutes = require('./routes/emailRoutes');

const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// 1. SECURITY MIDDLEWARE
// Helmet secures HTTP headers (helps protect against clickjacking, sniff attacks, XSS, etc.)
app.use(helmet());

// CORS configuration (allow requests from frontend)
app.use(cors({
  origin: '*', // For development, allow any origin, can be configured for specific domains
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiting to prevent brute-force and scraping attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again after 15 minutes'
  },
  // Hot reload and React development mode make several API calls per render.
  // Keep brute-force protection in production while allowing local development
  // to recover immediately after configuration changes.
  skip: () => !isProduction
});
app.use(limiter);

// 2. LOGGING & UTILS
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. API ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/websites', websiteRoutes);
app.use('/api/scans', scanRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/email', emailRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 4. GLOBAL ERROR HANDLER
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`[SERVER] CipherUnit security engine running on port ${PORT}`);
});
