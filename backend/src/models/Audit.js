const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  auditor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  auditType: { 
    type: String, 
    enum: ['FCA', 'PCA'],
    required: true
  },
  auditDate: { type: Date, required: true },
  auditLocation: { type: String, default: '' },
  auditReportUrl: { type: String },
  complianceNotes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Audit', auditSchema);
