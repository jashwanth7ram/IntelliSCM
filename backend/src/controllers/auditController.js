const Audit = require('../models/Audit');
const notificationService = require('../services/notificationService');

exports.scheduleAudit = async (req, res) => {
  try {
    const audit = new Audit({
      ...req.body,
      auditor: req.user._id
    });
    
    await audit.save();

    // Notify project stakeholders + all CCB Members
    const locationText = audit.auditLocation ? ` at ${audit.auditLocation}` : ''
    notificationService.notifyAuditStakeholders(
      audit.project,
      `📋 New ${audit.auditType} Audit scheduled on ${new Date(audit.auditDate).toDateString()}${locationText} — please prepare documentation.`,
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

exports.listAll = async (req, res) => {
  try {
    const audits = await Audit.find()
      .populate('project', 'name')
      .populate('auditor', 'name')
      .sort({ createdAt: -1 });
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
