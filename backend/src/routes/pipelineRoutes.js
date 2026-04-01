const express = require('express');
const router = express.Router();
const pipelineController = require('../controllers/pipelineController');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth');

router.use(authMiddleware);

router.get('/definitions', pipelineController.listDefinitions);
router.post('/definitions', roleMiddleware(['Developer', 'Project Manager', 'CCB Member', 'Admin']), pipelineController.createDefinition);

router.get('/runs', pipelineController.listRuns);
router.get('/runs/:id', pipelineController.getRunById);
router.post('/runs/start', roleMiddleware(['Developer', 'Project Manager', 'Admin', 'CCB Member']), pipelineController.startRun);
router.post('/runs/:id/advance', roleMiddleware(['Developer', 'Project Manager', 'Admin', 'CCB Member']), pipelineController.advanceRun);
router.post('/runs/:id/simulate-success', roleMiddleware(['Developer', 'Project Manager', 'Admin']), pipelineController.simulateFullSuccess);

module.exports = router;
