const ChangeRequest = require('../models/ChangeRequest');
const ConfigurationItem = require('../models/ConfigurationItem');
const Audit = require('../models/Audit');

/**
 * GET /api/activity
 * Fetches recent activities across the system.
 */
exports.getGlobalActivity = async (req, res) => {
  try {
    // In this simplified architecture, we aggregate activityLog from all ChangeRequests
    // In a production system, this would be a separate Activity collection.
    const crs = await ChangeRequest.find({})
      .select('title activityLog')
      .populate('activityLog.performedBy', 'name role')
      .sort({ 'activityLog.timestamp': -1 })
      .limit(20);

    const activities = crs.flatMap(cr => 
      cr.activityLog.map(log => ({
        id: log._id,
        entityType: 'ChangeRequest',
        entityId: cr._id,
        entityTitle: cr.title,
        action: log.action,
        user: log.performedBy,
        timestamp: log.timestamp
      }))
    ).sort((a, b) => b.timestamp - a.timestamp);

    res.json(activities.slice(0, 30));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
