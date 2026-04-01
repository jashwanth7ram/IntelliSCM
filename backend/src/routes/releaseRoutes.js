const express = require('express');
const router = express.Router();
const releaseController = require('../controllers/releaseController');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth');

router.use(authMiddleware);

router.get('/', releaseController.list);
router.post('/', roleMiddleware(['Project Manager', 'Admin']), releaseController.create);
router.get('/:id', releaseController.getById);
router.patch('/:id/crs', roleMiddleware(['Project Manager', 'Admin']), releaseController.updateCRs);
router.post('/:id/release-notes', roleMiddleware(['Project Manager', 'Admin', 'Developer']), releaseController.generateReleaseNotes);
router.post('/:id/submit-approval', roleMiddleware(['Project Manager', 'Admin']), releaseController.submitForApproval);
router.post('/:id/approve', roleMiddleware(['CCB Member', 'Admin']), releaseController.approve);
router.post('/:id/mark-released', roleMiddleware(['Project Manager', 'Admin']), releaseController.markReleased);

module.exports = router;
