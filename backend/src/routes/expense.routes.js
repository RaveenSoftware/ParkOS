const express = require('express');
const router = express.Router();
const ExpenseController = require('../controllers/expense.controller');
const { auth } = require('../middleware/auth.middleware');

router.use(auth);
router.use((req, res, next) => {
  if (['CAJERO', 'ADMIN_TENANT'].includes(req.user.role)) next();
  else res.status(403).json({ error: 'Acceso denegado' });
});

router.get('/:shiftId', ExpenseController.getExpenses);
router.post('/', ExpenseController.createExpense);

module.exports = router;


