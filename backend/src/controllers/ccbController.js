const ApprovalDecision = require('../models/ApprovalDecision');
const ChangeRequest = require('../models/ChangeRequest');
const notificationService = require('../services/notificationService');

exports.submitDecision = async (req, res) => {
  try {
    const { changeRequestId, crId, decisionType, decision, comments } = req.body;
    const finalCrId = changeRequestId || crId;
    const finalDecision = decisionType || decision;

    const cr = await ChangeRequest.findById(finalCrId);
    if (!cr) {
      return res.status(404).json({ error: 'Change Request not found' });
    }

    const newDecision = new ApprovalDecision({
      changeRequest: finalCrId,
      reviewer: req.user._id,
      decisionType: finalDecision,
      comments
    });

    await newDecision.save();

    // Logic: If multiple CCB members exist in a real scenario, this would evaluate consensus.
    // For this prototype, a single Approve/Reject/Modify vote updates the overall status.
    if (finalDecision === 'Approve' || finalDecision === 'Approved') {
      cr.status = 'Approved';
    } else if (finalDecision === 'Reject' || finalDecision === 'Rejected') {
      cr.status = 'Rejected';
    } else if (finalDecision === 'Request Modification') {
      cr.status = 'Needs Modification';
    }

    await cr.save();

    // Notify stakeholders
    const alertType = cr.status === 'Approved' ? 'CR_APPROVED' : 'CR_REJECTED';
    await notificationService.notifyProjectStakeholders(
      cr.project,
      `Change Request '${cr.title}' has been ${cr.status} by CCB.`,
      alertType,
      cr._id
    );

    res.status(201).json({ decision: newDecision, crStatus: cr.status });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getDecisionsForCR = async (req, res) => {
    try {
        const decisions = await ApprovalDecision.find({ changeRequest: req.params.crId })
            .populate('reviewer', 'name role');
        res.json(decisions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
