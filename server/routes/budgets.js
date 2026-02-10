const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budgetController');
const { verifyToken } = require('../middleware/auth');

// All routes require authentication
router.use(verifyToken);

router.get('/', budgetController.getBudgets);
router.get('/:id', budgetController.getBudgetById);
router.post('/', budgetController.createBudget);
router.put('/:id', budgetController.updateBudget);
router.delete('/:id', budgetController.deleteBudget);

module.exports = router;
