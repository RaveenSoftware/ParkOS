const router = require('express').Router();
const RatesController = require('../controllers/rates.controller');
const { auth, requireRole } = require('../middleware/auth.middleware');

// POS puede consultar tarifas por sede (sin requerir rol admin)
router.get('/sede/:sedeId', auth, RatesController.getForSede);

// Admin: gestión de tarifas
router.use(auth, requireRole(['ADMIN_TENANT', 'SUPERADMIN']));
router.get('/',  RatesController.get);
router.put('/',  RatesController.save);

module.exports = router;


