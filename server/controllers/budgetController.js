const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Get all budgets
const getBudgets = async (req, res) => {
  try {
    const { is_active } = req.query;

    let query = `
      SELECT b.*, c.name as category_name, c.color as category_color
      FROM budgets b
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE b.user_id = ?
    `;
    const params = [req.user.sub];

    if (is_active !== undefined) {
      query += ' AND b.is_active = ?';
      params.push(is_active === 'true');
    }

    query += ' ORDER BY b.created_at DESC';

    const [budgets] = await pool.query(query, params);

    // Calculate spent amount for each budget
    for (let budget of budgets) {
      const [result] = await pool.query(
        `SELECT COALESCE(SUM(amount), 0) as spent
         FROM transactions
         WHERE user_id = ?
         AND type = 'expense'
         AND category_id = ?
         AND date >= ?
         AND date <= COALESCE(?, CURDATE())`,
        [req.user.sub, budget.category_id, budget.start_date, budget.end_date]
      );

      budget.spent = parseFloat(result[0].spent);
      budget.remaining = parseFloat(budget.amount) - budget.spent;
      budget.percentage = (budget.spent / parseFloat(budget.amount)) * 100;
    }

    res.json(budgets);
  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({ error: 'Failed to fetch budgets' });
  }
};

// Get budget by ID
const getBudgetById = async (req, res) => {
  try {
    const [budgets] = await pool.query(
      `SELECT b.*, c.name as category_name
       FROM budgets b
       LEFT JOIN categories c ON b.category_id = c.id
       WHERE b.id = ? AND b.user_id = ?`,
      [req.params.id, req.user.sub]
    );

    if (budgets.length === 0) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    res.json(budgets[0]);
  } catch (error) {
    console.error('Get budget error:', error);
    res.status(500).json({ error: 'Failed to fetch budget' });
  }
};

// Create budget
const createBudget = async (req, res) => {
  try {
    const { category_id, name, amount, period = 'monthly', start_date, end_date } = req.body;

    if (!name || !amount || !start_date) {
      return res.status(400).json({ error: 'Name, amount, and start date are required' });
    }

    const id = uuidv4();

    await pool.query(
      `INSERT INTO budgets (id, user_id, category_id, name, amount, period, start_date, end_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, req.user.sub, category_id, name, amount, period, start_date, end_date]
    );

    const [budgets] = await pool.query('SELECT * FROM budgets WHERE id = ?', [id]);
    res.status(201).json(budgets[0]);
  } catch (error) {
    console.error('Create budget error:', error);
    res.status(500).json({ error: 'Failed to create budget' });
  }
};

// Update budget
const updateBudget = async (req, res) => {
  try {
    const { category_id, name, amount, period, start_date, end_date, is_active } = req.body;

    await pool.query(
      `UPDATE budgets
       SET category_id = COALESCE(?, category_id),
           name = COALESCE(?, name),
           amount = COALESCE(?, amount),
           period = COALESCE(?, period),
           start_date = COALESCE(?, start_date),
           end_date = COALESCE(?, end_date),
           is_active = COALESCE(?, is_active)
       WHERE id = ? AND user_id = ?`,
      [category_id, name, amount, period, start_date, end_date, is_active, req.params.id, req.user.sub]
    );

    const [budgets] = await pool.query('SELECT * FROM budgets WHERE id = ?', [req.params.id]);

    if (budgets.length === 0) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    res.json(budgets[0]);
  } catch (error) {
    console.error('Update budget error:', error);
    res.status(500).json({ error: 'Failed to update budget' });
  }
};

// Delete budget
const deleteBudget = async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM budgets WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.sub]
    );

    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    console.error('Delete budget error:', error);
    res.status(500).json({ error: 'Failed to delete budget' });
  }
};

module.exports = {
  getBudgets,
  getBudgetById,
  createBudget,
  updateBudget,
  deleteBudget
};
