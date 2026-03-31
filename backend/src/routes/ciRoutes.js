const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middlewares/auth');
const ci = require('../controllers/ciController');

/**
 * @swagger
 * tags:
 *   name: CI Registry
 *   description: Configuration Item management (IEEE 828 §5.2)
 */

router.use(authMiddleware);

// List all CIs (filterable by project, status, type)
router.get('/', ci.getCIs);

// CI stats per project (for Status Accounting dashboards)
router.get('/stats/:projectId', ci.getCIStats);

// Get single CI with full version history
router.get('/:id', ci.getCIById);

// Create new CI — PM, Auditor, Admin only
router.post('/', roleMiddleware(['Project Manager', 'Auditor', 'Admin']), ci.createCI);

// Update CI metadata
router.patch('/:id', roleMiddleware(['Project Manager', 'Auditor', 'Admin']), ci.updateCI);

// Bump version (called when a CR affecting this CI is approved)
router.post('/:id/version-bump', roleMiddleware(['Project Manager', 'Auditor', 'Admin']), ci.bumpVersion);

// Soft-delete (archive) a CI
router.delete('/:id', roleMiddleware(['Admin']), ci.archiveCI);

module.exports = router;
