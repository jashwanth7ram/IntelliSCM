const mongoose = require('mongoose');

const approvalDecisionSchema = new mongoose.Schema({
  changeRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'ChangeRequest', required: true },
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  decisionType: { 
    type: String, 
    enum: ['Approve', 'Reject', 'Request Modification', 'Approved', 'Rejected'],
    required: true
  },
  comments: { type: String, default: '' },
  decidedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('ApprovalDecision', approvalDecisionSchema);
