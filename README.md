# 🚀 IntelliSCM — Intelligent Software Configuration Management System

> A full-stack, AI-powered Software Configuration Management (SCM) platform designed for enterprise-grade software teams. IntelliSCM streamlines change requests, configuration item tracking, baseline management, audit scheduling, and CCB (Change Control Board) workflows — all enhanced with a Machine Learning defect prediction engine.

[![GitHub Repo](https://img.shields.io/badge/GitHub-IntelliSCM-blue?logo=github)](https://github.com/jashwanth7ram/IntelliSCM)
![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-green)
![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?logo=react)
![Python](https://img.shields.io/badge/ML-FastAPI%20%2B%20scikit--learn-orange?logo=python)
![MongoDB](https://img.shields.io/badge/Database-MongoDB%20Atlas-47A248?logo=mongodb)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [User Roles](#-user-roles)
- [Features](#-features)
- [API Endpoints](#-api-endpoints)
- [ML Service](#-ml-service)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
- [Environment Variables](#-environment-variables)
- [Running the Application](#-running-the-application)
- [Database Schema](#-database-schema)

---

## 🌐 Overview

**IntelliSCM** is a comprehensive SCM platform that replaces manual configuration management processes with an automated, role-based workflow system. Built on a **three-tier microservices architecture**, it supports:

- **Change Request (CR)** lifecycle management (submission → CCB review → approval/rejection)
- **Configuration Item (CI)** tracking and auditing
- **Baseline** creation, locking, and history management
- **Audit scheduling** with location-awareness and automated email notifications
- **ML-powered defect prediction** using NASA's JM1 dataset with a trained Random Forest model
- **Role-based access control (RBAC)** across 5 user roles

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        IntelliSCM                               │
│                                                                 │
│  ┌──────────────┐    ┌──────────────────┐    ┌──────────────┐  │
│  │   Frontend   │    │     Backend      │    │  ML Service  │  │
│  │  React + Vite│◄──►│  Node.js/Express │    │  FastAPI /   │  │
│  │  TailwindCSS │    │  REST API        │◄──►│  scikit-learn│  │
│  │  Port: 5173  │    │  Port: 5001      │    │  Port: 8000  │  │
│  └──────────────┘    └────────┬─────────┘    └──────────────┘  │
│                               │                                 │
│                       ┌───────▼────────┐                       │
│                       │  MongoDB Atlas │                        │
│                       │  (Cloud DB)    │                        │
│                       └────────────────┘                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | ^19.2.4 | UI framework |
| Vite | ^8.0.1 | Build tool & dev server |
| TailwindCSS | ^3.4.19 | Utility-first styling |
| DaisyUI | ^5.5.19 | UI component library |
| React Router DOM | ^7.13.1 | Client-side routing |
| Axios | ^1.13.6 | HTTP client |
| Recharts | ^3.8.0 | Data visualization / charts |
| Lucide React | ^1.0.0 | Icon library |
| React Icons | ^5.6.0 | Extended icon set |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | LTS | Runtime environment |
| Express | ^5.2.1 | Web framework |
| Mongoose | ^9.2.4 | MongoDB ODM |
| JWT (jsonwebtoken) | ^9.0.3 | Authentication tokens |
| bcrypt | ^6.0.0 | Password hashing |
| Nodemailer | ^8.0.3 | Email notifications (Gmail SMTP) |
| Multer | ^2.1.1 | File upload handling |
| Swagger UI Express | ^5.0.1 | API documentation |
| Nodemon | ^3.1.14 | Dev hot-reload |
| dotenv | ^17.3.1 | Environment configuration |

### ML Service
| Technology | Purpose |
|---|---|
| FastAPI | REST API framework (Python) |
| scikit-learn | Random Forest classifier |
| pandas / numpy | Data processing |
| joblib | Model serialization |
| XGBoost | Gradient boosting (extended support) |
| imbalanced-learn | Class imbalance handling (SMOTE) |
| Pydantic | Request/response schema validation |
| Uvicorn | ASGI web server |

### Database
| Technology | Details |
|---|---|
| MongoDB Atlas | Cloud-hosted NoSQL database |
| Database Name | `intelliscm` |

---

## 📁 Project Structure

```
SCM_Model/
├── README.md
├── .gitignore
├── test_scm.sh                  # Integration test script
├── jm1.csv                      # NASA JM1 defect dataset (ML training)
├── ghpr.csv                     # GitHub PR dataset (reference)
│
├── backend/                     # Node.js REST API
│   ├── package.json
│   ├── .env                     # Environment variables (not committed)
│   └── src/
│       ├── server.js            # Entry point
│       ├── app.js               # Express app + route mounting
│       ├── config/
│       │   └── swagger.js       # Swagger/OpenAPI config
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── projectController.js
│       │   ├── crController.js
│       │   ├── ccbController.js
│       │   ├── baselineController.js
│       │   ├── auditController.js
│       │   ├── ciController.js
│       │   ├── reportController.js
│       │   └── notificationController.js
│       ├── models/
│       │   ├── User.js
│       │   ├── Project.js
│       │   ├── ChangeRequest.js
│       │   ├── ConfigurationItem.js
│       │   ├── Baseline.js
│       │   ├── Audit.js
│       │   ├── ApprovalDecision.js
│       │   └── Notification.js
│       ├── routes/
│       │   ├── authRoutes.js
│       │   ├── projectRoutes.js
│       │   ├── crRoutes.js
│       │   ├── ccbRoutes.js
│       │   ├── baselineRoutes.js
│       │   ├── auditRoutes.js
│       │   ├── ciRoutes.js
│       │   ├── reportRoutes.js
│       │   └── notificationRoutes.js
│       ├── middlewares/
│       └── services/
│
├── frontend/                    # React + Vite SPA
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx             # React entry point
│       ├── App.jsx              # Root component + routing
│       ├── App.css
│       ├── index.css
│       ├── assets/
│       ├── components/
│       │   └── Sidebar.jsx      # Role-aware navigation sidebar
│       ├── context/             # React context (auth state)
│       ├── services/            # Axios API service layer
│       └── pages/
│           ├── Login.jsx
│           ├── Register.jsx
│           ├── MLInsights.jsx   # ML defect prediction dashboard
│           ├── admin/
│           │   └── AdminDashboard.jsx
│           ├── auditor/
│           │   └── AuditorDashboard.jsx
│           ├── ccb/
│           │   └── CCBDashboard.jsx
│           ├── ci/              # Configuration Item pages
│           ├── developer/
│           │   ├── DeveloperDashboard.jsx
│           │   └── SubmitCR.jsx
│           └── pm/
│               └── PMDashboard.jsx
│
└── ml-service/                  # FastAPI ML Microservice
    ├── main.py                  # FastAPI app + endpoints
    ├── model.py                 # Training pipeline + prediction logic
    ├── schemas.py               # Pydantic request/response schemas
    ├── train.py                 # CLI training script
    ├── model.pkl                # Pre-trained model (binary, ~13MB)
    └── requirements.txt
```

---

## 👥 User Roles

IntelliSCM implements a strict **Role-Based Access Control (RBAC)** system. Every user is assigned one of the following roles at registration:

| Role | Description | Key Permissions |
|---|---|---|
| **Developer** | Software engineers who initiate changes | Submit change requests, view own CRs, access ML insights |
| **Project Manager** | Oversees projects and configuration items | Manage projects, track CIs, view all CRs, create baselines |
| **CCB Member** | Change Control Board member | Review & vote on CRs, approve/reject changes, view baseline history |
| **Auditor** | Quality assurance & compliance | Schedule audits, view baseline history, generate compliance reports |
| **Admin** | System administrator | Full access: user management, system configuration, all dashboards |

---

## ✨ Features

### 🔐 Authentication & Security
- JWT-based stateless authentication
- Bcrypt password hashing (10 salt rounds)
- Role-based route protection on both frontend and backend
- Persistent login sessions via localStorage

### 📝 Change Request (CR) Management
- Developers submit CRs with detailed descriptions, priority, and impact assessment
- Automated CCB member notification via email (Nodemailer + Gmail SMTP)
- Full CR lifecycle: `Draft → Submitted → Under Review → Approved / Rejected → Implemented`
- CCB voting system with approval decisions logged

### 🗂️ Configuration Item (CI) Tracking
- Register and manage software CIs (modules, documents, components)
- Track CI versions, ownership, and related change requests
- Link CIs to specific project baselines

### 📌 Baseline Management
- Project Managers create versioned baselines capturing the current state of all CIs
- Baselines can be locked to prevent unauthorized changes
- Full baseline history with audit trail

### 🔍 Audit Management
- Auditors schedule audits with location (physical/virtual) and time
- Automated email notifications sent to relevant CCB members upon scheduling
- Audit history displayed contextually within the dashboard

### 📊 Reporting
- Generate compliance and change reports per project
- Export-ready data for external audit requirements

### 🤖 ML Insights (Defect Prediction)
- Input Halstead metrics, cyclomatic complexity, LOC, and branch counts
- Receive: `defect_probability`, `risk_level` (Low/Medium/High), `impact_level`, and actionable recommendations
- Trained on the **NASA JM1 dataset** using Random Forest (200 estimators)
- Batch prediction support for multiple modules

### 🔔 Notifications
- In-app notification system
- Email notifications for CR submissions, audit scheduling, and CCB decisions

---

## 🔌 API Endpoints

> **Base URL**: `http://localhost:5001/api`
> **Swagger Docs**: `http://localhost:5001/api-docs`

### Auth Routes (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/register` | Register a new user | ❌ |
| POST | `/login` | Login and receive JWT | ❌ |
| GET | `/me` | Get current user profile | ✅ |
| GET | `/users` | List all users | ✅ Admin |
| PUT | `/users/:id/role` | Update user role | ✅ Admin |

### Project Routes (`/api/projects`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | List all projects |
| POST | `/` | Create a new project |
| GET | `/:id` | Get project details |
| PUT | `/:id` | Update a project |
| DELETE | `/:id` | Delete a project |

### Change Request Routes (`/api/crs`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | List all change requests |
| POST | `/` | Submit a new CR |
| GET | `/:id` | Get CR details |
| PUT | `/:id/status` | Update CR status |
| POST | `/:id/approve` | Approve/reject a CR (CCB) |

### CCB Routes (`/api/ccb`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/pending` | List pending CRs for CCB review |
| POST | `/decision` | Submit a CCB vote/decision |
| GET | `/decisions` | List all approval decisions |

### Baseline Routes (`/api/baselines`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | List all baselines |
| POST | `/` | Create a new baseline |
| GET | `/:id` | Get baseline details |
| PUT | `/:id/lock` | Lock a baseline |

### Audit Routes (`/api/audits`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | List all audits |
| POST | `/` | Schedule a new audit |
| GET | `/:id` | Get audit details |
| PUT | `/:id` | Update audit details |

### Configuration Item Routes (`/api/cis`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | List all CIs |
| POST | `/` | Register a new CI |
| GET | `/:id` | Get CI details |
| PUT | `/:id` | Update a CI |

### Report Routes (`/api/reports`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Generate reports |
| GET | `/:projectId` | Project-specific report |

### Notification Routes (`/api/notifications`)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Get user notifications |
| PUT | `/:id/read` | Mark notification as read |

---

## 🤖 ML Service

> **Base URL**: `http://localhost:8000`
> **Interactive Docs**: `http://localhost:8000/docs`

### Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Service status check |
| GET | `/health` | Health check + model load status |
| POST | `/predict` | Single module defect prediction |
| POST | `/predict/batch` | Batch predictions for multiple modules |
| GET | `/model-info` | Model performance metrics + feature importances |

### Prediction Request Schema (`POST /predict`)
```json
{
  "loc": 150,
  "v_g": 12,
  "ev_g": 4,
  "iv_g": 6,
  "n": 200,
  "v": 1200.5,
  "l": 0.08,
  "d": 12.5,
  "i": 96.04,
  "e": 15005.0,
  "b": 0.4,
  "t": 4168.06,
  "lOCode": 120,
  "lOComment": 20,
  "lOBlank": 10,
  "locCodeAndComment": 5,
  "uniq_Op": 18,
  "uniq_Opnd": 45,
  "total_Op": 95,
  "total_Opnd": 105,
  "branchCount": 22
}
```

### Prediction Response Schema
```json
{
  "defect_probability": 0.7821,
  "risk_level": "High",
  "impact_level": "Major",
  "defect_predicted": true,
  "confidence": 78.21,
  "recommendations": [
    "🔍 Mandatory peer code review required before merge",
    "🛑 High-risk module — escalate to CCB for approval",
    "📉 Refactor to reduce cyclomatic complexity (current: 12, target: ≤10)"
  ],
  "feature_contributions": {
    "loc": 150.0,
    "cyclomatic_complexity": 12.0,
    "branch_count": 22.0,
    "halstead_effort": 15005.0
  }
}
```

### ML Model Details
- **Algorithm**: Random Forest Classifier (200 estimators, max_depth=12)
- **Dataset**: NASA JM1 Software Defect Dataset (~10,000 samples)
- **Features**: 21 Halstead metrics + cyclomatic complexity + LOC
- **Class balancing**: `class_weight="balanced"` to handle imbalanced defect data
- **Preprocessing pipeline**: Median imputation → Random Forest
- **Risk thresholds**: Low (`< 0.30`), Medium (`0.30–0.60`), High (`> 0.60`)

---

## ✅ Prerequisites

Before you begin, ensure you have the following installed:

| Requirement | Version | Download |
|---|---|---|
| Node.js | v18+ | [nodejs.org](https://nodejs.org) |
| npm | v9+ | Included with Node.js |
| Python | 3.10+ | [python.org](https://python.org) |
| Git | Any | [git-scm.com](https://git-scm.com) |
| MongoDB Atlas Account | — | [mongodb.com/atlas](https://www.mongodb.com/atlas) |

---

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/jashwanth7ram/IntelliSCM.git
cd IntelliSCM
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create the `.env` file (see [Environment Variables](#-environment-variables)):
```bash
cp .env.example .env   # or create manually
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

### 4. ML Service Setup
```bash
cd ../ml-service

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate        # macOS/Linux
# or: venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt
```

Train the model (if `model.pkl` is not present):
```bash
python train.py
```

---

## 🔐 Environment Variables

### Backend (`backend/.env`)
```env
# Server
PORT=5001

# MongoDB Atlas
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/intelliscm?appName=SCMdatabase

# JWT
JWT_SECRET=your_super_secret_jwt_key_here

# Gmail SMTP (for email notifications)
SMTP_USER=your.email@gmail.com
SMTP_PASS=your_gmail_app_password
```

> **Note**: For Gmail SMTP, use an [App Password](https://support.google.com/accounts/answer/185833) (not your regular password) with 2FA enabled.

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:5001/api
VITE_ML_URL=http://localhost:8000
```

---

## ▶️ Running the Application

**Quick start (copy-paste setup, env vars, and troubleshooting):** see **[RUNNING.md](./RUNNING.md)**.

You can also open **three terminal windows** and run each service:

### Terminal 1 — Backend API
```bash
cd backend
npm run dev
# Server starts at http://localhost:5001
# Swagger docs at http://localhost:5001/api-docs
```

### Terminal 2 — Frontend
```bash
cd frontend
npm run dev
# App starts at http://localhost:5173
```

### Terminal 3 — ML Service
```bash
cd ml-service
source venv/bin/activate
uvicorn main:app --reload --port 8000
# ML API at http://localhost:8000
# Interactive docs at http://localhost:8000/docs
```

---

## 🗄️ Database Schema

### User
```
name, username, email, passwordHash, contactInfo,
role: ['Developer', 'Project Manager', 'CCB Member', 'Auditor', 'Admin']
```

### Project
```
name, description, status, owner (ref: User), createdAt
```

### ChangeRequest (CR)
```
title, description, priority, status, submittedBy (ref: User),
project (ref: Project), impactAnalysis, attachments, createdAt
```

### ConfigurationItem (CI)
```
name, type, version, description, project (ref: Project),
owner (ref: User), status, relatedCRs, createdAt
```

### Baseline
```
name, version, project (ref: Project), configurationItems [],
createdBy (ref: User), isLocked, description, createdAt
```

### Audit
```
title, project (ref: Project), scheduledBy (ref: User),
scheduledDate, location, locationType, status, findings, createdAt
```

### ApprovalDecision
```
changeRequest (ref: CR), ccbMember (ref: User),
decision: ['Approved', 'Rejected', 'Deferred'], comments, createdAt
```

### Notification
```
recipient (ref: User), type, message, isRead, relatedEntity, createdAt
```

---

## 🧪 Running Tests

A shell-based integration test script is provided:

```bash
chmod +x test_scm.sh
./test_scm.sh
```

This script exercises the core API endpoints sequentially to validate the end-to-end SCM workflow.

---

## 📚 API Documentation

Once the backend is running, visit:

```
http://localhost:5001/api-docs
```

Swagger UI provides interactive documentation for all API endpoints, request schemas, and response models.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

---

## 👨‍💻 Author

**Jashwanth Pedelli**
- GitHub: [@jashwanth7ram](https://github.com/jashwanth7ram)
- Email: pedellijashwanth@gmail.com

---

## 📄 License

This project is licensed under the **ISC License**.

---

> Built with ❤️ as an intelligent SCM solution that bridges traditional configuration management with modern AI-driven defect prediction.
