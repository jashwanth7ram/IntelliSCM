const express = require('express');
const router = express.Router();
const deploymentController = require('../controllers/deploymentController');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth');

router.use(authMiddleware);

router.get('/summary/env', deploymentController.envSummary);
router.get('/', deploymentController.list);
router.post('/', roleMiddleware(['Developer', 'Project Manager', 'Admin']), deploymentController.create);
router.patch('/:id/status', roleMiddleware(['Developer', 'Project Manager', 'Admin']), deploymentController.updateStatus);

module.exports = router;
