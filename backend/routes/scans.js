const express = require('express');
const router = express.Router();
const { runScan, getScansByWebsite, getScanById } = require('../controllers/scanController');
const { protect } = require('../middleware/auth');

router.use(protect); // Secure all scan routes

router.post('/:websiteId', runScan);
router.get('/website/:websiteId', getScansByWebsite);
router.get('/:id', getScanById);

module.exports = router;
