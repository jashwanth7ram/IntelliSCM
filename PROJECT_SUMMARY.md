# IntelliSCM Project Summary

## Overview
IntelliSCM is an enterprise-oriented Software Configuration Management platform that digitizes and automates change governance. It combines role-based workflows, traceable configuration records, and AI-assisted risk insights to support controlled software delivery.

## Core Goals
- Manage change requests from submission to approval and implementation.
- Maintain an auditable record of configuration items, baselines, and transitions.
- Support governance roles (Developer, PM, CCB, Auditor, Admin) in one system.
- Reduce release risk using ML-backed change impact/risk indicators.

## Architecture
- Frontend: React + Vite single-page application.
- Backend: Node.js + Express REST API with JWT-based authentication.
- Database: MongoDB Atlas using Mongoose models.
- ML Service: FastAPI-based model service for defect/risk predictions.

## Major Functional Areas
- Authentication and RBAC for 5 roles.
- Change Request lifecycle management with status tracking.
- CCB review and decision flow (approve/reject/request modification).
- Configuration Item registry and version/state management.
- Baseline creation and audit reporting.
- Notification center (in-app + email events).
- Activity feed for traceability.
- Kanban board and CR detail collaboration (comments/labels).
- Routine reports for compliance and operational monitoring.
- ML insights for code-risk prediction.

## End-to-End Workflow
1. A Developer submits a Change Request with technical and optional ML metrics.
2. Project Managers and CCB members review CRs in dashboards/Kanban.
3. CCB records a decision and CR status is updated with transition history.
4. Related CIs and project records remain traceable through reports/activity logs.
5. Auditors and Admins generate routine compliance reports and review change trails.

## Recent Enhancements Added
- Change scheduling fields on CRs (`plannedStart`, `plannedEnd`, `environment`).
- Change calendar API to detect overlapping change windows.
- Conflict visibility surfaced in the Kanban view.
- Shared frontend API integration improvements for CR details, comments, and activity.
- Data consistency fix for PM backlog priority display.

## Key API Surface (High-Level)
- `/api/auth` for authentication and user profile.
- `/api/projects` for project management.
- `/api/crs` for change requests, comments, labels, status, and calendar.
- `/api/ccb` for decisioning workflows.
- `/api/cis`, `/api/baselines`, `/api/audits` for SCM control records.
- `/api/reports` and `/api/activity` for visibility and compliance.

## Runtime Requirements
- Backend API: `http://localhost:5001`
- Frontend App: `http://localhost:5173`
- MongoDB Atlas connection in `backend/.env` via `MONGODB_URI`
- Frontend API target in `frontend/.env` via `VITE_API_URL=http://localhost:5001/api`

## Current Operational Note
Application code builds correctly, but full runtime depends on a successful MongoDB Atlas connection (network access + valid URI/user credentials).

## Suggested Next Steps
- Finalize Atlas connectivity and verify backend startup without DB errors.
- Run a full role-based test pass (Developer -> CCB -> Auditor -> Admin).
- Add a dedicated Change Calendar page for PM/CCB scheduling governance.
- Rotate exposed secrets and keep `.env` values private.
