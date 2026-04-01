const Deployment = require('../models/Deployment');
const ChangeRequest = require('../models/ChangeRequest');
const notificationService = require('../services/notificationService');

exports.list = async (req, res) => {
  try {
    const filter = {};
    if (req.query.project) filter.project = req.query.project;
    if (req.query.environment) filter.environment = req.query.environment;
    const list = await Deployment.find(filter)
      .populate('project', 'name')
      .populate('changeRequest', 'title status')
      .populate('release', 'version title')
      .populate('pipelineRun', 'overallStatus')
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.create = async (req, res) => {
  try {
    const {
      project, environment, versionLabel, changeRequest, release, pipelineRun, notes,
    } = req.body;
    const dep = new Deployment({
      project,
      environment,
      versionLabel,
      changeRequest,
      release,
      pipelineRun,
      status: 'running',
      deployedAt: new Date(),
      deployedBy: req.user._id,
      notes: notes || '',
    });
    await dep.save();
    await notificationService.notifyProjectStakeholders(
      project,
      `Deployment to ${environment} started${versionLabel ? ` (${versionLabel})` : ''}`,
      'DEPLOY_STARTED',
      changeRequest || release || dep._id
    );
    res.status(201).json(dep);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const dep = await Deployment.findById(req.params.id).populate('project');
    if (!dep) return res.status(404).json({ error: 'Deployment not found' });
    dep.status = status;
    if (status === 'success' || status === 'failed' || status === 'rolled_back') {
      dep.deployedAt = new Date();
    }
    await dep.save();
    const type = status === 'success' ? 'DEPLOY_SUCCEEDED' : 'DEPLOY_FAILED';
    if (status === 'success' || status === 'failed') {
      await notificationService.notifyProjectStakeholders(
        dep.project._id,
        `Deployment ${status} in ${dep.environment}`,
        type,
        dep.changeRequest || dep.release || dep._id
      );
    }
    res.json(dep);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

/** Per-environment latest status for dashboard */
exports.envSummary = async (req, res) => {
  try {
    const { project } = req.query;
    const filter = project ? { project } : {};
    const envs = ['Development', 'QA', 'Staging', 'Production'];
    const summary = {};
    for (const env of envs) {
      const latest = await Deployment.findOne({ ...filter, environment: env })
        .sort({ createdAt: -1 })
        .populate('changeRequest', 'title')
        .populate('release', 'version')
        .lean();
      summary[env] = latest || null;
    }
    res.json(summary);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
