/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User management and authentication operations
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middlewares/auth');

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - username
 *               - email
 *               - password
 *               - confirmPassword
 *             properties:
 *               name:
 *                 type: string
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [Developer, Project Manager, CCB Member, Auditor, Admin]
 *     responses:
 *       201:
 *         description: User successfully registered
 *       400:
 *         description: Validation error or user already exists
 */
router.post('/register', authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in to the system
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - usernameOrEmail
 *               - password
 *             properties:
 *               usernameOrEmail:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully logged in
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset user password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               email:
 *                 type: string
 *               newPassword:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Passwords do not match
 *       404:
 *         description: User not found
 */
router.post('/reset-password', authController.resetPassword);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get logged in user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile payload
 *       401:
 *         description: Unauthorized
 */
// Protected routes
router.get('/profile', authMiddleware, authController.getProfile);

/**
 * @swagger
 * /api/auth/profile:
 *   patch:
 *     summary: Update logged in user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               contactInfo:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User profile successfully updated
 *       400:
 *         description: Invalid updates
 *       401:
 *         description: Unauthorized
 */
router.patch('/profile', authMiddleware, authController.updateProfile);

router.get('/users', authMiddleware, authController.getAllUsers);

module.exports = router;
