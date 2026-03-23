const Baseline = require('../models/Baseline');
const notificationService = require('../services/notificationService');

exports.createBaseline = async (req, res) => {
  try {
    const baseline = new Baseline({
      ...req.body,
      createdBy: req.user._id
    });

    await baseline.save();

    await notificationService.notifyProjectStakeholders(
      baseline.project,
      `New Baseline Created: v${baseline.versionNumber} - ${baseline.description}`,
      'BASELINE_CREATED',
      baseline._id
    );

    res.status(201).json(baseline);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getBaselinesForProject = async (req, res) => {
    try {
        const baselines = await Baseline.find({ project: req.params.projectId })
            .populate('createdBy', 'name');
        res.json(baselines);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
