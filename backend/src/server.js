require('dotenv').config();
const express      = require('express');
const helmet       = require('helmet');
const morgan       = require('morgan');
const rateLimit    = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path         = require('path');
const { testConnection } = require('./config/database');
const logger = require('./config/logger');

const app  = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

app.use(helmet({ contentSecurityPolicy: {
  directives: {
    defaultSrc:["'self'"], scriptSrc:["'self'","'unsafe-inline'"],
    styleSrc:["'self'","'unsafe-inline'",'fonts.googleapis.com'],
    fontSrc:["'self'",'fonts.gstatic.com'], connectSrc:["'self'"], imgSrc:["'self'",'data:'],
  }
}}));
app.use('/api/', rateLimit({ windowMs:15*60*1000, max:100, standardHeaders:true, legacyHeaders:false, message:{error:'Demasiadas solicitudes.'} }));
app.use(express.json({ limit:'1mb' }));
app.use(express.urlencoded({ extended:false }));
app.use(cookieParser());
app.use(morgan(process.env.NODE_ENV==='production'?'combined':'dev', { stream:{ write:(m)=>logger.http(m.trim()) } }));

app.get('/health', (_req,res) => res.json({ status:'ok', timestamp:new Date().toISOString(), version:'0.1.0' }));

// Rutas API
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/residentes',  require('./routes/residentes'));
app.use('/api/apartamentos', require('./routes/apartamentos'));
app.use('/api/cuotas',      require('./routes/cuotas'));
app.use('/api/pqr',         require('./routes/pqr'));
app.use('/api/comunicados', require('./routes/comunicados'));
app.use('/api/conjuntos',  require('./routes/conjuntos'));

app.use(express.static(PUBLIC_DIR));
app.get('*', (_req,res) => res.sendFile(path.join(PUBLIC_DIR,'index.html')));

app.use((err,_req,res,_next) => {
  logger.error(`${err.status||500} — ${err.message}`);
  res.status(err.status||500).json({ error: process.env.NODE_ENV==='production'?'Error interno.':err.message });
});

async function start() {
  const dbOk = await testConnection();
  if (!dbOk && process.env.NODE_ENV==='production') { logger.error('Sin BD. Abortando.'); process.exit(1); }
  app.listen(PORT, () => {
    logger.info(`🚀 ResidenciasPro en http://localhost:${PORT}`);
    logger.info(`   Entorno: ${process.env.NODE_ENV||'development'}`);
  });
}
start();
module.exports = app;