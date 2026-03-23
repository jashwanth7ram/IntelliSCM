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
  attachments: [{ type: String }],
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
  aiRecommendation: { type: String, enum: ['Approve', 'Review Carefully', 'High Risk'] }
}, { timestamps: true });

module.exports = mongoose.model('ChangeRequest', changeRequestSchema);
