const ChangeRequest = require('../models/ChangeRequest');
const Project = require('../models/Project');
const User = require('../models/User');
const ConfigurationItem = require('../models/ConfigurationItem');
const aiImpactService = require('../services/aiImpactService');
const notificationService = require('../services/notificationService');
const emailService = require('../services/emailService');

exports.submitCR = async (req, res) => {
  try {
    // Perform AI analysis immediately on submission
    const aiAnalysis = aiImpactService.analyze(req.body);
    const requiresExtraApproval =
      aiAnalysis.riskScore === 'High' || aiAnalysis.recommendation === 'High Risk';

    const cr = new ChangeRequest({
      ...req.body,
      submittedBy: req.user._id,
      riskScore: aiAnalysis.riskScore,
      impactLevel: aiAnalysis.impactLevel,
      aiRecommendation: aiAnalysis.recommendation,
      requiresExtraApproval,
      status: 'Submitted',
      // Log the initial submission as the first transition entry
      transitionHistory: [{
        fromStatus: null,
        toStatus: 'Submitted',
        changedBy: req.user._id,
        comment: 'Change request submitted',
        changedAt: new Date()
      }]
    });

    await cr.save();

    // Trigger Notification Module
    await notificationService.notifyProjectStakeholders(
      cr.project, 
      `New Change Request Submitted: ${cr.title}`, 
      'CR_SUBMITTED', 
      cr._id
    );

    if (requiresExtraApproval) {
      await notificationService.notifyAuditStakeholders(
        cr.project,
        `High-risk CR requires additional review: ${cr.title}`,
        'HIGH_RISK_CR_FLAGGED',
        cr._id
      ).catch(() => {});
    }

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
    const filter = {};
    if (req.query.project) filter.project = req.query.project;

    const crs = await ChangeRequest.find(filter)
      .populate('project', 'name')
      .populate('submittedBy', 'name')
      .populate('assignee', 'name');
    res.json(crs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCRById = async (req, res) => {
    try {
        const cr = await ChangeRequest.findById(req.params.id)
            .populate('project', 'name')
            .populate('submittedBy', 'name')
            .populate('assignee', 'name')
            .populate('linkedRelease', 'version title status')
            .populate('activePipelineRun', 'overallStatus stages')
            .populate('comments.user', 'name');
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

/**
 * PATCH /api/crs/:id/status
 * Configuration Status Accounting (IEEE 828 §5.4)
 * Records every status transition with actor + comment.
 */
exports.updateCRStatus = async (req, res) => {
  try {
    const { status, comment } = req.body;
    const cr = await ChangeRequest.findById(req.params.id);
    if (!cr) return res.status(404).json({ error: 'CR not found' });

    const fromStatus = cr.status;

    // Append transition to history log
    cr.transitionHistory.push({
      fromStatus,
      toStatus: status,
      changedBy: req.user._id,
      comment: comment || '',
      changedAt: new Date()
    });

    cr.status = status;

    // If CR is approved, mark affected CIs as 'Under Change'
    if (status === 'Approved' && cr.affectedCIs && cr.affectedCIs.length > 0) {
      await ConfigurationItem.updateMany(
        { _id: { $in: cr.affectedCIs } },
        { $set: { status: 'Under Change' } }
      );
    }

    await cr.save();

    // Notify submitter of status change
    await notificationService.notifyUser(
      cr.submittedBy,
      `CR "${cr.title}" status changed to ${status}`,
      'CR_STATUS_CHANGED',
      cr._id
    ).catch(() => {}); // non-blocking

    res.json(cr);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * GET /api/crs/status-report?project=<id>
 * Configuration Status Accounting report (IEEE 828 §5.4)
 */
exports.getStatusReport = async (req, res) => {
  try {
    const filter = {};
    if (req.query.project) filter.project = req.query.project;

    const crs = await ChangeRequest.find(filter)
      .populate('submittedBy', 'name')
      .populate('project', 'name')
      .populate('affectedCIs', 'ciId name currentVersion')
      .select('title status priorityLevel riskScore impactLevel aiRecommendation transitionHistory affectedCIs createdAt updatedAt');

    // Summarize counts by status
    const summary = crs.reduce((acc, cr) => {
      acc[cr.status] = (acc[cr.status] || 0) + 1;
      return acc;
    }, {});

    res.json({ summary, crs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/crs/change-calendar
 * Provides scheduled CRs and overlapping windows for conflict visibility.
 */
exports.getChangeCalendar = async (req, res) => {
  try {
    const { project } = req.query;
    const filter = {
      plannedStart: { $ne: null },
      plannedEnd: { $ne: null },
      status: { $in: ['Submitted', 'Under Review', 'Approved', 'Emergency Fix', 'Needs Modification'] }
    };
    if (project) filter.project = project;

    const scheduled = await ChangeRequest.find(filter)
      .populate('project', 'name')
      .populate('submittedBy', 'name')
      .select('title status plannedStart plannedEnd environment project submittedBy priorityLevel riskScore')
      .sort({ plannedStart: 1 })
      .lean();

    const conflicts = [];
    for (let i = 0; i < scheduled.length; i += 1) {
      for (let j = i + 1; j < scheduled.length; j += 1) {
        const a = scheduled[i];
        const b = scheduled[j];
        if (String(a._id) === String(b._id)) continue;
        if (String(a.project?._id || a.project) !== String(b.project?._id || b.project)) continue;
        if ((a.environment || 'Production') !== (b.environment || 'Production')) continue;

        const overlaps = new Date(a.plannedStart) < new Date(b.plannedEnd)
          && new Date(b.plannedStart) < new Date(a.plannedEnd);
        if (!overlaps) continue;

        conflicts.push({
          project: a.project?.name || 'Unknown',
          environment: a.environment || 'Production',
          crA: { id: a._id, title: a.title, status: a.status, plannedStart: a.plannedStart, plannedEnd: a.plannedEnd },
          crB: { id: b._id, title: b.title, status: b.status, plannedStart: b.plannedStart, plannedEnd: b.plannedEnd }
        });
      }
    }

    res.json({ scheduled, conflicts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
/**
 * POST /api/crs/:id/comments
 */
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const cr = await ChangeRequest.findById(req.params.id);
    if (!cr) return res.status(404).json({ error: 'CR not found' });

    cr.comments.push({
      user: req.user._id,
      text: text,
      createdAt: new Date()
    });

    cr.activityLog.push({
      action: 'Added a comment',
      performedBy: req.user._id,
      timestamp: new Date()
    });

    await cr.save();
    
    const populatedCR = await ChangeRequest.findById(cr._id).populate('comments.user', 'name');
    res.status(201).json(populatedCR.comments);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * PUT /api/crs/:id/labels
 */
exports.updateLabels = async (req, res) => {
  try {
    const { labels } = req.body;
    const cr = await ChangeRequest.findById(req.params.id);
    if (!cr) return res.status(404).json({ error: 'CR not found' });

    cr.labels = labels;
    cr.activityLog.push({
      action: 'Updated labels',
      performedBy: req.user._id,
      timestamp: new Date()
    });

    await cr.save();
    res.json(cr.labels);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * POST /api/crs/:id/commits — append simulated git commit to CR
 */
exports.addCommit = async (req, res) => {
  try {
    const { sha, message, author, branch } = req.body;
    const cr = await ChangeRequest.findById(req.params.id);
    if (!cr) return res.status(404).json({ error: 'CR not found' });
    const shortSha = sha || `sim-${Date.now().toString(36)}`;
    cr.commits.push({
      sha: shortSha,
      message: message || 'Simulated commit',
      author: author || req.user.name || 'Developer',
      date: new Date(),
      branch: branch || cr.branchName || 'main',
    });
    cr.activityLog.push({
      action: `Commit linked: ${shortSha.slice(0, 7)}`,
      performedBy: req.user._id,
      timestamp: new Date(),
    });
    await cr.save();
    res.status(201).json(cr.commits);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * PATCH /api/crs/:id/repo-tree — optional simulated repo structure (JSON string)
 */
exports.setRepoTree = async (req, res) => {
  try {
    const { repoTreeSnapshot } = req.body;
    const cr = await ChangeRequest.findById(req.params.id);
    if (!cr) return res.status(404).json({ error: 'CR not found' });
    cr.repoTreeSnapshot = typeof repoTreeSnapshot === 'string'
      ? repoTreeSnapshot
      : JSON.stringify(repoTreeSnapshot);
    await cr.save();
    res.json({ repoTreeSnapshot: cr.repoTreeSnapshot });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
