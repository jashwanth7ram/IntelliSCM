/**
 * @swagger
 * tags:
 *   name: Change Control Board
 *   description: CCB evaluating Change Requests and submitting decisions
 */

const express = require('express');
const router = express.Router();
const ccbController = require('../controllers/ccbController');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth');

router.use(authMiddleware);

/**
 * @swagger
 * /api/ccb/decide:
 *   post:
 *     summary: Submit a CCB decision for a CR
 *     description: Submits a decision and advances the CR Status. (CCB Member, Admin only)
 *     tags: [Change Control Board]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - changeRequestId
 *               - decisionType
 *               - comments
 *             properties:
 *               changeRequestId:
 *                 type: string
 *                 description: The ID of the Change Request
 *               decisionType:
 *                 type: string
 *                 enum: [Approve, Reject, Request Modification]
 *               comments:
 *                 type: string
 *                 description: CCB review comments
 *     responses:
 *       201:
 *         description: Decision submitted successfully
 *       400:
 *         description: Missing fields or invalid request
 *       403:
 *         description: Forbidden
 *       404:
 *         description: CR not found
 */
// Only CCB Members (and maybe Admin) can submit decisions
router.post('/decide', roleMiddleware(['CCB Member', 'Admin']), ccbController.submitDecision);

/**
 * @swagger
 * /api/ccb/{crId}:
 *   get:
 *     summary: Get all decisions for a specific Change Request
 *     tags: [Change Control Board]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: crId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of decisions made on this CR
 *       401:
 *         description: Unauthorized
 */
// Anyone involved can view decisions
router.get('/:crId', ccbController.getDecisionsForCR);

module.exports = router;
