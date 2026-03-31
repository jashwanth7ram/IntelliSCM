const mongoose = require('mongoose');

const changeRequestSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  priorityLevel: { 
    type: String, 
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium' 
  },
  relatedCommitId: { type: String },
  branchName: { type: String },
  repositoryUrl: { type: String },
  changeType: { type: String, enum: ['Feature', 'Bug Fix', 'Refactor', 'Security', 'Performance', 'Infrastructure'], default: 'Feature' },
  attachments: [{ type: String }],
  // Affected Configuration Items (§5.2 CI Identification)
  affectedCIs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ConfigurationItem' }],
  filesAffected: [{ type: String }],
  status: { 
    type: String, 
    enum: ['Submitted', 'Under Review', 'Approved', 'Rejected', 'Needs Modification', 'Emergency Fix'],
    default: 'Submitted'
  },
  // AI metrics
  estimatedImpact: { type: String }, // user provided estimate
  linesOfCodeModified: { type: Number, default: 0 },
  riskScore: { type: String, enum: ['Low', 'Medium', 'High'] },
  impactLevel: { type: String, enum: ['Minor', 'Moderate', 'Critical'] },
  aiRecommendation: { type: String, enum: ['Approve', 'Review Carefully', 'High Risk'] },
  // Configuration Status Accounting — IEEE 828 §5.4
  // Immutable log of every status transition
  transitionHistory: [{
    fromStatus: { type: String },
    toStatus: { type: String, required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    comment: { type: String, default: '' },
    changedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('ChangeRequest', changeRequestSchema);
