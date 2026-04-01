# IntelliSCM DevOps Extension

This document describes the **incremental DevOps/SCM extension** aligned with patterns from GitHub Actions, GitLab CI, and Azure DevOps—implemented **without** replacing the existing IEEE-828-style SCM core.

## 1. Updated Architecture (Logical)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           IntelliSCM (existing)                          │
│  Auth · Projects · CRs · CCB · CIs · Baselines · Audits · Reports · ML   │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
    ┌───────────────────────────────┼───────────────────────────────┐
    │                               │                               │
    ▼                               ▼                               ▼
┌─────────────┐             ┌───────────────┐              ┌─────────────────┐
│ Git (sim.)  │             │ CI/CD (sim.)  │              │ Environments    │
│ CR.commits  │────────────▶│ PipelineRun   │────────────▶│ Deployment      │
│ repo tree   │             │ stages YAML   │              │ per env status  │
└─────────────┘             └───────┬───────┘              └────────┬────────┘
                                  │                                │
                                  ▼                                ▼
                          ┌───────────────┐              ┌─────────────────┐
                          │ Release       │◀─────────────│ Release notes   │
                          │ version + CRs │              │ + approval      │
                          └───────────────┘              └─────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ Trace API: GET /api/devops/trace/:crId  →  CR → commits → pipeline →     │
│            deployments → release (ordered timeline)                      │
└─────────────────────────────────────────────────────────────────────────┘
```

## 2. New Database Collections (Mongoose Models)

| Model | Purpose |
|--------|---------|
| `PipelineDefinition` | Project-scoped YAML-like pipeline text; default stages parsed server-side |
| `PipelineRun` | One run per CR (or history); stages: pending → running → success/failed |
| `Release` | Semantic version, linked CRs, status, auto/manual release notes |
| `Deployment` | Record per environment (Dev/QA/Staging/Prod); ties to CR and/or Release |

**`ChangeRequest` extensions**

- `linkedRelease`, `activePipelineRun`
- `commits[]` (simulated git)
- `repoTreeSnapshot` (optional JSON string)
- `requiresExtraApproval` (ML/policy flag)
- `targetDeployEnv` (Staging/QA/…)

## 3. New API Surface

| Area | Routes |
|------|--------|
| Pipelines | `GET/POST /api/pipelines/definitions`, `GET /api/pipelines/runs`, `POST /api/pipelines/runs/start`, `POST /api/pipelines/runs/:id/advance`, `POST /api/pipelines/runs/:id/simulate-success` |
| Releases | `GET/POST /api/releases`, `PATCH /api/releases/:id/crs`, `POST /api/releases/:id/release-notes`, `POST .../submit-approval`, `.../approve`, `.../mark-released` |
| Deployments | `GET /api/deployments`, `POST /api/deployments`, `PATCH /api/deployments/:id/status`, `GET /api/deployments/summary/env` |
| DevOps | `GET /api/devops/metrics`, `GET /api/devops/trace/:crId` |
| CR (extended) | `POST /api/crs/:id/commits`, `PATCH /api/crs/:id/repo-tree` |

## 4. Example Data Flow: CR → Pipeline → Release → Deploy

1. Developer submits CR → ML sets `riskScore` / `requiresExtraApproval` if high risk → notifications (`HIGH_RISK_CR_FLAGGED` to extended stakeholders).
2. PM creates **PipelineDefinition** (YAML) for the project.
3. Developer or PM starts **PipelineRun** for that CR → stages advance (simulated) → `PIPELINE_*` notifications.
4. PM creates **Release** (e.g. `v1.2.0`), attaches CRs, generates release notes → submits for approval → CCB **approves** → optional **mark released**.
5. **Deployment** records promote build to Staging/Production; status updates fire `DEPLOY_*` notifications.
6. **Trace** endpoint merges CR, commits, runs, deployments, and release into one timeline for audits.

## 5. Sample Pipeline YAML (YAML-like, stored in `PipelineDefinition.yamlSource`)

```yaml
# .intelliscm-pipeline.yml (conceptual)
stages:
  - build
  - test
  - security_scan
  - deploy_staging
```

The backend parser (`parsePipelineYaml.js`) extracts ordered stage names. If none are found, it defaults to `build`, `test`, `deploy`.

## 6. DORA-Style Metrics (`GET /api/devops/metrics`)

Approximations from stored data (no external APM):

- **Deployment frequency** — successful deployments per week in window
- **Change failure rate** — failed / total finished deployments
- **Lead time for changes** — mean time from CR `createdAt` to first `Approved` transition in history
- **Pipeline success rate** — successful runs / total runs
- **Open high-risk CRs** — count with `riskScore: High` and open statuses

## 7. Notifications Upgrade

New `Notification.type` values:

`PIPELINE_STARTED`, `PIPELINE_FAILED`, `PIPELINE_SUCCEEDED`, `DEPLOY_STARTED`, `DEPLOY_SUCCEEDED`, `DEPLOY_FAILED`, `RELEASE_PENDING_APPROVAL`, `RELEASE_APPROVED`, `HIGH_RISK_CR_FLAGGED`

Existing email path (Nodemailer) remains unchanged; in-app notifications are the primary delivery.

## 8. Frontend

- **Route group** `/devops` with tabs: Metrics, Pipelines, Releases, Environments
- **CR detail** page: linked commits, pipeline/release badges, trace timeline, extra-approval banner

## 9. Integration Strategy (Non-Breaking)

- All new routes are **additive**; existing `/api/crs`, `/api/ccb`, etc. behave as before.
- Optional fields on CR default safely for old documents.
- GitHub/GitLab API can be added later behind a **feature flag** by syncing commits into `cr.commits` via a small integration service.

## 10. Optional Next Steps

- Webhook receiver for real Git push events
- OAuth app for GitHub/GitLab to list branches/commits
- Artifact storage references on `PipelineRun` stages
- Second approver workflow when `requiresExtraApproval === true`
