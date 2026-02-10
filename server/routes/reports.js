const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken } = require('../middleware/auth');

// All routes require authentication
router.use(verifyToken);

router.get('/summary', reportController.getSummary);
router.get('/spending-by-category', reportController.getSpendingByCategory);
router.get('/income-vs-expense', reportController.getIncomeVsExpenseTrend);
router.get('/budget-progress', reportController.getBudgetProgress);

module.exports = router;
