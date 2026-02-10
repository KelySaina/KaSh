const pool = require('../config/database');

// Get financial summary
const getSummary = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    // Total balance across all accounts
    const [balanceResult] = await pool.query(
      'SELECT COALESCE(SUM(balance), 0) as total_balance FROM accounts WHERE user_id = ? AND is_active = true',
      [req.user.sub]
    );

    // Total income and expenses
    let query = `
      SELECT
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expenses
      FROM transactions
      WHERE user_id = ?
    `;
    const params = [req.user.sub];

    if (start_date) {
      query += ' AND date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND date <= ?';
      params.push(end_date);
    }

    const [incomeExpenseResult] = await pool.query(query, params);

    const totalIncome = parseFloat(incomeExpenseResult[0].total_income);
    const totalExpenses = parseFloat(incomeExpenseResult[0].total_expenses);

    res.json({
      total_balance: parseFloat(balanceResult[0].total_balance),
      total_income: totalIncome,
      total_expenses: totalExpenses,
      net_income: totalIncome - totalExpenses,
      savings_rate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100).toFixed(2) : 0
    });
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
};

// Get spending by category
const getSpendingByCategory = async (req, res) => {
  try {
    const { start_date, end_date, type = 'expense' } = req.query;

    let query = `
      SELECT
        c.id,
        c.name,
        c.color,
        c.icon,
        COALESCE(SUM(t.amount), 0) as total,
        COUNT(t.id) as transaction_count
      FROM categories c
      LEFT JOIN transactions t ON c.id = t.category_id
        AND t.user_id = ?
        AND t.type = ?
    `;
    const params = [req.user.sub, type];

    if (start_date) {
      query += ' AND t.date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND t.date <= ?';
      params.push(end_date);
    }

    query += `
      WHERE c.user_id = ? AND c.type = ?
      GROUP BY c.id, c.name, c.color, c.icon
      ORDER BY total DESC
    `;
    params.push(req.user.sub, type);

    const [results] = await pool.query(query, params);

    // Calculate percentages
    const totalAmount = results.reduce((sum, item) => sum + parseFloat(item.total), 0);

    const data = results.map(item => ({
      ...item,
      total: parseFloat(item.total),
      percentage: totalAmount > 0 ? ((parseFloat(item.total) / totalAmount) * 100).toFixed(2) : 0
    }));

    res.json({ data, total: totalAmount });
  } catch (error) {
    console.error('Get spending by category error:', error);
    res.status(500).json({ error: 'Failed to fetch spending data' });
  }
};

// Get income vs expense trend
const getIncomeVsExpenseTrend = async (req, res) => {
  try {
    const { start_date, end_date, period = 'month' } = req.query;

    let dateFormat;
    switch (period) {
      case 'day':
        dateFormat = '%Y-%m-%d';
        break;
      case 'week':
        dateFormat = '%Y-%U';
        break;
      case 'month':
      default:
        dateFormat = '%Y-%m';
        break;
      case 'year':
        dateFormat = '%Y';
        break;
    }

    let query = `
      SELECT
        DATE_FORMAT(date, ?) as period,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense
      FROM transactions
      WHERE user_id = ?
    `;
    const params = [dateFormat, req.user.sub];

    if (start_date) {
      query += ' AND date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND date <= ?';
      params.push(end_date);
    }

    query += ' GROUP BY period ORDER BY period';

    const [results] = await pool.query(query, params);

    const data = results.map(item => ({
      period: item.period,
      income: parseFloat(item.income),
      expense: parseFloat(item.expense),
      net: parseFloat(item.income) - parseFloat(item.expense)
    }));

    res.json(data);
  } catch (error) {
    console.error('Get income vs expense trend error:', error);
    res.status(500).json({ error: 'Failed to fetch trend data' });
  }
};

// Get budget progress
const getBudgetProgress = async (req, res) => {
  try {
    const [budgets] = await pool.query(
      `SELECT b.*, c.name as category_name, c.color as category_color
       FROM budgets b
       LEFT JOIN categories c ON b.category_id = c.id
       WHERE b.user_id = ? AND b.is_active = true`,
      [req.user.sub]
    );

    const progress = [];

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

      const spent = parseFloat(result[0].spent);
      const amount = parseFloat(budget.amount);

      progress.push({
        id: budget.id,
        name: budget.name,
        category: budget.category_name,
        color: budget.category_color,
        amount,
        spent,
        remaining: amount - spent,
        percentage: (spent / amount * 100).toFixed(2),
        status: spent > amount ? 'over' : spent > amount * 0.9 ? 'warning' : 'ok'
      });
    }

    res.json(progress);
  } catch (error) {
    console.error('Get budget progress error:', error);
    res.status(500).json({ error: 'Failed to fetch budget progress' });
  }
};

module.exports = {
  getSummary,
  getSpendingByCategory,
  getIncomeVsExpenseTrend,
  getBudgetProgress
};
