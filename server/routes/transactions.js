const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { verifyToken } = require('../middleware/auth');

// All routes require authentication
router.use(verifyToken);

// Category routes (must be before /:id to avoid conflicts)
router.get('/categories/list', transactionController.getCategories);
router.post('/categories', transactionController.createCategory);

// Transaction routes
router.get('/', transactionController.getTransactions);
router.get('/:id', transactionController.getTransactionById);
router.post('/', transactionController.createTransaction);
router.put('/:id', transactionController.updateTransaction);
router.delete('/:id', transactionController.deleteTransaction);

module.exports = router;
