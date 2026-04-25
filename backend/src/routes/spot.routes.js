const express = require('express');
const router = express.Router();
const SpotController = require('../controllers/spot.controller');
const { auth } = require('../middleware/auth.middleware');

router.use(auth);

// PUT /layout MUST come before GET /:sedeId to avoid Express matching 'layout' as a param
router.put('/layout', (req, res, next) => {
  if (!['ADMIN_TENANT'].includes(req.user.role)) return res.status(403).json({ error: 'Solo administradores pueden modificar el mapa' });
  next();
}, SpotController.saveLayout);

router.post('/', (req, res, next) => {
  if (!['ADMIN_TENANT'].includes(req.user.role)) return res.status(403).json({ error: 'Solo administradores pueden modificar el mapa' });
  next();
}, SpotController.upsertSpot);

router.delete('/:id', (req, res, next) => {
  if (!['ADMIN_TENANT'].includes(req.user.role)) return res.status(403).json({ error: 'Solo administradores pueden modificar el mapa' });
  next();
}, SpotController.deleteSpot);

// GET /:sedeId last - any authenticated user (cajero OR admin)
router.get('/:sedeId', (req, res, next) => {
  if (!['CAJERO', 'ADMIN_TENANT'].includes(req.user.role)) return res.status(403).json({ error: 'Acceso denegado' });
  next();
}, SpotController.getLayout);

module.exports = router;



