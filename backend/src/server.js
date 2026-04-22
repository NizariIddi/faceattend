require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { syncDB } = require('./models');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Security & Parsing ──
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'], allowedHeaders: ['Content-Type','Authorization'] }));
app.use(express.json({ limit: '10mb' })); // large for face descriptors
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Rate Limiting ──
app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { success: false, message: 'Too many login attempts' } }));
app.use('/api', rateLimit({ windowMs: 60 * 1000, max: 300 }));

// ── Static Files ──
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(express.static(path.join(__dirname, '../../frontend/public')));

// ── API Routes ──
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/users',      require('./routes/users'));
app.use('/api/students',   require('./routes/students'));
app.use('/api/classes',    require('./routes/classes'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/dashboard',  require('./routes/dashboard'));

// ── Health Check ──
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString(), env: process.env.NODE_ENV }));

// ── SPA Fallback (serve frontend) ──
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return notFound(req, res);
  res.sendFile(path.join(__dirname, '../../frontend/public/index.html'));
});

// ── Error Handling ──
app.use(notFound);
app.use(errorHandler);

// ── Start ──
syncDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 FaceAttend running at http://localhost:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Run 'npm run seed' to populate demo data\n`);
  });
}).catch(err => {
  console.error('[FATAL] Could not connect to database:', err.message);
  process.exit(1);
});
