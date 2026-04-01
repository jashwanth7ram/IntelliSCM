const mongoose = require('mongoose');

/**
 * YAML-like pipeline definition per project (simulated CI/CD).
 * Stages are parsed from yamlSource server-side for display only.
 */
const pipelineDefinitionSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  name: { type: String, required: true },
  yamlSource: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

pipelineDefinitionSchema.index({ project: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('PipelineDefinition', pipelineDefinitionSchema);
