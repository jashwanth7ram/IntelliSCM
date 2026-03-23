/**
 * @swagger
 * tags:
 *   name: Baselines
 *   description: Configuration Baseline management
 */

const express = require('express');
const router = express.Router();
const baselineController = require('../controllers/baselineController');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth');

router.use(authMiddleware);

/**
 * @swagger
 * /api/baselines:
 *   post:
 *     summary: Create a new project baseline
 *     tags: [Baselines]
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
 *               - versionNumber
 *               - description
 *             properties:
 *               project:
 *                 type: string
 *               versionNumber:
 *                 type: string
 *               description:
 *                 type: string
 *               releaseTag:
 *                 type: object
 *                 properties:
 *                   branchName:
 *                     type: string
 *                   gitReference:
 *                     type: string
 *               releaseNotes:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Baseline created successfully
 *       400:
 *         description: Bad request
 *       403:
 *         description: Forbidden
 */
// Only PMs or Admins can create baselines typically
router.post('/', roleMiddleware(['Project Manager', 'Admin']), baselineController.createBaseline);

/**
 * @swagger
 * /api/baselines/{projectId}:
 *   get:
 *     summary: Get all baselines for a specific project
 *     tags: [Baselines]
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
 *         description: List of baselines for the project
 *       401:
 *         description: Unauthorized
 */
router.get('/:projectId', baselineController.getBaselinesForProject);

module.exports = router;
