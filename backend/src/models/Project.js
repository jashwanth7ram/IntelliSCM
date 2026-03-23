const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  repositoryLink: { type: String },
  version: { type: String, default: '1.0.0' },
  startDate: { type: Date, default: Date.now },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  teamMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
