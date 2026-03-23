/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: Project management and retrieval
 */

const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth');

router.use(authMiddleware);

/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Create a new project (Project Manager, Admin only)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               repositoryLink:
 *                 type: string
 *               version:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Project created successfully
 *       400:
 *         description: Form validation failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
// Only Project Managers and Admins can create or update projects
router.post('/', roleMiddleware(['Project Manager', 'Admin']), projectController.createProject);

/**
 * @swagger
 * /api/projects/{id}:
 *   patch:
 *     summary: Update an existing project (Project Manager, Admin only)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               repositoryLink:
 *                 type: string
 *               version:
 *                 type: string
 *     responses:
 *       200:
 *         description: Project updated successfully
 *       400:
 *         description: Invalid updates
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Project not found
 */
router.patch('/:id', roleMiddleware(['Project Manager', 'Admin']), projectController.updateProject);

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: List all projects
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of projects
 *       401:
 *         description: Unauthorized
 */
// Everyone authenticated can view projects
router.get('/', projectController.getProjects);

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     summary: Get a project by ID
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The project ID
 *     responses:
 *       200:
 *         description: The project detail
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Project not found
 */
router.get('/:id', projectController.getProjectById);

module.exports = router;
