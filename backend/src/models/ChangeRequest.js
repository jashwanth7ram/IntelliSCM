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
  plannedStart: { type: Date },
  plannedEnd: { type: Date },
  environment: { type: String, enum: ['Production', 'Staging', 'Development'], default: 'Production' },
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
  
  // Modern SCM features (Competitive Uplift)
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  labels: [{ 
    type: String, 
    enum: ['Bug', 'Feature', 'Security', 'Refactor', 'Performance', 'Critical', 'Documentation', 'Infrastructure'],
    default: 'Feature'
  }],
  comments: [{
    user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text:      { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  activityLog: [{
    action:      { type: String, required: true },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp:   { type: Date, default: Date.now },
    metadata:    { type: mongoose.Schema.Types.Map, of: String }
  }],
  isMergable: { type: Boolean, default: true },

  // ML code metrics — optionally provided by developer at CR submission (IEEE 828 §5.3)
  mlMetrics: {
    // Legacy/JM1 Metrics
    v_g:       { type: Number }, // McCabe Cyclomatic Complexity
    ev_g:      { type: Number }, // Essential Complexity
    iv_g:      { type: Number }, // Design Complexity
    branchCount:  { type: Number },
    // Modern Metrics (GitHub CK Metrics Comparison)
    cbo:       { type: Number }, // Coupling Between Objects
    wmc:       { type: Number }, // Weighted Methods per Class
    dit:       { type: Number }, // Depth of Inheritance Tree
    rfc:       { type: Number }, // Response For a Class
    lcom:      { type: Number }, // Lack of Cohesion of Methods
    totalMethods: { type: Number },
    tryCatchQty:  { type: Number }, 
    loopQty:      { type: Number },
  },
  // Configuration Status Accounting — IEEE 828 §5.4
  // Immutable log of every status transition
  transitionHistory: [{
    fromStatus: { type: String },
    toStatus: { type: String, required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    comment: { type: String, default: '' },
    changedAt: { type: Date, default: Date.now }
  }],

  // DevOps / Git integration (simulated or linked)
  linkedRelease: { type: mongoose.Schema.Types.ObjectId, ref: 'Release' },
  activePipelineRun: { type: mongoose.Schema.Types.ObjectId, ref: 'PipelineRun' },
  commits: [{
    sha: { type: String, required: true },
    message: { type: String, default: '' },
    author: { type: String, default: '' },
    date: { type: Date, default: Date.now },
    branch: { type: String, default: '' },
  }],
  /** Optional JSON string of simulated repo tree for UI */
  repoTreeSnapshot: { type: String },
  /** ML / policy: high-risk CRs need extra CCB approval */
  requiresExtraApproval: { type: Boolean, default: false },
  /** Target environment for deployment tracking */
  targetDeployEnv: {
    type: String,
    enum: ['Development', 'QA', 'Staging', 'Production'],
    default: 'Staging',
  },
}, { timestamps: true });

// Pre-save hook to log status transitions in activityLog
changeRequestSchema.pre('save', async function () {
  if (this.isModified('status')) {
    this.activityLog.push({
      action: `Status changed to ${this.status}`,
      performedBy: this.submittedBy // Simplification for new CRs; controllers will override for updates
    });
  }
});

module.exports = mongoose.model('ChangeRequest', changeRequestSchema);
