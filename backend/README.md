# IntelliSCM Backend API Documentation

Welcome to the IntelliSCM backend service. This project implements a modern Node.js + Express + MongoDB architecture for Software Configuration Management governance.

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Ensure you have a `.env` file in the root with:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/intelliscm
   JWT_SECRET=your_secret_key
   ```
   *Note: Update `MONGODB_URI` with your MongoDB Atlas or local connection string.*

3. **Start the Application**
   ```bash
   # Development mode (auto-reloads on save)
   npm run dev
   
   # Production mode
   node src/server.js
   ```

4. **View Swagger API Documentation**
   Once the server is running, navigate to:
   [http://localhost:5000/api-docs](http://localhost:5000/api-docs)

## API Highlights

### Concept: AI Decision Support Service
Whenever a Change Request is submitted, `aiImpactService` automatically scans the properties (e.g. Lines of Code Modified, Priority) and immediately assigns a **Risk Score** and **Impact Level**.

```javascript
// Example Rules Applied On Submission:
if (loc > 500 || priority === 'Critical') {
  riskScore = 'High';
} else if (loc > 100 || priority === 'High') {
  riskScore = 'Medium';
}
```

### Concept: CCB Approvals Workflows
The Board reviews the CR and Submits an Approval Decision to `POST /api/ccb/decide`. Depending on the consensus (Approve, Reject, Request Modification), the CR lifecycle is advanced and Notifications are dispatched automatically.

### Event Hook: Notification Service
Various models (`CR Controller`, `Baseline Controller`, `Audit Controller`) utilize out-of-the-box event hooks to broadcast events (`CR_SUBMITTED`, `BASELINe_CREATED`) ensuring true SCM accountability.

## Full API Reference

### Auth Routes
- `POST /api/auth/register` - Create user
- `POST /api/auth/login` - Authenticate & get JWT 
- `GET/PATCH /api/auth/profile` - User profile operations

### Project Routes
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create a project (*Requires 'Project Manager' role*)

### Change Request Routes
- `POST /api/crs` - Submit new CR (triggers AI Impact Analysis)
- `GET /api/crs` - View CR backlog

### CCB (Change Control Board)
- `POST /api/ccb/decide` - Submit an approval decision

### Baselines & Audits
- `POST /api/baselines` - Create version baseline
- `POST /api/audits` - Schedule FCA/PCA audit

### Reporting
- `GET /api/reports?reportType=change_activity` - Generates aggregated dataset
