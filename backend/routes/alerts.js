const express = require('express');
const router = express.Router();
const { getAlerts, resolveAlert, deleteAlert } = require('../controllers/alertController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getAlerts);
router.put('/:id/resolve', resolveAlert);
router.delete('/:id', deleteAlert); // Added delete route

module.exports = router;
