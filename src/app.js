require('dotenv').config();

const path = require('node:path');
const express = require('express');
const session = require('express-session');
const MySQLStoreFactory = require('express-mysql-session');
const helmet = require('helmet');
const db = require('./db');
const csrfProtection = require('./middleware/csrf');
const adminRoutes = require('./routes/admin');
const publicRoutes = require('./routes/public');

if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  throw new Error('SESSION_SECRET wajib diisi dengan nilai acak minimal 32 karakter.');
}

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const sessionStore = new (MySQLStoreFactory(session))({}, db);
const defaultSiteSettings = {
  site_name: 'MikroTech',
  site_tagline: 'Belajar MikroTik, langkah demi langkah.',
  site_description: 'Panduan MikroTik yang praktis dan mudah dipahami.'
};

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));
app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      imgSrc: ["'self'", 'data:', 'http:', 'https:']
    }
  }
}));
app.use(express.urlencoded({ extended: false, limit: '110kb' }));
app.use(express.static(path.join(__dirname, '..', 'public'), {
  maxAge: isProduction ? '1d' : 0
}));
app.use(session({
  name: 'mikrotech.sid',
  secret: process.env.SESSION_SECRET,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    maxAge: 1000 * 60 * 60 * 8
  }
}));
app.use((req, res, next) => {
  const siteSettings = req.app.locals.siteSettings || defaultSiteSettings;
  res.locals.siteSettings = siteSettings;
  res.locals.siteName = siteSettings.site_name;
  res.locals.siteTagline = siteSettings.site_tagline;
  res.locals.pageDescription = siteSettings.site_description;
  res.locals.adminUsername = req.session.adminUsername || null;
  res.locals.notice = req.session.notice || null;
  delete req.session.notice;
  next();
});
app.use(csrfProtection);
app.use('/', publicRoutes);
app.use('/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).render('error', {
    pageTitle: 'Halaman tidak ditemukan',
    message: 'Halaman yang kamu cari tidak tersedia.'
  });
});

app.use((error, req, res, next) => {
  console.error(error);
  if (res.headersSent) return next(error);
  return res.status(500).render('error', {
    pageTitle: 'Terjadi kesalahan',
    message: 'Maaf, terjadi kesalahan saat memproses permintaan. Silakan coba lagi.'
  });
});

const port = Number(process.env.PORT || 3000);
db.query('SELECT 1')
  .then(async () => {
    await db.execute(
      `CREATE TABLE IF NOT EXISTS app_settings (
        id TINYINT UNSIGNED NOT NULL,
        site_name VARCHAR(60) NOT NULL,
        site_tagline VARCHAR(120) NOT NULL,
        site_description VARCHAR(300) NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB`
    );
    await db.execute(
      `INSERT IGNORE INTO app_settings
         (id, site_name, site_tagline, site_description)
       VALUES (1, ?, ?, ?)`,
      [
        defaultSiteSettings.site_name,
        defaultSiteSettings.site_tagline,
        defaultSiteSettings.site_description
      ]
    );
    await db.execute(
      `CREATE TABLE IF NOT EXISTS contact_messages (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(254) NOT NULL,
        subject VARCHAR(160) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY contact_messages_read_created_index (is_read, created_at)
      ) ENGINE=InnoDB`
    );
    const [settings] = await db.execute(
      'SELECT site_name, site_tagline, site_description FROM app_settings WHERE id = 1'
    );
    app.locals.siteSettings = settings[0];
    app.listen(port, () => {
      console.log(`MikroTech berjalan di http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('Gagal terhubung ke MySQL. Periksa layanan dan konfigurasi basis data.', error);
    process.exitCode = 1;
  });
