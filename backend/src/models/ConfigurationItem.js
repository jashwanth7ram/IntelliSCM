const mongoose = require('mongoose');

/**
 * Configuration Item (CI) — IEEE 828 §5.2 Configuration Identification
 * Every software artifact (source file, document, binary, config) is a CI.
 */
const configurationItemSchema = new mongoose.Schema({
  ciId: { type: String, required: true, unique: true }, // e.g. CI-001
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['Source Code', 'Document', 'Binary', 'Config File', 'Test Suite', 'Database Schema', 'Infrastructure'],
    required: true
  },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  currentVersion: { type: String, default: '1.0.0' },
  status: {
    type: String,
    enum: ['Active', 'Deprecated', 'Archived', 'Under Change'],
    default: 'Active'
  },
  description: { type: String },
  filePath: { type: String }, // relative path in repository
  parentCI: { type: mongoose.Schema.Types.ObjectId, ref: 'ConfigurationItem' }, // for nested CIs

  // Version history — every approved CR bumps the version
  versionHistory: [{
    version: String,
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changeRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'ChangeRequest' },
    changeDescription: String,
    changedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Auto-generate ciId before saving if not set (Mongoose 9: async hooks resolve via Promise, no next())
configurationItemSchema.pre('validate', async function () {
  if (!this.ciId) {
    const count = await mongoose.model('ConfigurationItem').countDocuments({ project: this.project });
    this.ciId = `CI-${String(count + 1).padStart(3, '0')}`;
  }
});

module.exports = mongoose.model('ConfigurationItem', configurationItemSchema);
