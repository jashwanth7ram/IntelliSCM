const mongoose = require('mongoose');
const ChangeRequest = require('../models/ChangeRequest');

/**
 * GET /api/activity
 * Query: project=<ObjectId> — optional; when set, only CRs in that project are included.
 * Fetches recent activities from ChangeRequest.activityLog entries.
 */
exports.getGlobalActivity = async (req, res) => {
  try {
    const filter = {};
    if (req.query.project) {
      if (!mongoose.Types.ObjectId.isValid(req.query.project)) {
        return res.status(400).json({ error: 'Invalid project id' });
      }
      filter.project = req.query.project;
    }

    const crs = await ChangeRequest.find(filter)
      .select('title activityLog project')
      .populate('activityLog.performedBy', 'name role')
      .populate('project', 'name')
      .sort({ updatedAt: -1 })
      .limit(200);

    const activities = crs.flatMap((cr) =>
      (cr.activityLog || []).map((log) => ({
        id: log._id,
        entityType: 'ChangeRequest',
        entityId: cr._id,
        entityTitle: cr.title,
        projectId: cr.project?._id || cr.project,
        projectName: cr.project?.name || null,
        action: log.action,
        user: log.performedBy,
        timestamp: log.timestamp,
      }))
    ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json(activities.slice(0, 80));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
