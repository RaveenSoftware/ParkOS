const router = require('express').Router();
const PlanController = require('../controllers/plan.controller');
const { auth, requireRole } = require('../middleware/auth.middleware');

// SUPERADMIN ONLY
router.use(auth, requireRole(['SUPERADMIN']));

router.get('/', PlanController.getAll);
router.post('/', PlanController.create);
router.put('/:id', PlanController.update);

module.exports = router;


