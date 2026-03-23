const ChangeRequest = require('../models/ChangeRequest');
const Audit = require('../models/Audit');
const ApprovalDecision = require('../models/ApprovalDecision');

exports.generateReport = async (req, res) => {
  try {
    const { projectId, reportType, startDate, endDate } = req.query;
    
    // Basic filter logic
    let filter = {};
    if (projectId) filter.project = projectId;
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    let reportData = {};

    switch(reportType) {
      case 'change_activity':
        reportData = await ChangeRequest.find(filter)
          .select('title status priorityLevel createdAt')
          .sort({ createdAt: -1 });
        break;

      case 'risk_analysis':
        reportData = await ChangeRequest.aggregate([
          { $match: { 
             ...(projectId ? { project: new require('mongoose').Types.ObjectId(projectId) } : {}) 
            } 
          },
          { $group: { _id: "$riskScore", count: { $sum: 1 } } }
        ]);
        break;

      case 'compliance_status':
        reportData = await Audit.find(filter).sort({ auditDate: -1 });
        break;

      case 'approval_statistics':
        reportData = await ApprovalDecision.aggregate([
          { $match: filter },
          { $group: { _id: "$decisionType", count: { $sum: 1 } } }
        ]);
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid report type specified' });
    }

    res.json({
      reportType,
      generatedAt: new Date(),
      data: reportData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
