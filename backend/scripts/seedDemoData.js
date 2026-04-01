/**
 * Seeds ONE showcase project with CRs and data that exercise major IntelliSCM features:
 * all CR statuses & change types, CIs, comments, ML metrics, git commits, pipelines,
 * releases, deployments, baselines, audits, CCB decisions, notifications.
 *
 * From backend/:  node scripts/seedDemoData.js
 * Replace demo:    SEED_FORCE=1 node scripts/seedDemoData.js
 *
 * Login:  password Demo123!  for any *@intelliscm.demo email printed at end.
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const User = require('../src/models/User');
const Project = require('../src/models/Project');
const ChangeRequest = require('../src/models/ChangeRequest');
const ConfigurationItem = require('../src/models/ConfigurationItem');
const Baseline = require('../src/models/Baseline');
const Audit = require('../src/models/Audit');
const PipelineDefinition = require('../src/models/PipelineDefinition');
const PipelineRun = require('../src/models/PipelineRun');
const Release = require('../src/models/Release');
const Deployment = require('../src/models/Deployment');
const Notification = require('../src/models/Notification');
const ApprovalDecision = require('../src/models/ApprovalDecision');

const DEMO_DOMAIN = 'intelliscm.demo';
const SHOWCASE_NAME = 'Fusion Commerce Platform';
const PASSWORD = 'Demo123!';

const demoEmails = () => ({
  dev: `alex.dev@${DEMO_DOMAIN}`,
  dev2: `sam.dev@${DEMO_DOMAIN}`,
  pm: `morgan.pm@${DEMO_DOMAIN}`,
  ccb: `casey.ccb@${DEMO_DOMAIN}`,
  auditor: `riley.audit@${DEMO_DOMAIN}`,
  admin: `admin.demo@${DEMO_DOMAIN}`,
});

async function clearDemoData() {
  const emails = Object.values(demoEmails());
  const users = await User.find({ email: { $in: emails } });
  const userIds = users.map((u) => u._id);
  const projects = await Project.find({
    $or: [{ manager: { $in: userIds } }, { name: SHOWCASE_NAME }],
  });
  const allProjectIds = projects.map((p) => p._id);

  await Deployment.deleteMany({ project: { $in: allProjectIds } });
  await ApprovalDecision.deleteMany({ reviewer: { $in: userIds } });
  await PipelineRun.deleteMany({ project: { $in: allProjectIds } });
  await Release.deleteMany({ project: { $in: allProjectIds } });
  await ChangeRequest.deleteMany({ project: { $in: allProjectIds } });
  await Baseline.deleteMany({ project: { $in: allProjectIds } });
  await Audit.deleteMany({ project: { $in: allProjectIds } });
  await ConfigurationItem.deleteMany({ project: { $in: allProjectIds } });
  await PipelineDefinition.deleteMany({ project: { $in: allProjectIds } });
  await Project.deleteMany({ _id: { $in: allProjectIds } });
  await Notification.deleteMany({ user: { $in: userIds } });
  await User.deleteMany({ _id: { $in: userIds } });
  console.log('Cleared previous demo data.');
}

async function seed() {
  if (!process.env.MONGODB_URI) {
    console.error('Missing MONGODB_URI in backend/.env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected');

  const emails = demoEmails();
  const force = process.env.SEED_FORCE === '1';

  if (force) {
    await clearDemoData();
  } else if (await User.findOne({ email: emails.pm })) {
    console.log('Demo data already exists. Use SEED_FORCE=1 to replace it.');
    await mongoose.disconnect();
    process.exit(0);
  }

  const users = {
    dev: await new User({
      name: 'Alex Chen',
      username: 'alex_dev',
      email: emails.dev,
      passwordHash: PASSWORD,
      role: 'Developer',
    }).save(),
    dev2: await new User({
      name: 'Sam Rivera',
      username: 'sam_dev',
      email: emails.dev2,
      passwordHash: PASSWORD,
      role: 'Developer',
    }).save(),
    pm: await new User({
      name: 'Morgan Blake',
      username: 'morgan_pm',
      email: emails.pm,
      passwordHash: PASSWORD,
      role: 'Project Manager',
    }).save(),
    ccb: await new User({
      name: 'Casey Okonkwo',
      username: 'casey_ccb',
      email: emails.ccb,
      passwordHash: PASSWORD,
      role: 'CCB Member',
    }).save(),
    auditor: await new User({
      name: 'Riley Patel',
      username: 'riley_audit',
      email: emails.auditor,
      passwordHash: PASSWORD,
      role: 'Auditor',
    }).save(),
    admin: await new User({
      name: 'Demo Admin',
      username: 'demo_admin',
      email: emails.admin,
      passwordHash: PASSWORD,
      role: 'Admin',
    }).save(),
  };

  const project = await new Project({
    name: SHOWCASE_NAME,
    description:
      'End-to-end demo: storefront API, payments, inventory, and ops dashboards. Use this project to explore CRs, CCB, CIs, baselines, audits, DevOps pipelines, and releases.',
    repositoryLink: 'https://github.com/demo-org/fusion-commerce-platform',
    version: '3.2.0',
    manager: users.pm._id,
    teamMembers: [users.dev._id, users.dev2._id, users.ccb._id],
  }).save();

  const yaml = `stages:
  - build
  - test
  - security_scan
  - deploy_staging
`;

  const pipeDef = await new PipelineDefinition({
    project: project._id,
    name: 'default',
    yamlSource: yaml,
    isDefault: true,
    createdBy: users.pm._id,
  }).save();

  const now = new Date();
  const daysAgo = (d) => new Date(now.getTime() - d * 86400000);

  const mkT = (from, to, uid, comment, at) => ({
    fromStatus: from,
    toStatus: to,
    changedBy: uid,
    comment: comment || '',
    changedAt: at,
  });

  // ── Configuration Items (same project, mixed types) ───────────────────
  const ciSpecs = [
    { ciId: 'FCP-CI-001', name: 'checkout-api', type: 'Source Code', owner: users.dev._id, status: 'Active', compliance: 'Compliant', ver: '3.2.0', desc: 'REST checkout and cart merge', path: '/services/checkout' },
    { ciId: 'FCP-CI-002', name: 'payment-webhook', type: 'Source Code', owner: users.dev2._id, status: 'Under Change', compliance: 'Pending Audit', ver: '2.1.4', desc: 'Stripe webhook handler', path: '/workers/payment' },
    { ciId: 'FCP-CI-003', name: 'orders-schema', type: 'Database Schema', owner: users.dev._id, status: 'Active', compliance: 'Compliant', ver: '1.0', desc: 'PostgreSQL orders + line items', path: '/db/migrations' },
    { ciId: 'FCP-CI-004', name: 'ops-dashboard', type: 'Binary', owner: users.pm._id, status: 'Active', compliance: 'Compliant', ver: '1.5.2', desc: 'Packaged admin UI bundle', path: '/apps/admin' },
    { ciId: 'FCP-CI-005', name: 'PCI-DSS control matrix', type: 'Document', owner: users.auditor._id, status: 'Active', compliance: 'Compliant', ver: '2026.1', desc: 'Compliance mapping doc', path: '/docs/compliance' },
    { ciId: 'FCP-CI-006', name: 'e2e-checkout', type: 'Test Suite', owner: users.dev2._id, status: 'Active', compliance: 'Pending Audit', ver: '1.0', desc: 'Playwright E2E for checkout', path: '/tests/e2e' },
    { ciId: 'FCP-CI-007', name: 'cdn-config', type: 'Config File', owner: users.dev._id, status: 'Deprecated', compliance: 'Non-Compliant', ver: '0.9', desc: 'Legacy CDN rules (being replaced)', path: '/infra/cdn' },
    { ciId: 'FCP-CI-008', name: 'k8s-prod-cluster', type: 'Infrastructure', owner: users.pm._id, status: 'Active', compliance: 'Compliant', ver: 'n/a', desc: 'Production Kubernetes context', path: '/infra/k8s' },
  ];

  const cis = [];
  for (const c of ciSpecs) {
    cis.push(
      await new ConfigurationItem({
        ciId: c.ciId,
        name: c.name,
        type: c.type,
        project: project._id,
        owner: c.owner,
        currentVersion: c.ver,
        status: c.status,
        complianceStatus: c.compliance,
        description: c.desc,
        filePath: c.path,
        versionHistory: [
          {
            version: c.ver,
            changedBy: users.pm._id,
            changeDescription: 'Initial demo seed baseline',
            changedAt: daysAgo(60),
          },
        ],
      }).save()
    );
  }

  const [ciCheckout, ciPay, ciOrders] = cis;

  const treeJson = JSON.stringify({
    services: ['checkout-api', 'payment-webhook', 'inventory-svc'],
    workers: ['payment', 'email'],
    apps: ['storefront', 'admin'],
  });

  /**
   * CRs: cover every status, every changeType, varied labels, priorities.
   */
  const crBuild = [];

  // 1 Approved — Feature + Security, pipeline OK, release, comments, commits
  crBuild.push({
    title: '[FCP] WebAuthn passkeys for returning customers',
    description: 'FIDO2 passkeys + fallback to TOTP. RP ID and origins aligned with production domains.',
    submittedBy: users.dev._id,
    assignee: users.dev2._id,
    status: 'Approved',
    priorityLevel: 'High',
    changeType: 'Feature',
    riskScore: 'Medium',
    impactLevel: 'Moderate',
    aiRecommendation: 'Review Carefully',
    linesOfCodeModified: 420,
    branchName: 'feature/webauthn-fcp',
    repositoryUrl: 'https://github.com/demo-org/fusion-commerce-platform',
    labels: ['Feature', 'Security'],
    affectedCIs: [ciCheckout._id, ciOrders._id],
    filesAffected: ['services/checkout/auth.ts', 'services/checkout/webauthn.ts'],
    targetDeployEnv: 'Staging',
    environment: 'Staging',
    plannedStart: daysAgo(18),
    plannedEnd: daysAgo(17),
    mlMetrics: { v_g: 14, branchCount: 22, rfc: 28 },
    transitionHistory: [
      mkT(null, 'Submitted', users.dev._id, 'Opened', daysAgo(21)),
      mkT('Submitted', 'Under Review', users.pm._id, 'Triage', daysAgo(20)),
      mkT('Under Review', 'Approved', users.ccb._id, 'Approved — security review complete', daysAgo(16)),
    ],
    commits: [
      { sha: 'f1a2b3c4d5e6f7a8b9c0d1e2', message: 'feat(checkout): WebAuthn registration + login', author: 'Alex Chen', date: daysAgo(19), branch: 'feature/webauthn-fcp' },
      { sha: 'a9b8c7d6e5f4a3b2c1d0e9f8', message: 'test(e2e): passkey happy path', author: 'Sam Rivera', date: daysAgo(18), branch: 'feature/webauthn-fcp' },
    ],
    comments: [
      { user: users.pm._id, text: 'Please attach threat model link before final approval.', createdAt: daysAgo(19) },
      { user: users.dev._id, text: 'Added STRIDE summary in /docs/security/webauthn.md', createdAt: daysAgo(18) },
    ],
    repoTreeSnapshot: treeJson,
    activityLog: [
      { action: 'CR created (demo seed)', performedBy: users.dev._id, timestamp: daysAgo(21) },
      { action: 'Comment thread started', performedBy: users.pm._id, timestamp: daysAgo(19) },
    ],
  });

  // 2 Under Review — Bug Fix, Critical, extra approval
  crBuild.push({
    title: '[FCP] Payment webhook duplicate events under retry storms',
    description: 'Idempotency key collision when Stripe retries overlap; need distributed lock.',
    submittedBy: users.dev2._id,
    assignee: users.dev._id,
    status: 'Under Review',
    priorityLevel: 'Critical',
    changeType: 'Bug Fix',
    riskScore: 'High',
    impactLevel: 'Critical',
    aiRecommendation: 'High Risk',
    requiresExtraApproval: true,
    linesOfCodeModified: 240,
    branchName: 'fix/webhook-idempotency',
    labels: ['Bug', 'Critical'],
    affectedCIs: [ciPay._id],
    filesAffected: ['workers/payment/handler.go'],
    targetDeployEnv: 'Production',
    environment: 'Production',
    plannedStart: daysAgo(4),
    plannedEnd: daysAgo(3),
    transitionHistory: [
      mkT(null, 'Submitted', users.dev2._id, '', daysAgo(5)),
      mkT('Submitted', 'Under Review', users.pm._id, 'Eng + finance looped in', daysAgo(4)),
    ],
    comments: [{ user: users.ccb._id, text: 'Need replay test evidence from staging.', createdAt: daysAgo(4) }],
  });

  // 3 Submitted — Infrastructure
  crBuild.push({
    title: '[FCP] Blue/green cutover for checkout deployment',
    description: 'Introduce second Deployment + weighted traffic shift in load balancer.',
    submittedBy: users.dev._id,
    status: 'Submitted',
    priorityLevel: 'Medium',
    changeType: 'Infrastructure',
    riskScore: 'Low',
    impactLevel: 'Minor',
    aiRecommendation: 'Approve',
    linesOfCodeModified: 120,
    labels: ['Infrastructure'],
    affectedCIs: [cis[7]._id],
    transitionHistory: [mkT(null, 'Submitted', users.dev._id, 'Draft for infra review', daysAgo(2))],
  });

  // 4 Needs Modification — Performance
  crBuild.push({
    title: '[FCP] P95 checkout latency on flash sales',
    description: 'Add read-through cache for catalog fragments; invalidation strategy TBD.',
    submittedBy: users.dev2._id,
    status: 'Needs Modification',
    priorityLevel: 'High',
    changeType: 'Performance',
    riskScore: 'Medium',
    impactLevel: 'Moderate',
    aiRecommendation: 'Review Carefully',
    linesOfCodeModified: 310,
    labels: ['Performance', 'Refactor'],
    affectedCIs: [ciCheckout._id],
    transitionHistory: [
      mkT(null, 'Submitted', users.dev2._id, '', daysAgo(10)),
      mkT('Submitted', 'Under Review', users.pm._id, '', daysAgo(9)),
      mkT('Under Review', 'Needs Modification', users.ccb._id, 'Add cache invalidation diagram and rollback plan.', daysAgo(7)),
    ],
  });

  // 5 Rejected — Refactor
  crBuild.push({
    title: '[FCP] Rewrite checkout pricing module to new DSL',
    description: 'Long-term refactor; CCB wants phased plan and cost estimate first.',
    submittedBy: users.dev._id,
    status: 'Rejected',
    priorityLevel: 'Low',
    changeType: 'Refactor',
    riskScore: 'Medium',
    impactLevel: 'Moderate',
    aiRecommendation: 'Review Carefully',
    linesOfCodeModified: 4000,
    labels: ['Refactor'],
    affectedCIs: [ciCheckout._id],
    transitionHistory: [
      mkT(null, 'Submitted', users.dev._id, '', daysAgo(25)),
      mkT('Submitted', 'Under Review', users.pm._id, '', daysAgo(24)),
      mkT('Under Review', 'Rejected', users.ccb._id, 'Scope too large for Q2 — submit phased RFC first.', daysAgo(22)),
    ],
  });

  // 6 Emergency Fix
  crBuild.push({
    title: '[FCP][P1] Null deref in payment webhook on missing metadata',
    description: 'Production incident INC-9081 — guard clause + alert on malformed payload.',
    submittedBy: users.dev2._id,
    status: 'Emergency Fix',
    priorityLevel: 'Critical',
    changeType: 'Bug Fix',
    riskScore: 'High',
    impactLevel: 'Critical',
    aiRecommendation: 'High Risk',
    linesOfCodeModified: 15,
    labels: ['Bug', 'Critical'],
    affectedCIs: [ciPay._id],
    transitionHistory: [mkT(null, 'Emergency Fix', users.dev2._id, 'INC-9081 — CFO notified', daysAgo(1))],
  });

  // 7 Approved — Security (separate from WebAuthn)
  crBuild.push({
    title: '[FCP] Rotate API signing keys + HSM-backed secondary',
    description: 'Quarterly key rotation; dual-sign period 72h.',
    submittedBy: users.pm._id,
    status: 'Approved',
    priorityLevel: 'Critical',
    changeType: 'Security',
    riskScore: 'High',
    impactLevel: 'Critical',
    aiRecommendation: 'High Risk',
    linesOfCodeModified: 95,
    labels: ['Security'],
    affectedCIs: [cis[4]._id, ciCheckout._id],
    requiresExtraApproval: true,
    transitionHistory: [
      mkT(null, 'Submitted', users.pm._id, '', daysAgo(12)),
      mkT('Submitted', 'Under Review', users.ccb._id, '', daysAgo(11)),
      mkT('Under Review', 'Approved', users.ccb._id, 'Dual-sign window approved', daysAgo(10)),
    ],
  });

  // 8 Submitted — scheduled maintenance window (future dates for calendar UI)
  const maintenanceStart = new Date(now.getTime() + 2 * 86400000);
  const maintenanceEnd = new Date(now.getTime() + 2 * 86400000 + 2 * 3600000);
  crBuild.push({
    title: '[FCP] Extend database maintenance window Sunday',
    description: 'Move maintenance 02:00–04:00 UTC to avoid conflict with marketing push.',
    submittedBy: users.dev._id,
    status: 'Submitted',
    priorityLevel: 'Low',
    changeType: 'Infrastructure',
    riskScore: 'Low',
    impactLevel: 'Minor',
    aiRecommendation: 'Approve',
    labels: ['Infrastructure'],
    environment: 'Production',
    plannedStart: maintenanceStart,
    plannedEnd: maintenanceEnd,
    transitionHistory: [mkT(null, 'Submitted', users.dev._id, '', daysAgo(0))],
  });

  // 9 Under Review — Feature (Kanban column)
  crBuild.push({
    title: '[FCP] Gift cards + partial redemption',
    description: 'New product line; integrate with ledger service.',
    submittedBy: users.dev._id,
    status: 'Under Review',
    priorityLevel: 'Medium',
    changeType: 'Feature',
    riskScore: 'Medium',
    impactLevel: 'Moderate',
    aiRecommendation: 'Review Carefully',
    linesOfCodeModified: 890,
    labels: ['Feature'],
    affectedCIs: [ciCheckout._id, ciOrders._id],
    transitionHistory: [
      mkT(null, 'Submitted', users.dev._id, '', daysAgo(6)),
      mkT('Submitted', 'Under Review', users.pm._id, 'Product sign-off pending', daysAgo(5)),
    ],
  });

  // 10 Approved — Documentation + low LOC
  crBuild.push({
    title: '[FCP] Runbook: incident response for payment failures',
    description: 'Update on-call steps and escalation matrix.',
    submittedBy: users.auditor._id,
    status: 'Approved',
    priorityLevel: 'Low',
    changeType: 'Feature',
    riskScore: 'Low',
    impactLevel: 'Minor',
    aiRecommendation: 'Approve',
    linesOfCodeModified: 0,
    labels: ['Documentation'],
    affectedCIs: [cis[4]._id],
    transitionHistory: [
      mkT(null, 'Submitted', users.auditor._id, '', daysAgo(14)),
      mkT('Submitted', 'Under Review', users.pm._id, '', daysAgo(13)),
      mkT('Under Review', 'Approved', users.ccb._id, 'Docs-only — approved', daysAgo(12)),
    ],
  });

  const savedCRs = [];
  for (const spec of crBuild) {
    const { transitionHistory, commits, comments, activityLog, ...rest } = spec;
    const cr = new ChangeRequest({
      ...rest,
      project: project._id,
      transitionHistory,
      commits: commits || [],
      comments: comments || [],
      activityLog: activityLog || [
        { action: 'Seeded CR for Fusion Commerce Platform', performedBy: spec.submittedBy, timestamp: daysAgo(30) },
      ],
    });
    await cr.save();
    savedCRs.push(cr);
  }

  // Pipeline runs: success, failed, running — all same project
  const runOk = await new PipelineRun({
    changeRequest: savedCRs[0]._id,
    project: project._id,
    definition: pipeDef._id,
    overallStatus: 'success',
    stages: [
      { name: 'build', status: 'success', startedAt: daysAgo(17), finishedAt: daysAgo(17), logSnippet: 'pnpm build OK' },
      { name: 'test', status: 'success', startedAt: daysAgo(17), finishedAt: daysAgo(17), logSnippet: '3422 tests passed' },
      { name: 'security_scan', status: 'success', startedAt: daysAgo(16), finishedAt: daysAgo(16), logSnippet: '0 critical' },
      { name: 'deploy_staging', status: 'success', startedAt: daysAgo(16), finishedAt: daysAgo(16), logSnippet: 'deployed to stg' },
    ],
    startedAt: daysAgo(17),
    finishedAt: daysAgo(16),
    triggeredBy: users.pm._id,
  }).save();

  const runFail = await new PipelineRun({
    changeRequest: savedCRs[3]._id,
    project: project._id,
    definition: pipeDef._id,
    overallStatus: 'failed',
    stages: [
      { name: 'build', status: 'success', startedAt: daysAgo(8), finishedAt: daysAgo(8), logSnippet: 'OK' },
      { name: 'test', status: 'failed', startedAt: daysAgo(8), finishedAt: daysAgo(8), logSnippet: 'perf budget exceeded' },
      { name: 'security_scan', status: 'skipped' },
      { name: 'deploy_staging', status: 'skipped' },
    ],
    startedAt: daysAgo(8),
    finishedAt: daysAgo(8),
    triggeredBy: users.dev2._id,
  }).save();

  const runRunning = await new PipelineRun({
    changeRequest: savedCRs[8]._id,
    project: project._id,
    definition: pipeDef._id,
    overallStatus: 'running',
    stages: [
      { name: 'build', status: 'success', startedAt: daysAgo(4), finishedAt: daysAgo(4), logSnippet: 'OK' },
      { name: 'test', status: 'running', startedAt: daysAgo(4), logSnippet: 'running e2e…' },
      { name: 'security_scan', status: 'pending' },
      { name: 'deploy_staging', status: 'pending' },
    ],
    startedAt: daysAgo(4),
    triggeredBy: users.dev._id,
  }).save();

  savedCRs[0].activePipelineRun = runOk._id;
  await savedCRs[0].save();
  savedCRs[8].activePipelineRun = runRunning._id;
  await savedCRs[8].save();

  // Releases: approved + linked CRs; second in Draft for “release workflow” demo
  const relMain = await new Release({
    project: project._id,
    version: 'v3.2.0',
    title: `${SHOWCASE_NAME} — Spring GA`,
    changeRequests: [savedCRs[0]._id, savedCRs[6]._id, savedCRs[9]._id],
    status: 'Released',
    releaseNotes: '## v3.2.0 GA\n- WebAuthn\n- Key rotation\n- Runbook updates',
    notesAutoGenerated: false,
    approvedBy: users.ccb._id,
    approvedAt: daysAgo(15),
    releasedAt: daysAgo(14),
    createdBy: users.pm._id,
  }).save();

  await new Release({
    project: project._id,
    version: 'v3.3.0-rc1',
    title: 'Gift cards & cache perf (candidate)',
    changeRequests: [savedCRs[8]._id, savedCRs[3]._id],
    status: 'Pending Approval',
    releaseNotes: '',
    notesAutoGenerated: false,
    createdBy: users.pm._id,
  }).save();

  savedCRs[0].linkedRelease = relMain._id;
  await savedCRs[0].save();

  // CCB approval decisions (mirrors board decisions)
  await ApprovalDecision.insertMany([
    { changeRequest: savedCRs[0]._id, reviewer: users.ccb._id, decisionType: 'Approved', comments: 'Security sign-off complete', decidedAt: daysAgo(16) },
    { changeRequest: savedCRs[4]._id, reviewer: users.ccb._id, decisionType: 'Rejected', comments: 'Phased RFC required', decidedAt: daysAgo(22) },
    { changeRequest: savedCRs[3]._id, reviewer: users.ccb._id, decisionType: 'Request Modification', comments: 'Need invalidation diagram', decidedAt: daysAgo(7) },
    { changeRequest: savedCRs[6]._id, reviewer: users.ccb._id, decisionType: 'Approved', comments: 'Dual-sign approved', decidedAt: daysAgo(10) },
  ]);

  // Baselines + audits
  await new Baseline({
    project: project._id,
    createdBy: users.pm._id,
    versionNumber: 'FCP-BL-2026.03.01',
    description: 'Post WebAuthn GA baseline',
    releaseTag: { branchName: 'release/3.2.0', gitReference: 'f1a2b3c4' },
    releaseNotes: ['WebAuthn', 'Key rotation docs'],
  }).save();

  await new Audit({
    project: project._id,
    auditor: users.auditor._id,
    auditType: 'FCA',
    auditDate: daysAgo(40),
    auditLocation: 'Remote',
    complianceNotes: 'FCA: CI registry and CR traceability verified on sample of 12 CRs.',
  }).save();

  await new Audit({
    project: project._id,
    auditor: users.auditor._id,
    auditType: 'PCA',
    auditDate: daysAgo(55),
    auditLocation: 'Data center audit room',
    complianceNotes: 'PCA: access controls and change windows reviewed.',
  }).save();

  // Deployments — all envs + one failed for dashboards
  const envOrder = ['Development', 'QA', 'Staging', 'Production'];
  for (let i = 0; i < envOrder.length; i += 1) {
    const env = envOrder[i];
    await new Deployment({
      project: project._id,
      environment: env,
      versionLabel: env === 'Production' ? 'v3.2.0' : 'v3.2.0-rc',
      changeRequest: savedCRs[0]._id,
      release: relMain._id,
      pipelineRun: runOk._id,
      status: env === 'QA' ? 'failed' : 'success',
      deployedAt: daysAgo(20 - i),
      deployedBy: users.pm._id,
      notes: env === 'QA' ? 'Demo: failed smoke in QA (rolled forward in seed narrative)' : `Deployed to ${env}`,
    }).save();
  }

  await Notification.insertMany([
    { user: users.dev._id, message: `CR approved: ${savedCRs[0].title}`, type: 'CR_APPROVED', relatedEntityId: savedCRs[0]._id },
    { user: users.pm._id, message: 'Pipeline succeeded for WebAuthn CR', type: 'PIPELINE_SUCCEEDED', relatedEntityId: savedCRs[0]._id },
    { user: users.ccb._id, message: 'Release v3.3.0-rc1 pending approval', type: 'RELEASE_PENDING_APPROVAL', relatedEntityId: project._id },
    { user: users.dev2._id, message: 'High-risk CR flagged for review: payment webhook', type: 'HIGH_RISK_CR_FLAGGED', relatedEntityId: savedCRs[1]._id },
    { user: users.pm._id, message: 'Deployment failed in QA environment', type: 'DEPLOY_FAILED', relatedEntityId: savedCRs[0]._id },
  ]);

  console.log('\n✅ Showcase project seeded: "' + SHOWCASE_NAME + '"\n');
  console.log('Includes: all CR statuses & change types, CIs, comments, pipelines (ok/fail/running),');
  console.log('releases, deployments, baselines, audits, CCB decisions, notifications.\n');
  console.log('Password for all demo users: Demo123!');
  console.log(`  PM login:   ${emails.pm}`);
  console.log(`  Dev login:  ${emails.dev}`);
  console.log(`  CCB login:  ${emails.ccb}\n`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
