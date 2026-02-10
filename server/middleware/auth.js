const axios = require('axios');

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Verify token with Konnect Service
    const response = await axios.get(`${process.env.KONNECT_URL}/oauth/userinfo`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    // Attach user info to request
    req.user = response.data;
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

module.exports = { verifyToken };
