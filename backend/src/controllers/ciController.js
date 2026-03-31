const ConfigurationItem = require('../models/ConfigurationItem');
const Project = require('../models/Project');

// GET /api/cis?project=<id>
exports.getCIs = async (req, res) => {
  try {
    const filter = {};
    if (req.query.project) filter.project = req.query.project;
    if (req.query.status)  filter.status  = req.query.status;
    if (req.query.type)    filter.type    = req.query.type;

    const cis = await ConfigurationItem.find(filter)
      .populate('project', 'name')
      .populate('owner', 'name email')
      .populate('parentCI', 'ciId name')
      .sort({ createdAt: -1 });

    res.json(cis);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/cis/:id
exports.getCIById = async (req, res) => {
  try {
    const ci = await ConfigurationItem.findById(req.params.id)
      .populate('project', 'name')
      .populate('owner', 'name email')
      .populate('versionHistory.changedBy', 'name')
      .populate('versionHistory.changeRequest', 'title status');
    if (!ci) return res.status(404).json({ error: 'CI not found' });
    res.json(ci);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/cis   — create a new CI
exports.createCI = async (req, res) => {
  try {
    const ci = new ConfigurationItem({
      ...req.body,
      owner: req.user._id,
      // Log initial version in history
      versionHistory: [{
        version: req.body.currentVersion || '1.0.0',
        changedBy: req.user._id,
        changeDescription: 'Initial registration',
      }]
    });
    await ci.save();
    res.status(201).json(ci);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// PATCH /api/cis/:id  — update CI (status, description, etc.)
exports.updateCI = async (req, res) => {
  try {
    const ci = await ConfigurationItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!ci) return res.status(404).json({ error: 'CI not found' });
    res.json(ci);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// POST /api/cis/:id/version-bump  — bump version when a CR is approved
exports.bumpVersion = async (req, res) => {
  try {
    const { newVersion, changeDescription, changeRequestId } = req.body;
    const ci = await ConfigurationItem.findById(req.params.id);
    if (!ci) return res.status(404).json({ error: 'CI not found' });

    ci.currentVersion = newVersion;
    ci.versionHistory.push({
      version: newVersion,
      changedBy: req.user._id,
      changeRequest: changeRequestId || null,
      changeDescription: changeDescription || 'Version updated',
    });
    await ci.save();
    res.json(ci);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// DELETE /api/cis/:id  — soft-delete (archive)
exports.archiveCI = async (req, res) => {
  try {
    const ci = await ConfigurationItem.findByIdAndUpdate(
      req.params.id,
      { status: 'Archived' },
      { new: true }
    );
    if (!ci) return res.status(404).json({ error: 'CI not found' });
    res.json({ message: 'CI archived', ci });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/cis/stats/:projectId  — summary stats for a project (Status Accounting)
exports.getCIStats = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const [total, byType, byStatus] = await Promise.all([
      ConfigurationItem.countDocuments({ project: projectId }),
      ConfigurationItem.aggregate([
        { $match: { project: require('mongoose').Types.ObjectId.createFromHexString(projectId) } },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]),
      ConfigurationItem.aggregate([
        { $match: { project: require('mongoose').Types.ObjectId.createFromHexString(projectId) } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);
    res.json({ total, byType, byStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
