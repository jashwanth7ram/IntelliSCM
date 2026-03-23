const ChangeRequest = require('../models/ChangeRequest');
const Project = require('../models/Project');
const User = require('../models/User');
const aiImpactService = require('../services/aiImpactService');
const notificationService = require('../services/notificationService');
const emailService = require('../services/emailService');

exports.submitCR = async (req, res) => {
  try {
    // Perform AI analysis immediately on submission
    const aiAnalysis = aiImpactService.analyze(req.body);

    const cr = new ChangeRequest({
      ...req.body,
      submittedBy: req.user._id,
      riskScore: aiAnalysis.riskScore,
      impactLevel: aiAnalysis.impactLevel,
      aiRecommendation: aiAnalysis.recommendation,
      status: 'Submitted'
    });

    await cr.save();

    // Trigger Notification Module
    await notificationService.notifyProjectStakeholders(
      cr.project, 
      `New Change Request Submitted: ${cr.title}`, 
      'CR_SUBMITTED', 
      cr._id
    );

    // Send E-mail Notification
    const project = await Project.findById(cr.project).populate('manager');
    const ccbMembers = await User.find({ role: 'CCB Member' });
    let emails = ccbMembers.map(u => u.email).filter(Boolean);
    if (project && project.manager && project.manager.email) {
      emails.push(project.manager.email);
    }
    
    // De-duplicate emails
    emails = [...new Set(emails)];
    
    emailService.sendCRSubmissionEmail(
      emails,
      cr.title,
      req.user.name || 'A Developer',
      project ? project.name : 'Unknown Project'
    );

    res.status(201).json(cr);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getCRs = async (req, res) => {
  try {
    const crs = await ChangeRequest.find()
      .populate('project', 'name')
      .populate('submittedBy', 'name');
    res.json(crs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCRById = async (req, res) => {
    try {
        const cr = await ChangeRequest.findById(req.params.id)
            .populate('project', 'name')
            .populate('submittedBy', 'name');
        if (!cr) return res.status(404).json({ error: 'CR not found' });
        res.json(cr);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateCR = async (req, res) => {
  try {
    const cr = await ChangeRequest.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!cr) {
      return res.status(404).json({ error: 'CR not found' });
    }
    res.json(cr);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
