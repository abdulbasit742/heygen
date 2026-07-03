import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import healthRoutes from './routes/health.js';
import aiScriptRoutes from './routes/ai-script.js';
import projectRoutes from './routes/projects.js';
import scriptRoutes from './routes/scripts.js';
import renderRoutes from './routes/render.js';
import authRoutes from './routes/auth.js';
import billingRoutes from './routes/billing.js';
import avatarRoutes from './routes/avatars.js';
import sceneAssetRoutes from './routes/scene-assets.js';
import templateRoutes from './routes/templates.js';
import mediaRoutes from './routes/media.js';
import brandKitRoutes from './routes/brand-kit.js';
import workspaceRoutes from './routes/workspaces.js';
import analyticsRoutes from './routes/analytics.js';
import captionRoutes from './routes/captions.js';
import schedulerRoutes from './routes/scheduler.js';
import settingsRoutes from './routes/settings.js';
import jobsRoutes from './routes/jobs.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json({ limit: '2mb' }));
app.use('/generated-assets', express.static('generated-assets'));
app.use('/media', express.static(process.env.STORAGE_DIR || 'storage'));

app.use('/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/avatars', avatarRoutes);
app.use('/api/scene-assets', sceneAssetRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/brand-kit', brandKitRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/captions', captionRoutes);
app.use('/api/scheduler', schedulerRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/scripts', scriptRoutes);
app.use('/api/ai-script', aiScriptRoutes);
app.use('/api/render', renderRoutes);

app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`AI Avatar Video backend running on http://localhost:${PORT}`);
});
