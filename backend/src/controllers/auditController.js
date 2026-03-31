const Audit = require('../models/Audit');
const notificationService = require('../services/notificationService');

exports.scheduleAudit = async (req, res) => {
  try {
    const audit = new Audit({
      ...req.body,
      auditor: req.user._id
    });
    
    await audit.save();

    // Non-blocking notification — never let this crash the response
    notificationService.notifyProjectStakeholders(
      audit.project,
      `A new ${audit.auditType} Audit has been scheduled on ${new Date(audit.auditDate).toDateString()}`,
      'AUDIT_SCHEDULED',
      audit._id
    ).catch(err => console.error('[auditController] notification failed:', err));

    res.status(201).json(audit);
  } catch (error) {
    console.error('[auditController] scheduleAudit error:', error);
    res.status(400).json({ error: error.message, details: error.errors });
  }
};

exports.getAuditsForProject = async (req, res) => {
    try {
        const audits = await Audit.find({ project: req.params.projectId })
            .populate('auditor', 'name role');
        res.json(audits);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateAudit = async (req, res) => {
  try {
    const audit = await Audit.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!audit) {
      return res.status(404).json({ error: 'Audit not found' });
    }
    res.json(audit);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
