const ChangeRequest = require('../models/ChangeRequest');
const Audit         = require('../models/Audit');
const Baseline      = require('../models/Baseline');
const ConfigurationItem = require('../models/ConfigurationItem');
const Project       = require('../models/Project');
const mongoose      = require('mongoose');

exports.generateReport = async (req, res) => {
  try {
    const { projectId, reportType, startDate, endDate } = req.query;

    let filter = {};
    if (projectId) filter.project = projectId;
    if (startDate && endDate) {
      filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
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
          { $match: projectId ? { project: new mongoose.Types.ObjectId(projectId) } : {} },
          { $group: { _id: "$riskScore", count: { $sum: 1 } } }
        ]);
        break;

      case 'compliance_status':
        reportData = await Audit.find(filter).sort({ auditDate: -1 });
        break;

      case 'approval_statistics':
        reportData = await ChangeRequest.aggregate([
          { $match: projectId ? { project: new mongoose.Types.ObjectId(projectId) } : {} },
          { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);
        break;

      default:
        return res.status(400).json({ error: 'Invalid report type specified' });
    }

    res.json({ reportType, generatedAt: new Date(), data: reportData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/reports/routine
 * Full routine report: CR status summary, transaction log, baselines, CI stats, audit log
 */
exports.getRoutineReport = async (req, res) => {
  try {
    const { projectId, startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const castedProjectId = projectId ? new mongoose.Types.ObjectId(projectId) : null;
    const crFilter = { ...(castedProjectId ? { project: castedProjectId } : {}), ...dateFilter };
    
    // For aggregations, we must use the casted ObjectId in $match
    const aggMatch = { ...crFilter };

    // ── Projects list ─────────────────────────────────────────────
    const projects = await Project.find({}).select('name createdAt').sort({ createdAt: -1 });

    // ── CR Status Summary ─────────────────────────────────────────
    const crSummaryAgg = await ChangeRequest.aggregate([
      { $match: aggMatch },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const crStatusSummary = crSummaryAgg.reduce((acc, { _id, count }) => {
      acc[_id] = count; return acc;
    }, {});

    // ── Risk breakdown ────────────────────────────────────────────
    const riskAgg = await ChangeRequest.aggregate([
      { $match: aggMatch },
      { $group: { _id: '$riskScore', count: { $sum: 1 } } }
    ]);
    const riskBreakdown = riskAgg.reduce((acc, { _id, count }) => {
      acc[_id || 'Unscored'] = count; return acc;
    }, {});

    // ── Change Type breakdown ─────────────────────────────────────
    const typeAgg = await ChangeRequest.aggregate([
      { $match: aggMatch },
      { $group: { _id: '$changeType', count: { $sum: 1 } } }
    ]);
    const changeTypeBreakdown = typeAgg.reduce((acc, { _id, count }) => {
      acc[_id || 'Unknown'] = count; return acc;
    }, {});

    // ── Transaction Log — full transition history ─────────────────
    const crsWithHistory = await ChangeRequest.find(crFilter)
      .populate('project', 'name')
      .populate('submittedBy', 'name email')
      .populate('transitionHistory.changedBy', 'name')
      .select('title status priorityLevel riskScore impactLevel aiRecommendation changeType submittedBy project transitionHistory createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .limit(200);

    // Flatten transition history into a single sorted log
    const transactionLog = [];
    crsWithHistory.forEach(cr => {
      (cr.transitionHistory || []).forEach(t => {
        transactionLog.push({
          crId:       cr._id,
          crTitle:    cr.title,
          project:    cr.project?.name || '—',
          fromStatus: t.fromStatus || '—',
          toStatus:   t.toStatus,
          changedBy:  t.changedBy?.name || 'System',
          comment:    t.comment || '',
          changedAt:  t.changedAt,
        });
      });
    });
    transactionLog.sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt));

    // ── Baseline report ───────────────────────────────────────────
    const baselines = await Baseline.find(crFilter)
      .populate('project', 'name')
      .populate('createdBy', 'name')
      .select('versionNumber description status project createdBy createdAt')
      .sort({ createdAt: -1 })
      .limit(50);

    // ── CI stats ──────────────────────────────────────────────────
    const ciStatusAgg = await ConfigurationItem.aggregate([
      ...(castedProjectId ? [{ $match: { project: castedProjectId } }] : []),
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const ciStatusSummary = ciStatusAgg.reduce((acc, { _id, count }) => {
      acc[_id] = count; return acc;
    }, {});

    const ciTypeAgg = await ConfigurationItem.aggregate([
      ...(castedProjectId ? [{ $match: { project: castedProjectId } }] : []),
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    const ciTypeBreakdown = ciTypeAgg.reduce((acc, { _id, count }) => {
      acc[_id] = count; return acc;
    }, {});

    // ── Audit log ─────────────────────────────────────────────────
    const audFilter = { ...(castedProjectId ? { project: castedProjectId } : {}), ...(startDate && endDate ? { auditDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } : {}) };
    const audits = await Audit.find(audFilter)
      .populate('project', 'name')
      .populate('auditor', 'name')
      .select('auditType auditDate auditLocation complianceNotes project auditor createdAt')
      .sort({ auditDate: -1 })
      .limit(50);

    // ── Totals ────────────────────────────────────────────────────
    const totalCRs    = Object.values(crStatusSummary).reduce((a, b) => a + b, 0);
    const approvedCRs = crStatusSummary['Approved'] || 0;
    const rejectedCRs = crStatusSummary['Rejected'] || 0;
    const totalCIs    = Object.values(ciStatusSummary).reduce((a, b) => a + b, 0);

    res.json({
      generatedAt: new Date(),
      projectId: projectId || null,
      dateRange: { startDate, endDate },
      summary: { totalCRs, approvedCRs, rejectedCRs, totalCIs, totalAudits: audits.length, totalBaselines: baselines.length },
      crStatusSummary,
      riskBreakdown,
      changeTypeBreakdown,
      transactionLog,
      crs: crsWithHistory,
      baselines,
      ciStatusSummary,
      ciTypeBreakdown,
      audits,
      projects,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

