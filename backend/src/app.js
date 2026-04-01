const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

// Route imports
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const crRoutes = require('./routes/crRoutes');
const ccbRoutes = require('./routes/ccbRoutes');
const baselineRoutes = require('./routes/baselineRoutes');
const auditRoutes = require('./routes/auditRoutes');
const ciRoutes = require('./routes/ciRoutes');
const reportRoutes = require('./routes/reportRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const activityRoutes = require('./routes/activityRoutes');
const pipelineRoutes = require('./routes/pipelineRoutes');
const releaseRoutes = require('./routes/releaseRoutes');
const deploymentRoutes = require('./routes/deploymentRoutes');
const devopsRoutes = require('./routes/devopsRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Swagger Documentation
const swaggerDocs = require('./config/swagger');
swaggerDocs(app);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/crs', crRoutes);
app.use('/api/ccb', ccbRoutes);
app.use('/api/baselines', baselineRoutes);
app.use('/api/audits', auditRoutes);
app.use('/api/cis', ciRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/pipelines', pipelineRoutes);
app.use('/api/releases', releaseRoutes);
app.use('/api/deployments', deploymentRoutes);
app.use('/api/devops', devopsRoutes);

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

module.exports = app;
