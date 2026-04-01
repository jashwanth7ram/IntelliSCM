const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: [
      'CR_SUBMITTED', 
      'CR_APPROVED', 
      'CR_REJECTED',
      'CR_STATUS_CHANGED',
      'CR_NEEDS_MODIFICATION',
      'BASELINE_CREATED', 
      'AUDIT_SCHEDULED',
      'PIPELINE_STARTED',
      'PIPELINE_FAILED',
      'PIPELINE_SUCCEEDED',
      'DEPLOY_STARTED',
      'DEPLOY_SUCCEEDED',
      'DEPLOY_FAILED',
      'RELEASE_PENDING_APPROVAL',
      'RELEASE_APPROVED',
      'HIGH_RISK_CR_FLAGGED',
    ],
    required: true
  },
  relatedEntityId: { type: mongoose.Schema.Types.ObjectId }, // Can be CR ID, Baseline ID, etc.
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
