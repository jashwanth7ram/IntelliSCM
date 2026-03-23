# IntelliSCM

IntelliSCM is an intelligent Software Configuration Management (SCM) application built with a modern tech stack. It integrates a machine learning risk assessment service to automate and improve the precision of code baseline change requests.

## Architecture

The project is broken into three main services:

1. **Frontend (`/frontend`)**
   - React application built with Vite
   - Role-based dashboards for Developers, Project Managers, CCB Members, Auditors, and Admins
   - Manages UI state, API requests, and user authentication tokens

2. **Backend (`/backend`)**
   - Node.js API with Express
   - MongoDB database (Mongoose)
   - Handles JWT Authentication, Projects, Change Requests (CRs), Baselines, and Automated Email Notifications via Nodemailer

3. **ML Service (`/ml-service`)**
   - Python FastAPI service
   - Evaluates incoming Change Requests and assigns Risk Scores based on historical software metrics

## Running Locally

To run this application locally, you will need to start all three services in separate terminals.

### 1. Backend Service
Make sure you have Node.js and MongoDB installed.
> **Note**: You must create a `.env` file in the `backend` folder containing `MONGODB_URI`, `JWT_SECRET`, `SMTP_USER`, and `SMTP_PASS`.

```bash
cd backend
npm install
node src/server.js
```

### 2. ML Service
Make sure you have Python installed.

```bash
cd ml-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

### 3. Frontend Service
Make sure you have Node.js installed.

```bash
cd frontend
npm install
npm run dev
```

Navigate to `http://localhost:5173` to interact with the application.

## Roles & Access
The application features a fully protected dashboard system based on User Roles:
- **Developer**: Submit Change Requests, view personal Dashboards.
- **Project Manager**: Manage new Projects and view the system-wide CR Backlog.
- **CCB Member**: Access the CCB dashboard to Approve, Modify, or Reject Change Requests.
- **Auditor**: Schedule FCA/PCA audits, create Baselines, and oversee approved changes.
- **Admin**: System-wide analytics, report graphs, and user management.
