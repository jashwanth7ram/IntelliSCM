const mongoose = require('mongoose');

const stageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'running', 'success', 'failed', 'skipped'],
    default: 'pending',
  },
  startedAt: { type: Date },
  finishedAt: { type: Date },
  logSnippet: { type: String, default: '' },
}, { _id: false });

const pipelineRunSchema = new mongoose.Schema({
  changeRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'ChangeRequest', required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  definition: { type: mongoose.Schema.Types.ObjectId, ref: 'PipelineDefinition' },
  overallStatus: {
    type: String,
    enum: ['pending', 'running', 'success', 'failed', 'cancelled'],
    default: 'pending',
  },
  stages: [stageSchema],
  startedAt: { type: Date },
  finishedAt: { type: Date },
  triggeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

pipelineRunSchema.index({ changeRequest: 1, createdAt: -1 });

module.exports = mongoose.model('PipelineRun', pipelineRunSchema);
