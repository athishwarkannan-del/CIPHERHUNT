const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({ field: err.path, message: err.msg }))
    });
  }
  next();
};

const websiteRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Website name is required')
    .isLength({ max: 100 }).withMessage('Website name cannot exceed 100 characters')
    .escape(),
  body('url')
    .trim()
    .notEmpty().withMessage('Website URL is required')
    .isURL({
      protocols: ['http', 'https'],
      require_tld: true,
      require_protocol: false
    }).withMessage('Must be a valid website URL')
];

const registerRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
];

const loginRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address'),
  body('password')
    .notEmpty().withMessage('Password is required')
];

module.exports = {
  validate,
  websiteRules,
  registerRules,
  loginRules
};
