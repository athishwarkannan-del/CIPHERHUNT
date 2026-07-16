const { supabase } = require('../utils/supabaseClient');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  const { email, password } = req.body;

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    if (!data.user) {
      return res.status(400).json({
        success: false,
        error: 'Registration failed'
      });
    }

    // Log the registration event in audit_logs
    await supabase.from('audit_logs').insert({
      user_id: data.user.id,
      action: 'USER_REGISTER',
      details: `User registered with email: ${email}`,
      ip_address: req.ip
    });

    res.status(201).json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email
      },
      session: data.session
    });
  } catch (error) {
    console.error('Register controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during registration'
    });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    if (!data.user || !data.session) {
      return res.status(400).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Log login action
    await supabase.from('audit_logs').insert({
      user_id: data.user.id,
      action: 'USER_LOGIN',
      details: `User logged in`,
      ip_address: req.ip
    });

    res.status(200).json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at
      }
    });
  } catch (error) {
    console.error('Login controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during login'
    });
  }
};

// @desc    Log user out / register event
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    // Insert audit log event
    await supabase.from('audit_logs').insert({
      user_id: req.user.id,
      action: 'USER_LOGOUT',
      details: `Operator logged out`,
      ip_address: req.ip
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during logout'
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      user: {
        id: req.user.id,
        email: req.user.email
      }
    });
  } catch (error) {
    console.error('Get profile controller error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error retrieving profile'
    });
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe
};
