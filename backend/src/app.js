const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const config = require('./config');

// Initialize DB (runs migrations on import)
require('./database');

const authRouter = require('./routes/auth');
const userRouter = require('./routes/user');
const onboardingRouter = require('./routes/onboarding');
const resumeRouter = require('./routes/resume');
const chatRouter = require('./routes/chat');
const contactRouter = require('./routes/contact');
const jobsRouter = require('./routes/jobs');

const app = express();

// CORS
app.use(
  cors({
    origin: [config.frontendUrl, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static(path.resolve(process.cwd(), config.uploadDir)));

// Root → redirect to interactive API docs (mirrors Presto pattern)
app.get('/', (_req, res) => res.redirect('/docs'));

// Swagger UI
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customSiteTitle: 'CareerMate AI — API Docs',
  swaggerOptions: { persistAuthorization: true },
}));

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/onboarding', onboardingRouter);
app.use('/api/resume', resumeRouter);
app.use('/api/chat', chatRouter);
app.use('/api/contact', contactRouter);
app.use('/api/jobs', jobsRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ detail: 'Not found' });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  const detail = config.debug || process.env.NODE_ENV !== 'production'
    ? (err.message || 'Internal server error')
    : 'Internal server error';
  res.status(500).json({ detail });
});

module.exports = app;
