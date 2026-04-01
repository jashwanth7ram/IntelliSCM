const ChangeRequest = require('../models/ChangeRequest');
const PipelineRun = require('../models/PipelineRun');
const Deployment = require('../models/Deployment');
const Release = require('../models/Release');

/**
 * DORA-style metrics from stored events (approximate).
 */
exports.metrics = async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days, 10) || 14, 90);
    const projectFilter = req.query.project ? { project: req.query.project } : {};
    const since = new Date(Date.now() - days * 86400000);

    const deploys = await Deployment.find({
      ...projectFilter,
      createdAt: { $gte: since },
      status: { $in: ['success', 'failed'] },
    }).lean();

    const deploymentFrequency = deploys.filter(d => d.status === 'success').length / Math.max(days / 7, 1);
    const failed = deploys.filter(d => d.status === 'failed').length;
    const changeFailureRate = deploys.length ? failed / deploys.length : 0;

    const crs = await ChangeRequest.find({
      ...projectFilter,
      createdAt: { $gte: since },
    }).select('createdAt transitionHistory').lean();

    let leadSumMs = 0;
    let leadCount = 0;
    crs.forEach((cr) => {
      const approved = (cr.transitionHistory || []).find(t => t.toStatus === 'Approved');
      if (approved && cr.createdAt) {
        leadSumMs += new Date(approved.changedAt) - new Date(cr.createdAt);
        leadCount += 1;
      }
    });
    const leadTimeHours = leadCount ? leadSumMs / leadCount / 3600000 : null;

    const pipelineRuns = await PipelineRun.find({
      ...projectFilter,
      createdAt: { $gte: since },
    }).lean();
    const pipelineSuccessRate = pipelineRuns.length
      ? pipelineRuns.filter(r => r.overallStatus === 'success').length / pipelineRuns.length
      : null;

    const highRiskOpen = await ChangeRequest.countDocuments({
      ...projectFilter,
      riskScore: 'High',
      status: { $in: ['Submitted', 'Under Review', 'Needs Modification'] },
    });

    res.json({
      periodDays: days,
      projectId: req.query.project || null,
      deploymentFrequencyPerWeek: Math.round(deploymentFrequency * 10) / 10,
      changeFailureRate: Math.round(changeFailureRate * 1000) / 1000,
      leadTimeForChangesHours: leadTimeHours != null ? Math.round(leadTimeHours * 10) / 10 : null,
      pipelineSuccessRate: pipelineSuccessRate != null ? Math.round(pipelineSuccessRate * 1000) / 1000 : null,
      highRiskCRsOpen: highRiskOpen,
      counts: {
        deployments: deploys.length,
        pipelineRuns: pipelineRuns.length,
        changeRequests: crs.length,
      },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

/**
 * Full trace chain: CR → commits → pipeline → deployments → release
 */
exports.trace = async (req, res) => {
  try {
    const cr = await ChangeRequest.findById(req.params.crId)
      .populate('project', 'name')
      .populate('linkedRelease', 'version title status releaseNotes')
      .populate('submittedBy', 'name')
      .lean();
    if (!cr) return res.status(404).json({ error: 'CR not found' });

    const runs = await PipelineRun.find({ changeRequest: cr._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const deployments = await Deployment.find({ changeRequest: cr._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const timeline = [];

    timeline.push({
      kind: 'cr_created',
      at: cr.createdAt,
      label: 'Change Request created',
      detail: cr.title,
    });
    (cr.commits || []).forEach((c) => {
      timeline.push({
        kind: 'commit',
        at: c.date || cr.updatedAt,
        label: `Commit ${c.sha?.slice(0, 7) || ''}`,
        detail: c.message,
      });
    });
    runs.forEach((r) => {
      timeline.push({
        kind: 'pipeline',
        at: r.startedAt || r.createdAt,
        label: `Pipeline ${r.overallStatus}`,
        detail: r.stages?.map(s => `${s.name}:${s.status}`).join(', ') || '',
        id: r._id,
      });
    });
    deployments.forEach((d) => {
      timeline.push({
        kind: 'deployment',
        at: d.deployedAt || d.createdAt,
        label: `Deploy ${d.environment} — ${d.status}`,
        detail: d.versionLabel || '',
        id: d._id,
      });
    });
    if (cr.linkedRelease) {
      const rel = cr.linkedRelease;
      timeline.push({
        kind: 'release',
        at: rel.releasedAt || rel.updatedAt,
        label: `Release ${rel.version} (${rel.status})`,
        detail: rel.title || '',
        id: rel._id,
      });
    }

    timeline.sort((a, b) => new Date(a.at) - new Date(b.at));

    res.json({
      changeRequest: cr,
      pipelineRuns: runs,
      deployments,
      timeline,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
