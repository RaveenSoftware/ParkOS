const express = require('express');
const router = express.Router();
const ExpenseController = require('../controllers/expense.controller');
const { auth, requireRole } = require('../middleware/auth.middleware');

router.use(auth);

// Admin routes FIRST (before /:shiftId or it would match 'admin' as shiftId)
router.get('/admin/all',    requireRole(['ADMIN_TENANT', 'SUPERADMIN']), ExpenseController.getAllExpenses);
router.post('/admin/new',   requireRole(['ADMIN_TENANT', 'SUPERADMIN']), ExpenseController.createAdminExpense);
router.delete('/admin/:id', requireRole(['ADMIN_TENANT', 'SUPERADMIN']), ExpenseController.deleteExpense);

// POS routes
router.get('/:shiftId', requireRole(['CAJERO', 'ADMIN_TENANT', 'SUPERADMIN']), ExpenseController.getExpenses);
router.post('/',        requireRole(['CAJERO', 'ADMIN_TENANT', 'SUPERADMIN']), ExpenseController.createExpense);

module.exports = router;


