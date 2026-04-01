const express = require('express');
const router = express.Router();
const devopsController = require('../controllers/devopsController');
const { authMiddleware } = require('../middlewares/auth');

router.use(authMiddleware);

router.get('/metrics', devopsController.metrics);
router.get('/trace/:crId', devopsController.trace);

module.exports = router;
