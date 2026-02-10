const axios = require('axios');
const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Redirect to Konnect Service for login
const login = (req, res) => {
  // Use PUBLIC_URL for browser redirect, fallback to KONNECT_URL
  const konnectPublicUrl = process.env.KONNECT_PUBLIC_URL || process.env.KONNECT_URL;
  const authUrl = new URL(`${konnectPublicUrl}/oauth/authorize`);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('client_id', process.env.KONNECT_CLIENT_ID);
  authUrl.searchParams.append('redirect_uri', process.env.KONNECT_REDIRECT_URI);
  authUrl.searchParams.append('scope', 'openid profile email');
  authUrl.searchParams.append('state', Math.random().toString(36).substring(7));

  res.redirect(authUrl.toString());
};

// Handle OAuth callback
const callback = async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_code`);
    }

    // Exchange code for tokens
    const tokenResponse = await axios.post(`${process.env.KONNECT_URL}/oauth/token`, {
      grant_type: 'authorization_code',
      code,
      client_id: process.env.KONNECT_CLIENT_ID,
      client_secret: process.env.KONNECT_CLIENT_SECRET,
      redirect_uri: process.env.KONNECT_REDIRECT_URI
    });

    const { access_token, refresh_token, id_token } = tokenResponse.data;

    // Get user info
    const userResponse = await axios.get(`${process.env.KONNECT_URL}/oauth/userinfo`, {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    const userInfo = userResponse.data;

    // Sync user to local database
    await syncUser(userInfo);

    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${access_token}&refresh=${refresh_token}`);
  } catch (error) {
    console.error('OAuth callback error:', error.response?.data || error.message);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
  }
};

// Sync user from Konnect Service to local database
const syncUser = async (userInfo) => {
  const connection = await pool.getConnection();

  try {
    const userId = userInfo.sub;
    const email = userInfo.email;
    const firstName = userInfo.given_name || '';
    const lastName = userInfo.family_name || '';

    await connection.query(
      `INSERT INTO users (id, email, first_name, last_name)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       email = VALUES(email),
       first_name = VALUES(first_name),
       last_name = VALUES(last_name),
       updated_at = CURRENT_TIMESTAMP`,
      [userId, email, firstName, lastName]
    );
  } finally {
    connection.release();
  }
};

// Get current user info
const me = async (req, res) => {
  try {
    const connection = await pool.getConnection();

    try {
      const [users] = await connection.query(
        'SELECT id, email, first_name, last_name, created_at FROM users WHERE id = ?',
        [req.user.sub]
      );

      if (users.length === 0) {
        // Sync user if not exists
        await syncUser(req.user);
        return res.json(req.user);
      }

      res.json(users[0]);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

// Logout
const logout = (req, res) => {
  res.json({ message: 'Logged out successfully' });
};

module.exports = {
  login,
  callback,
  me,
  logout
};
