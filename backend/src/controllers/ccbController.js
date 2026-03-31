const ApprovalDecision = require('../models/ApprovalDecision');
const ChangeRequest = require('../models/ChangeRequest');
const notificationService = require('../services/notificationService');

exports.submitDecision = async (req, res) => {
  try {
    const { changeRequestId, crId, decisionType, decision, comments } = req.body;
    const finalCrId     = changeRequestId || crId;
    const finalDecision = decisionType    || decision;

    const cr = await ChangeRequest.findById(finalCrId);
    if (!cr) {
      return res.status(404).json({ error: 'Change Request not found' });
    }

    // Determine new CR status from decision
    let newStatus = cr.status;
    if      (finalDecision === 'Approve'  || finalDecision === 'Approved')  newStatus = 'Approved';
    else if (finalDecision === 'Reject'   || finalDecision === 'Rejected')  newStatus = 'Rejected';
    else if (finalDecision === 'Request Modification')                      newStatus = 'Needs Modification';

    const approvalDecision = new ApprovalDecision({
      changeRequest: finalCrId,
      reviewer:      req.user._id,
      decisionType:  finalDecision,
      comments:      comments || ''
    });
    await approvalDecision.save();

    // Use updateOne to avoid re-validating unrelated required fields on old documents
    await ChangeRequest.updateOne(
      { _id: finalCrId },
      { $set: { status: newStatus } }
    );

    // Notify stakeholders (non-blocking — swallow errors)
    const alertType = newStatus === 'Approved' ? 'CR_APPROVED' : 'CR_REJECTED';
    notificationService.notifyProjectStakeholders(
      cr.project,
      `Change Request '${cr.title}' has been ${newStatus} by CCB.`,
      alertType,
      cr._id
    ).catch(() => {});

    res.status(201).json({ decision: approvalDecision, crStatus: newStatus });
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
