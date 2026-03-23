const mongoose = require('mongoose');

const baselineSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  versionNumber: { type: String, required: true },
  description: { type: String, required: true },
  releaseTag: {
    branchName: { type: String },
    gitReference: { type: String }
  },
  releaseNotes: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('Baseline', baselineSchema);
