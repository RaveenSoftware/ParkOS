const express = require('express');
const router = express.Router();
const SubscriberController = require('../controllers/subscriber.controller');
const { auth } = require('../middleware/auth.middleware');

router.use(auth);
router.use((req, res, next) => {
  if (['CAJERO', 'ADMIN_TENANT'].includes(req.user.role)) next();
  else res.status(403).json({ error: 'Acceso denegado' });
});

router.get('/', SubscriberController.getSubscribers);
router.post('/', SubscriberController.createSubscriber);
router.put('/:id/status', SubscriberController.updateStatus);
router.get('/check/:plate', SubscriberController.checkPlate);

module.exports = router;


