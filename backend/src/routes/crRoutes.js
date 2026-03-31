/**
 * @swagger
 * tags:
 *   name: Change Requests
 *   description: Change Request (CR) management and tracking
 */

const express = require('express');
const router = express.Router();
const crController = require('../controllers/crController');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth');

router.use(authMiddleware);

/**
 * @swagger
 * /api/crs:
 *   post:
 *     summary: Submit a new Change Request
 *     description: Submitting a CR also triggers an immediate AI Impact Analysis score. Only Developer, Project Manager, or CCB Member can submit.
 *     tags: [Change Requests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - project
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               project:
 *                 type: string
 *                 description: Project ID
 *               priorityLevel:
 *                 type: string
 *                 enum: [Low, Medium, High, Critical]
 *               relatedCommitId:
 *                 type: string
 *               filesAffected:
 *                 type: array
 *                 items:
 *                   type: string
 *               linesOfCodeModified:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [Submitted, Emergency Fix]
 *     responses:
 *       201:
 *         description: CR submitted and AI Analysis completed
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
// Developers, Project Managers, CCB can submit/update
router.post('/', roleMiddleware(['Developer', 'Project Manager', 'CCB Member']), crController.submitCR);

/**
 * @swagger
 * /api/crs/{id}:
 *   patch:
 *     summary: Update an existing Change Request
 *     tags: [Change Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               filesAffected:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: CR updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: CR not found
 */
router.patch('/:id', roleMiddleware(['Developer', 'Project Manager', 'CCB Member']), crController.updateCR);

/**
 * @swagger
 * /api/crs:
 *   get:
 *     summary: Get all Change Requests
 *     tags: [Change Requests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of CRs
 *       401:
 *         description: Unauthorized
 */
router.get('/', crController.getCRs);

/**
 * @swagger
 * /api/crs/{id}:
 *   get:
 *     summary: Get a specific Change Request by ID
 *     tags: [Change Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The Change Request details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: CR not found
 */
router.get('/status-report', crController.getStatusReport);
router.get('/:id', crController.getCRById);

// PATCH /api/crs/:id/status  — Status Accounting transition log (IEEE 828 §5.4)
router.patch('/:id/status', roleMiddleware(['CCB Member', 'Project Manager', 'Admin']), crController.updateCRStatus);

module.exports = router;
