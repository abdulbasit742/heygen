import express from 'express';
import cors from 'cors';
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
import clientFolderRoutes from './routes/client-folders.js';
import analyticsRoutes from './routes/analytics.js';
import captionRoutes from './routes/captions.js';
import schedulerRoutes from './routes/scheduler.js';
import settingsRoutes from './routes/settings.js';
import jobsRoutes from './routes/jobs.js';
import voiceoverRoutes from './routes/voiceover.js';
import providerCatalogRoutes from './routes/provider-catalog.js';
import { shareApiRoutes, sharePageRoutes } from './routes/share.js';
import { getRuntimeConfig } from './config/runtime.js';
import { isTrustedMutation } from './security/sessionPolicy.mjs';

const config = getRuntimeConfig();
const app = express();
app.disable('x-powered-by');

function requestOrigin(req) {
  return `${req.protocol}://${req.get('host')}`;
}

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

app.use(cors((req, callback) => {
  const origin = req.headers.origin;
  const allowed = !origin || origin === requestOrigin(req) || config.frontendOrigins.includes(origin);
  callback(null, {
    origin: allowed ? origin || false : false,
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600,
  });
}));

app.use('/api', (req, res, next) => {
  const allowedOrigins = [...config.frontendOrigins, requestOrigin(req)];
  const trusted = isTrustedMutation({
    method: req.method,
    origin: req.headers.origin,
    secFetchSite: req.headers['sec-fetch-site'],
  }, allowedOrigins);
  if (!trusted) return res.status(403).json({ error: 'Cross-site mutation blocked.' });
  return next();
});

app.use(express.json({ limit: config.jsonLimit }));
app.use('/generated-assets', express.static('generated-assets', { fallthrough: false, immutable: false }));
app.use('/media', express.static(process.env.STORAGE_DIR || 'storage', { fallthrough: false, immutable: false }));

app.use('/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/avatars', avatarRoutes);
app.use('/api/scene-assets', sceneAssetRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/brand-kit', brandKitRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/client-folders', clientFolderRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/captions', captionRoutes);
app.use('/api/scheduler', schedulerRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/voiceover', voiceoverRoutes);
app.use('/api/provider-catalog', providerCatalogRoutes);
app.use('/api/share', shareApiRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/scripts', scriptRoutes);
app.use('/api/ai-script', aiScriptRoutes);
app.use('/api/render', renderRoutes);
app.use('/share', sharePageRoutes);

app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  const status = Number.isInteger(err?.status) ? err.status : 500;
  res.status(status).json({ error: status === 500 ? 'Internal server error.' : err.message });
});

app.listen(config.port, () => {
  console.log(`AI Avatar Video backend running on http://localhost:${config.port}`);
});
