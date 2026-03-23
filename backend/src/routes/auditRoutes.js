/**
 * @swagger
 * tags:
 *   name: Audits
 *   description: SCM Configuration Audits (FCA/PCA)
 */

const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth');

router.use(authMiddleware);

/**
 * @swagger
 * /api/audits:
 *   post:
 *     summary: Schedule a new audit (Auditor, Admin only)
 *     tags: [Audits]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - project
 *               - auditType
 *               - auditDate
 *             properties:
 *               project:
 *                 type: string
 *               auditType:
 *                 type: string
 *                 enum: [FCA, PCA]
 *               auditDate:
 *                 type: string
 *                 format: date-time
 *               auditReportUrl:
 *                 type: string
 *               complianceNotes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Audit scheduled
 *       400:
 *         description: Bad request
 *       403:
 *         description: Forbidden
 */
router.post('/', roleMiddleware(['Auditor', 'Admin']), auditController.scheduleAudit);

/**
 * @swagger
 * /api/audits/{projectId}:
 *   get:
 *     summary: Get audits for a specific project
 *     tags: [Audits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of project audits
 *       401:
 *         description: Unauthorized
 */
router.get('/:projectId', auditController.getAuditsForProject);

/**
 * @swagger
 * /api/audits/{id}:
 *   patch:
 *     summary: Update an audit
 *     tags: [Audits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               auditDate:
 *                 type: string
 *                 format: date-time
 *               auditReportUrl:
 *                 type: string
 *               complianceNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Audit updated
 *       400:
 *         description: Bad request
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Audit not found
 */
router.patch('/:id', roleMiddleware(['Auditor', 'Admin']), auditController.updateAudit);

module.exports = router;
