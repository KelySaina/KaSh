const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Get all accounts for user
const getAccounts = async (req, res) => {
  try {
    const [accounts] = await pool.query(
      'SELECT * FROM accounts WHERE user_id = ? AND is_active = true ORDER BY created_at DESC',
      [req.user.sub]
    );

    res.json(accounts);
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
};

// Get account by ID
const getAccountById = async (req, res) => {
  try {
    const [accounts] = await pool.query(
      'SELECT * FROM accounts WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.sub]
    );

    if (accounts.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    res.json(accounts[0]);
  } catch (error) {
    console.error('Get account error:', error);
    res.status(500).json({ error: 'Failed to fetch account' });
  }
};

// Create account
const createAccount = async (req, res) => {
  try {
    const { name, type, balance = 0, currency = 'USD', color, icon } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }

    const id = uuidv4();

    await pool.query(
      'INSERT INTO accounts (id, user_id, name, type, balance, currency, color, icon) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, req.user.sub, name, type, balance, currency, color, icon]
    );

    const [accounts] = await pool.query('SELECT * FROM accounts WHERE id = ?', [id]);
    res.status(201).json(accounts[0]);
  } catch (error) {
    console.error('Create account error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
};

// Update account
const updateAccount = async (req, res) => {
  try {
    const { name, type, balance, currency, color, icon, is_active } = req.body;

    await pool.query(
      `UPDATE accounts
       SET name = COALESCE(?, name),
           type = COALESCE(?, type),
           balance = COALESCE(?, balance),
           currency = COALESCE(?, currency),
           color = COALESCE(?, color),
           icon = COALESCE(?, icon),
           is_active = COALESCE(?, is_active)
       WHERE id = ? AND user_id = ?`,
      [name, type, balance, currency, color, icon, is_active, req.params.id, req.user.sub]
    );

    const [accounts] = await pool.query('SELECT * FROM accounts WHERE id = ?', [req.params.id]);

    if (accounts.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    res.json(accounts[0]);
  } catch (error) {
    console.error('Update account error:', error);
    res.status(500).json({ error: 'Failed to update account' });
  }
};

// Delete account
const deleteAccount = async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM accounts WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.sub]
    );

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
};

module.exports = {
  getAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount
};
