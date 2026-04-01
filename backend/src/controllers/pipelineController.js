const PipelineDefinition = require('../models/PipelineDefinition');
const PipelineRun = require('../models/PipelineRun');
const ChangeRequest = require('../models/ChangeRequest');
const { parsePipelineStages } = require('../utils/parsePipelineYaml');
const notificationService = require('../services/notificationService');

exports.listDefinitions = async (req, res) => {
  try {
    const filter = {};
    if (req.query.project) filter.project = req.query.project;
    const defs = await PipelineDefinition.find(filter).populate('project', 'name').sort({ name: 1 });
    res.json(defs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.createDefinition = async (req, res) => {
  try {
    const { project, name, yamlSource, isDefault } = req.body;
    if (!project) {
      return res.status(400).json({ error: 'Project is required' });
    }
    const defName = (name && String(name).trim()) || 'default';
    const yamlStr = yamlSource != null && String(yamlSource).trim() !== '' ? yamlSource : defaultYaml();

    const existing = await PipelineDefinition.findOne({ project, name: defName });
    if (existing) {
      existing.yamlSource = yamlStr;
      existing.isDefault = !!isDefault;
      existing.createdBy = req.user._id;
      await existing.save();
      return res.status(200).json(existing);
    }

    const def = new PipelineDefinition({
      project,
      name: defName,
      yamlSource: yamlStr,
      isDefault: !!isDefault,
      createdBy: req.user._id,
    });
    await def.save();
    res.status(201).json(def);
  } catch (e) {
    if (e.code === 11000) {
      return res.status(409).json({
        error: 'A pipeline definition with this name already exists for this project. Try a different name or save again to update (same name updates in place).',
      });
    }
    res.status(400).json({ error: e.message });
  }
};

exports.listRuns = async (req, res) => {
  try {
    const filter = {};
    if (req.query.project) filter.project = req.query.project;
    if (req.query.cr) filter.changeRequest = req.query.cr;
    const runs = await PipelineRun.find(filter)
      .populate('changeRequest', 'title status')
      .populate('project', 'name')
      .populate('definition', 'name')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(runs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.getRunById = async (req, res) => {
  try {
    const run = await PipelineRun.findById(req.params.id)
      .populate('changeRequest', 'title status riskScore')
      .populate('project', 'name')
      .populate('definition', 'name yamlSource');
    if (!run) return res.status(404).json({ error: 'Pipeline run not found' });
    res.json(run);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.startRun = async (req, res) => {
  try {
    const { crId, definitionId } = req.body;
    const cr = await ChangeRequest.findById(crId);
    if (!cr) return res.status(404).json({ error: 'Change Request not found' });

    let def;
    if (definitionId) {
      def = await PipelineDefinition.findById(definitionId);
    } else {
      def = await PipelineDefinition.findOne({ project: cr.project, isDefault: true })
        || await PipelineDefinition.findOne({ project: cr.project });
    }
    if (!def) {
      return res.status(400).json({ error: 'No pipeline definition for this project. Create one first.' });
    }

    const stageNames = parsePipelineStages(def.yamlSource);
    const stages = stageNames.map((name, i) => ({
      name,
      status: i === 0 ? 'running' : 'pending',
      startedAt: i === 0 ? new Date() : undefined,
      logSnippet: i === 0 ? `[sim] ${name} started` : '',
    }));

    const run = new PipelineRun({
      changeRequest: cr._id,
      project: cr.project,
      definition: def._id,
      overallStatus: 'running',
      stages,
      startedAt: new Date(),
      triggeredBy: req.user._id,
    });
    await run.save();

    cr.activePipelineRun = run._id;
    cr.activityLog.push({
      action: `Pipeline run started (${run._id})`,
      performedBy: req.user._id,
      timestamp: new Date(),
    });
    await cr.save();

    await notificationService.notifyProjectStakeholders(
      cr.project,
      `Pipeline started for CR "${cr.title}"`,
      'PIPELINE_STARTED',
      cr._id
    );

    res.status(201).json(run);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.advanceRun = async (req, res) => {
  try {
    const run = await PipelineRun.findById(req.params.id);
    if (!run) return res.status(404).json({ error: 'Pipeline run not found' });
    if (['success', 'failed', 'cancelled'].includes(run.overallStatus)) {
      return res.status(400).json({ error: 'Run is already finished' });
    }

    const { failCurrent } = req.body;
    const stages = run.stages;
    let idx = stages.findIndex(s => s.status === 'running');
    if (idx === -1) idx = stages.findIndex(s => s.status === 'pending');
    if (idx === -1) {
      run.overallStatus = 'success';
      run.finishedAt = new Date();
      await run.save();
      return res.json(run);
    }

    const current = stages[idx];
    if (current.status === 'pending') {
      current.status = 'running';
      current.startedAt = new Date();
      current.logSnippet = `[sim] ${current.name} running`;
      await run.save();
      return res.json(run);
    }

    if (current.status === 'running') {
      if (failCurrent) {
        current.status = 'failed';
        current.finishedAt = new Date();
        current.logSnippet = `[sim] ${current.name} FAILED`;
        run.overallStatus = 'failed';
        run.finishedAt = new Date();
        await run.save();
        const cr = await ChangeRequest.findById(run.changeRequest);
        if (cr) {
          await notificationService.notifyProjectStakeholders(
            cr.project,
            `Pipeline failed at stage "${current.name}" for CR "${cr.title}"`,
            'PIPELINE_FAILED',
            cr._id
          );
        }
        return res.json(run);
      }
      current.status = 'success';
      current.finishedAt = new Date();
      current.logSnippet = `[sim] ${current.name} OK`;
      const next = stages[idx + 1];
      if (next) {
        next.status = 'running';
        next.startedAt = new Date();
        next.logSnippet = `[sim] ${next.name} started`;
      } else {
        run.overallStatus = 'success';
        run.finishedAt = new Date();
        await run.save();
        const cr = await ChangeRequest.findById(run.changeRequest);
        if (cr) {
          await notificationService.notifyProjectStakeholders(
            cr.project,
            `Pipeline succeeded for CR "${cr.title}"`,
            'PIPELINE_SUCCEEDED',
            cr._id
          );
        }
        return res.json(run);
      }
    }

    await run.save();
    res.json(run);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.simulateFullSuccess = async (req, res) => {
  try {
    const run = await PipelineRun.findById(req.params.id);
    if (!run) return res.status(404).json({ error: 'Pipeline run not found' });
    const now = new Date();
    run.stages.forEach((s, i) => {
      s.status = 'success';
      s.startedAt = s.startedAt || new Date(now.getTime() + i * 1000);
      s.finishedAt = new Date(now.getTime() + (i + 1) * 1000);
      s.logSnippet = `[sim] ${s.name} OK`;
    });
    run.overallStatus = 'success';
    run.finishedAt = now;
    await run.save();

    const cr = await ChangeRequest.findById(run.changeRequest);
    if (cr) {
      await notificationService.notifyProjectStakeholders(
        cr.project,
        `Pipeline succeeded for CR "${cr.title}"`,
        'PIPELINE_SUCCEEDED',
        cr._id
      );
    }
    res.json(run);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

function defaultYaml() {
  return `stages:
  - build
  - test
  - deploy
`;
}
