const Notification = require('../models/Notification');
const Project = require('../models/Project');
const User = require('../models/User');

exports.notifyProjectStakeholders = async (projectId, message, type, relatedEntityId) => {
  try {
    const project = await Project.findById(projectId).populate('manager teamMembers');
    if (!project) return;

    // Collect all unique user IDs (Manager + Team Members)
    const stakeholderIds = new Set();
    if (project.manager) stakeholderIds.add(project.manager._id.toString());
    
    project.teamMembers.forEach(member => {
        stakeholderIds.add(member._id.toString());
    });

    const notifications = Array.from(stakeholderIds).map(userId => ({
      user: userId,
      message,
      type,
      relatedEntityId
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
    
    console.log(`[Notification Service] Sent ${notifications.length} alerts for Project ${projectId}`);
  } catch (error) {
    console.error('[Notification Service Error]', error);
  }
};

// Notifies project stakeholders AND all CCB Members (used for audit scheduling)
exports.notifyAuditStakeholders = async (projectId, message, type, relatedEntityId) => {
  try {
    const [project, ccbMembers] = await Promise.all([
      Project.findById(projectId).populate('manager teamMembers'),
      User.find({ role: 'CCB Member' }, '_id')
    ]);

    const stakeholderIds = new Set();

    // Add project stakeholders
    if (project) {
      if (project.manager) stakeholderIds.add(project.manager._id.toString());
      project.teamMembers.forEach(m => stakeholderIds.add(m._id.toString()));
    }

    // Add all CCB Members
    ccbMembers.forEach(u => stakeholderIds.add(u._id.toString()));

    const notifications = Array.from(stakeholderIds).map(userId => ({
      user: userId, message, type, relatedEntityId
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    console.log(`[Notification Service] Audit alert sent to ${notifications.length} users (incl. CCB Members)`);
  } catch (error) {
    console.error('[Notification Service Error]', error);
  }
};

exports.notifyUser = async (userId, message, type, relatedEntityId) => {
    try {
        const notif = new Notification({ user: userId, message, type, relatedEntityId });
        await notif.save();
    } catch (error) {
        console.error('[Notification Service Error]', error);
    }
};
