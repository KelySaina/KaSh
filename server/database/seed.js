const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');

const seedDatabase = async () => {
  const connection = await pool.getConnection();

  try {
    console.log('Seeding database...');

    // Create demo user (this will be synced from Konnect Service in production)
    // Use a consistent UUID for demo user
    const demoUserId = '00000000-0000-0000-0000-000000000001';

    await connection.query(
      `INSERT INTO users (id, email, first_name, last_name)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE email=email`,
      [demoUserId, 'demo@kash.app', 'Demo', 'User']
    );
    console.log('✅ Demo user created');

    // Check if categories already exist
    const [existing] = await connection.query(
      'SELECT COUNT(*) as count FROM categories WHERE user_id = ?',
      [demoUserId]
    );

    if (existing[0].count > 0) {
      console.log('✅ Demo data already exists, skipping seed');
      return;
    }

    // Default categories - Expenses
    const expenseCategories = [
      { name: 'Food & Dining', icon: '🍔', color: '#EF4444' },
      { name: 'Transportation', icon: '🚗', color: '#3B82F6' },
      { name: 'Shopping', icon: '🛍️', color: '#8B5CF6' },
      { name: 'Entertainment', icon: '🎬', color: '#EC4899' },
      { name: 'Bills & Utilities', icon: '📄', color: '#F59E0B' },
      { name: 'Healthcare', icon: '🏥', color: '#10B981' },
      { name: 'Education', icon: '📚', color: '#6366F1' },
      { name: 'Other', icon: '📦', color: '#6B7280' }
    ];

    for (const cat of expenseCategories) {
      await connection.query(
        `INSERT INTO categories (id, user_id, name, type, icon, color, is_default)
         VALUES (?, ?, ?, 'expense', ?, ?, true)`,
        [uuidv4(), demoUserId, cat.name, cat.icon, cat.color]
      );
    }
    console.log('✅ Expense categories created');

    // Default categories - Income
    const incomeCategories = [
      { name: 'Salary', icon: '💰', color: '#10B981' },
      { name: 'Freelance', icon: '💼', color: '#3B82F6' },
      { name: 'Investment', icon: '📈', color: '#8B5CF6' },
      { name: 'Other Income', icon: '💵', color: '#6B7280' }
    ];

    for (const cat of incomeCategories) {
      await connection.query(
        `INSERT INTO categories (id, user_id, name, type, icon, color, is_default)
         VALUES (?, ?, ?, 'income', ?, ?, true)`,
        [uuidv4(), demoUserId, cat.name, cat.icon, cat.color]
      );
    }
    console.log('✅ Income categories created');

    // Create sample accounts
    const cashAccountId = uuidv4();
    const bankAccountId = uuidv4();

    await connection.query(
      `INSERT INTO accounts (id, user_id, name, type, balance, icon, color)
       VALUES (?, ?, 'Cash', 'cash', 500.00, '💵', '#10B981')`,
      [cashAccountId, demoUserId]
    );

    await connection.query(
      `INSERT INTO accounts (id, user_id, name, type, balance, icon, color)
       VALUES (?, ?, 'Main Bank Account', 'bank', 5000.00, '🏦', '#3B82F6')`,
      [bankAccountId, demoUserId]
    );
    console.log('✅ Sample accounts created');

    // Create sample transactions
    const [categories] = await connection.query(
      'SELECT id, name, type FROM categories WHERE user_id = ?',
      [demoUserId]
    );

    const foodCat = categories.find(c => c.name === 'Food & Dining');
    const salaryCat = categories.find(c => c.name === 'Salary');

    // Sample expense
    await connection.query(
      `INSERT INTO transactions (id, user_id, account_id, category_id, type, amount, description, date)
       VALUES (?, ?, ?, ?, 'expense', 45.50, 'Lunch at restaurant', CURDATE())`,
      [uuidv4(), demoUserId, cashAccountId, foodCat.id]
    );

    // Sample income
    await connection.query(
      `INSERT INTO transactions (id, user_id, account_id, category_id, type, amount, description, date)
       VALUES (?, ?, ?, ?, 'income', 3000.00, 'Monthly salary', CURDATE())`,
      [uuidv4(), demoUserId, bankAccountId, salaryCat.id]
    );
    console.log('✅ Sample transactions created');

    // Create sample budget
    await connection.query(
      `INSERT INTO budgets (id, user_id, category_id, name, amount, period, start_date)
       VALUES (?, ?, ?, 'Food Budget', 500.00, 'monthly', DATE_FORMAT(CURDATE(), '%Y-%m-01'))`,
      [uuidv4(), demoUserId, foodCat.id]
    );
    console.log('✅ Sample budget created');

    console.log('\n✅ Database seeded successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    throw error;
  } finally {
    connection.release();
  }
};

// Run seed if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Seeding completed');
      process.exit(0);
    })
    .catch(err => {
      console.error('Seeding error:', err);
      process.exit(1);
    });
}

module.exports = seedDatabase;
