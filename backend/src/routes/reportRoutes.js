/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: System-wide reporting and analysis
 */

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth');

router.use(authMiddleware);

/**
 * @swagger
 * /api/reports:
 *   get:
 *     summary: Generate an SCM report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *         description: Filter by project ID
 *       - in: query
 *         name: reportType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [change_activity, risk_analysis, compliance_status, approval_statistics]
 *         description: The type of report to generate
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Generated report data as JSON
 *       400:
 *         description: Invalid report type or request format
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Role restricted)
 */
// Restrict reporting to PMs, Auditors, and Admins
router.get('/', roleMiddleware(['Project Manager', 'Auditor', 'Admin']), reportController.generateReport);

module.exports = router;
