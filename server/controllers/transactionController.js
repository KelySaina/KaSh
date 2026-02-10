const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Get all transactions
const getTransactions = async (req, res) => {
  try {
    const {
      account_id,
      category_id,
      type,
      start_date,
      end_date,
      limit = 50,
      offset = 0
    } = req.query;

    let query = `
      SELECT t.*, c.name as category_name, c.color as category_color,
             a.name as account_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN accounts a ON t.account_id = a.id
      WHERE t.user_id = ?
    `;
    const params = [req.user.sub];

    if (account_id) {
      query += ' AND t.account_id = ?';
      params.push(account_id);
    }

    if (category_id) {
      query += ' AND t.category_id = ?';
      params.push(category_id);
    }

    if (type) {
      query += ' AND t.type = ?';
      params.push(type);
    }

    if (start_date) {
      query += ' AND t.date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND t.date <= ?';
      params.push(end_date);
    }

    query += ' ORDER BY t.date DESC, t.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [transactions] = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM transactions WHERE user_id = ?';
    const countParams = [req.user.sub];
    const [countResult] = await pool.query(countQuery, countParams);

    res.json({
      transactions,
      total: countResult[0].total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

// Get transaction by ID
const getTransactionById = async (req, res) => {
  try {
    const [transactions] = await pool.query(
      `SELECT t.*, c.name as category_name, a.name as account_name
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       LEFT JOIN accounts a ON t.account_id = a.id
       WHERE t.id = ? AND t.user_id = ?`,
      [req.params.id, req.user.sub]
    );

    if (transactions.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(transactions[0]);
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
};

// Create transaction
const createTransaction = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const {
      account_id,
      category_id,
      type,
      amount,
      description,
      date,
      tags
    } = req.body;

    if (!account_id || !type || !amount || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const id = uuidv4();

    await connection.query(
      `INSERT INTO transactions (id, user_id, account_id, category_id, type, amount, description, date, tags)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, req.user.sub, account_id, category_id, type, amount, description, date, tags]
    );

    // Update account balance
    const balanceChange = type === 'income' ? amount : -amount;
    await connection.query(
      'UPDATE accounts SET balance = balance + ? WHERE id = ?',
      [balanceChange, account_id]
    );

    await connection.commit();

    const [transactions] = await connection.query('SELECT * FROM transactions WHERE id = ?', [id]);
    res.status(201).json(transactions[0]);
  } catch (error) {
    await connection.rollback();
    console.error('Create transaction error:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  } finally {
    connection.release();
  }
};

// Update transaction
const updateTransaction = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Get old transaction
    const [oldTx] = await connection.query(
      'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.sub]
    );

    if (oldTx.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const { category_id, amount, description, date, tags } = req.body;

    // Update transaction
    await connection.query(
      `UPDATE transactions
       SET category_id = COALESCE(?, category_id),
           amount = COALESCE(?, amount),
           description = COALESCE(?, description),
           date = COALESCE(?, date),
           tags = COALESCE(?, tags)
       WHERE id = ? AND user_id = ?`,
      [category_id, amount, description, date, tags, req.params.id, req.user.sub]
    );

    // Update account balance if amount changed
    if (amount && amount !== oldTx[0].amount) {
      const oldChange = oldTx[0].type === 'income' ? oldTx[0].amount : -oldTx[0].amount;
      const newChange = oldTx[0].type === 'income' ? amount : -amount;
      const diff = newChange - oldChange;

      await connection.query(
        'UPDATE accounts SET balance = balance + ? WHERE id = ?',
        [diff, oldTx[0].account_id]
      );
    }

    await connection.commit();

    const [transactions] = await connection.query('SELECT * FROM transactions WHERE id = ?', [req.params.id]);
    res.json(transactions[0]);
  } catch (error) {
    await connection.rollback();
    console.error('Update transaction error:', error);
    res.status(500).json({ error: 'Failed to update transaction' });
  } finally {
    connection.release();
  }
};

// Delete transaction
const deleteTransaction = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Get transaction
    const [transactions] = await connection.query(
      'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.sub]
    );

    if (transactions.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const tx = transactions[0];

    // Reverse account balance
    const balanceChange = tx.type === 'income' ? -tx.amount : tx.amount;
    await connection.query(
      'UPDATE accounts SET balance = balance + ? WHERE id = ?',
      [balanceChange, tx.account_id]
    );

    // Delete transaction
    await connection.query('DELETE FROM transactions WHERE id = ?', [req.params.id]);

    await connection.commit();

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Delete transaction error:', error);
    res.status(500).json({ error: 'Failed to delete transaction' });
  } finally {
    connection.release();
  }
};

// Get categories
const getCategories = async (req, res) => {
  try {
    const { type } = req.query;

    let query = 'SELECT * FROM categories WHERE user_id = ?';
    const params = [req.user.sub];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    query += ' ORDER BY name';

    const [categories] = await pool.query(query, params);
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

// Create category
const createCategory = async (req, res) => {
  try {
    const { name, type, color, icon } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }

    const id = uuidv4();

    await pool.query(
      'INSERT INTO categories (id, user_id, name, type, color, icon) VALUES (?, ?, ?, ?, ?, ?)',
      [id, req.user.sub, name, type, color, icon]
    );

    const [categories] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
    res.status(201).json(categories[0]);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
};

module.exports = {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getCategories,
  createCategory
};
