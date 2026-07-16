const express = require('express');
const router = express.Router();
const { getWebsites, getWebsiteById, addWebsite, updateWebsite, deleteWebsite } = require('../controllers/websiteController');
const { protect } = require('../middleware/auth');
const { validate, websiteRules } = require('../middleware/validation');

router.use(protect); // Secure all website routes

router.route('/')
  .get(getWebsites)
  .post(websiteRules, validate, addWebsite);

router.route('/:id')
  .get(getWebsiteById)
  .put(websiteRules, validate, updateWebsite)
  .delete(deleteWebsite);

module.exports = router;
