const express = require('express');
const router = express.Router();
const ShiftController = require('../controllers/shift.controller');
const { auth, requireRole } = require('../middleware/auth.middleware');

router.use(auth);
// Require CAJERO or ADMIN_TENANT
router.use((req, res, next) => {
  if (['CAJERO', 'ADMIN_TENANT'].includes(req.user.role)) next();
  else res.status(403).json({ error: 'Acceso denegado' });
});

router.get('/current', ShiftController.getCurrentShift);
router.post('/open', ShiftController.openShift);
router.post('/:shiftId/close', ShiftController.closeShift);
router.get('/history', ShiftController.getShiftsHistory);

module.exports = router;


