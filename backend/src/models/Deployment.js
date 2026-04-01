const mongoose = require('mongoose');

const deploymentSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  environment: {
    type: String,
    enum: ['Development', 'QA', 'Staging', 'Production'],
    required: true,
  },
  versionLabel: { type: String },
  changeRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'ChangeRequest' },
  release: { type: mongoose.Schema.Types.ObjectId, ref: 'Release' },
  pipelineRun: { type: mongoose.Schema.Types.ObjectId, ref: 'PipelineRun' },
  status: {
    type: String,
    enum: ['pending', 'running', 'success', 'failed', 'rolled_back'],
    default: 'pending',
  },
  deployedAt: { type: Date },
  deployedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String, default: '' },
}, { timestamps: true });

deploymentSchema.index({ project: 1, environment: 1, createdAt: -1 });

module.exports = mongoose.model('Deployment', deploymentSchema);
