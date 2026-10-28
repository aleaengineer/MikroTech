const bcrypt = require('bcryptjs');
const express = require('express');
const rateLimit = require('express-rate-limit');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');
const { createSlug } = require('../utils/slug');
const { renderMarkdown } = require('../utils/markdown');

const router = express.Router();
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: 'Terlalu banyak percobaan login. Silakan coba lagi beberapa saat.'
});

function setNotice(req, message, type = 'success') {
  req.session.notice = { message, type };
}

function endAdminSession(req, res, next) {
  req.session.destroy((error) => {
    if (error) return next(error);
    res.clearCookie('mikrotech.sid');
    return res.redirect('/admin/login');
  });
}

function validImageUrl(value) {
  if (!value) return true;

  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function parseArticle(body) {
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const summary = typeof body.summary === 'string' ? body.summary.trim() : '';
  const content = typeof body.content === 'string' ? body.content.trim() : '';
  const slugInput = typeof body.slug === 'string' ? body.slug.trim() : '';
  const imageUrl = typeof body.image_url === 'string' ? body.image_url.trim() : '';
  const categoryId = Number(body.category_id);
  const status = body.status;
  const slug = createSlug(slugInput || title);
  const errors = [];

  if (title.length < 3 || title.length > 180) errors.push('Judul harus berisi 3–180 karakter.');
  if (slug.length < 2 || slug.length > 200) errors.push('Slug harus berisi 2–200 karakter.');
  if (summary.length < 10 || summary.length > 300) errors.push('Ringkasan harus berisi 10–300 karakter.');
  if (!content || content.length > 100000) errors.push('Isi artikel wajib diisi dan maksimal 100.000 karakter.');
  if (!Number.isInteger(categoryId) || categoryId < 1) errors.push('Pilih kategori yang valid.');
  if (!['draft', 'published'].includes(status)) errors.push('Pilih status artikel yang valid.');
  if (imageUrl.length > 2048 || !validImageUrl(imageUrl)) {
    errors.push('URL gambar harus berupa alamat HTTP atau HTTPS yang valid (maksimal 2.048 karakter).');
  }

  return {
    article: {
      title,
      slug,
      summary,
      content,
      image_url: imageUrl,
      category_id: categoryId,
      status
    },
    errors
  };
}

async function getCategories() {
  const [categories] = await db.execute(
    'SELECT id, name, slug FROM categories ORDER BY name'
  );
  return categories;
}

router.get('/login', (req, res) => {
  if (req.session.adminId) return res.redirect('/admin');

  return res.render('admin/login', {
    pageTitle: 'Login Admin',
    error: null
  });
});

router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const username = typeof req.body.username === 'string' ? req.body.username.trim() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (!username || !password) {
      return res.status(400).render('admin/login', {
        pageTitle: 'Login Admin',
        error: 'Masukkan username dan kata sandi.'
      });
    }

    const [admins] = await db.execute(
      'SELECT id, username, password_hash FROM admins WHERE username = ? LIMIT 1',
      [username]
    );
    const authenticated = admins.length === 1
      && await bcrypt.compare(password, admins[0].password_hash);

    if (!authenticated) {
      return res.status(401).render('admin/login', {
        pageTitle: 'Login Admin',
        error: 'Username atau kata sandi tidak sesuai.'
      });
    }

    return req.session.regenerate((error) => {
      if (error) return next(error);
      req.session.adminId = admins[0].id;
      req.session.adminUsername = admins[0].username;
      setNotice(req, 'Berhasil masuk ke panel admin.');
      return req.session.save((saveError) => {
        if (saveError) return next(saveError);
        return res.redirect('/admin');
      });
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/logout', requireAdmin, (req, res, next) => {
  req.session.destroy((error) => {
    if (error) return next(error);
    res.clearCookie('mikrotech.sid');
    return res.redirect('/');
  });
});

router.use(requireAdmin);

router.get('/', async (req, res, next) => {
  try {
    const [articles] = await db.execute(
      `SELECT a.id, a.title, a.slug, a.status, a.updated_at, c.name AS category_name
       FROM articles a
       JOIN categories c ON c.id = a.category_id
       ORDER BY a.updated_at DESC, a.id DESC`
    );
    const [counts] = await db.execute(
      `SELECT COUNT(*) AS article_count,
              SUM(status = 'published') AS published_count,
              SUM(status = 'draft') AS draft_count
       FROM articles`
    );
    const [messageCounts] = await db.execute(
      'SELECT COUNT(*) AS unread_count FROM contact_messages WHERE is_read = FALSE'
    );

    return res.render('admin/dashboard', {
      pageTitle: 'Dashboard Admin',
      articles,
      counts: counts[0],
      unreadMessageCount: messageCounts[0].unread_count
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/pesan', async (req, res, next) => {
  try {
    const [messages] = await db.execute(
      `SELECT id, name, email, subject, message, is_read, created_at
       FROM contact_messages
       ORDER BY is_read ASC, created_at DESC, id DESC
       LIMIT 100`
    );
    return res.render('admin/messages', {
      pageTitle: 'Pesan Masuk',
      messages
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/pesan/:id/baca', async (req, res, next) => {
  try {
    const [result] = await db.execute(
      'UPDATE contact_messages SET is_read = TRUE WHERE id = ?',
      [req.params.id]
    );
    if (!result.affectedRows) {
      return res.status(404).render('error', {
        pageTitle: 'Pesan tidak ditemukan',
        message: 'Pesan yang ingin diperbarui tidak ditemukan.'
      });
    }
    setNotice(req, 'Pesan ditandai sudah dibaca.');
    return res.redirect('/admin/pesan');
  } catch (error) {
    return next(error);
  }
});

router.post('/pesan/:id/hapus', async (req, res, next) => {
  try {
    const [result] = await db.execute('DELETE FROM contact_messages WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) {
      return res.status(404).render('error', {
        pageTitle: 'Pesan tidak ditemukan',
        message: 'Pesan yang ingin dihapus tidak ditemukan.'
      });
    }
    setNotice(req, 'Pesan berhasil dihapus.');
    return res.redirect('/admin/pesan');
  } catch (error) {
    return next(error);
  }
});

router.get('/profile', async (req, res, next) => {
  try {
    const [admins] = await db.execute(
      'SELECT id, username, created_at FROM admins WHERE id = ? LIMIT 1',
      [req.session.adminId]
    );
    if (!admins.length) {
      return endAdminSession(req, res, next);
    }

    return res.render('admin/profile', {
      pageTitle: 'Profil Admin',
      admin: admins[0],
      errors: []
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/profile', async (req, res, next) => {
  try {
    const username = typeof req.body.username === 'string' ? req.body.username.trim() : '';
    const currentPassword = typeof req.body.current_password === 'string'
      ? req.body.current_password
      : '';
    const errors = [];
    if (username.length < 3 || username.length > 80) {
      errors.push('Username harus berisi 3–80 karakter.');
    }
    if (!currentPassword) errors.push('Masukkan kata sandi saat ini untuk mengubah username.');

    const [admins] = await db.execute(
      'SELECT id, username, password_hash, created_at FROM admins WHERE id = ? LIMIT 1',
      [req.session.adminId]
    );
    if (!admins.length) {
      return endAdminSession(req, res, next);
    }
    const admin = admins[0];
    if (currentPassword && !(await bcrypt.compare(currentPassword, admin.password_hash))) {
      errors.push('Kata sandi saat ini tidak sesuai.');
    }

    if (!errors.length && username !== admin.username) {
      try {
        await db.execute('UPDATE admins SET username = ? WHERE id = ?', [username, admin.id]);
      } catch (error) {
        if (error.code !== 'ER_DUP_ENTRY') throw error;
        errors.push('Username tersebut sudah digunakan.');
      }
    }

    if (!errors.length) {
      req.session.adminUsername = username;
      setNotice(req, username === admin.username
        ? 'Profil berhasil diverifikasi. Username tidak berubah.'
        : 'Username berhasil diperbarui.');
      return res.redirect('/admin/profile');
    }

    return res.status(400).render('admin/profile', {
      pageTitle: 'Profil Admin',
      admin: { ...admin, username },
      errors
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/profile/password', async (req, res, next) => {
  try {
    const currentPassword = typeof req.body.current_password === 'string'
      ? req.body.current_password
      : '';
    const newPassword = typeof req.body.new_password === 'string' ? req.body.new_password : '';
    const confirmPassword = typeof req.body.confirm_password === 'string'
      ? req.body.confirm_password
      : '';
    const errors = [];
    if (!currentPassword) errors.push('Masukkan kata sandi saat ini.');
    if (newPassword.length < 6 || newPassword.length > 128) {
      errors.push('Kata sandi baru harus berisi 6–128 karakter.');
    }
    if (newPassword !== confirmPassword) errors.push('Konfirmasi kata sandi baru tidak cocok.');
    if (currentPassword && newPassword === currentPassword) {
      errors.push('Kata sandi baru harus berbeda dari kata sandi saat ini.');
    }

    const [admins] = await db.execute(
      'SELECT id, username, password_hash, created_at FROM admins WHERE id = ? LIMIT 1',
      [req.session.adminId]
    );
    if (!admins.length) {
      return endAdminSession(req, res, next);
    }
    const admin = admins[0];
    if (currentPassword && !(await bcrypt.compare(currentPassword, admin.password_hash))) {
      errors.push('Kata sandi saat ini tidak sesuai.');
    }

    if (errors.length) {
      return res.status(400).render('admin/profile', {
        pageTitle: 'Profil Admin',
        admin,
        errors
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db.execute('UPDATE admins SET password_hash = ? WHERE id = ?', [passwordHash, admin.id]);
    setNotice(req, 'Kata sandi berhasil diubah.');
    return res.redirect('/admin/profile');
  } catch (error) {
    return next(error);
  }
});

router.get('/settings', async (req, res, next) => {
  try {
    const [settings] = await db.execute(
      'SELECT site_name, site_tagline, site_description FROM app_settings WHERE id = 1'
    );
    return res.render('admin/settings', {
      pageTitle: 'Pengaturan Situs',
      settings: settings[0],
      errors: []
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/settings', async (req, res, next) => {
  try {
    const settings = {
      site_name: typeof req.body.site_name === 'string' ? req.body.site_name.trim() : '',
      site_tagline: typeof req.body.site_tagline === 'string' ? req.body.site_tagline.trim() : '',
      site_description: typeof req.body.site_description === 'string'
        ? req.body.site_description.trim()
        : ''
    };
    const errors = [];

    if (settings.site_name.length < 2 || settings.site_name.length > 60) {
      errors.push('Nama situs harus berisi 2–60 karakter.');
    }
    if (settings.site_tagline.length < 5 || settings.site_tagline.length > 120) {
      errors.push('Tagline harus berisi 5–120 karakter.');
    }
    if (settings.site_description.length < 20 || settings.site_description.length > 300) {
      errors.push('Deskripsi situs harus berisi 20–300 karakter.');
    }

    if (errors.length) {
      return res.status(400).render('admin/settings', {
        pageTitle: 'Pengaturan Situs',
        settings,
        errors
      });
    }

    await db.execute(
      `UPDATE app_settings
       SET site_name = ?, site_tagline = ?, site_description = ?
       WHERE id = 1`,
      [settings.site_name, settings.site_tagline, settings.site_description]
    );
    req.app.locals.siteSettings = settings;
    setNotice(req, 'Pengaturan situs berhasil disimpan.');
    return res.redirect('/admin/settings');
  } catch (error) {
    return next(error);
  }
});

router.post('/artikel/preview', async (req, res, next) => {
  try {
    const { article, errors } = parseArticle(req.body);
    const returnTo = typeof req.body.return_to === 'string'
      && /^\/admin\/artikel(?:\/\d+)?$/.test(req.body.return_to)
      ? req.body.return_to
      : '/admin/artikel/baru';
    const categories = await getCategories();
    const category = categories.find((item) => item.id === article.category_id);
    if (!category) errors.push('Pilih kategori yang valid.');

    if (errors.length) {
      return res.status(400).render('admin/article-form', {
        pageTitle: 'Pratinjau Artikel',
        formTitle: returnTo === '/admin/artikel/baru' ? 'Tulis Artikel' : 'Ubah Artikel',
        action: returnTo,
        article,
        categories,
        errors
      });
    }

    return res.render('admin/article-preview', {
      pageTitle: `Pratinjau: ${article.title}`,
      article: {
        ...article,
        category_name: category.name,
        category_slug: category.slug,
        published_at: new Date(),
        contentHtml: renderMarkdown(article.content)
      },
      returnTo
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/artikel/baru', async (req, res, next) => {
  try {
    return res.render('admin/article-form', {
      pageTitle: 'Tulis Artikel',
      formTitle: 'Tulis Artikel',
      action: '/admin/artikel',
      article: { title: '', slug: '', summary: '', content: '', image_url: '', category_id: '', status: 'draft' },
      categories: await getCategories(),
      errors: []
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/artikel', async (req, res, next) => {
  try {
    const { article, errors } = parseArticle(req.body);
    const categories = await getCategories();
    if (!categories.some((category) => category.id === article.category_id)) {
      errors.push('Kategori yang dipilih tidak ditemukan.');
    }

    if (errors.length) {
      return res.status(400).render('admin/article-form', {
        pageTitle: 'Tulis Artikel',
        formTitle: 'Tulis Artikel',
        action: '/admin/artikel',
        article,
        categories,
        errors
      });
    }

    await db.execute(
      `INSERT INTO articles
         (category_id, title, slug, summary, content, image_url, status, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, IF(? = 'published', CURRENT_TIMESTAMP, NULL))`,
      [
        article.category_id,
        article.title,
        article.slug,
        article.summary,
        article.content,
        article.image_url || null,
        article.status,
        article.status
      ]
    );
    setNotice(req, 'Artikel berhasil ditambahkan.');
    return res.redirect('/admin');
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).render('admin/article-form', {
        pageTitle: 'Tulis Artikel',
        formTitle: 'Tulis Artikel',
        action: '/admin/artikel',
        article: parseArticle(req.body).article,
        categories: await getCategories(),
        errors: ['Slug artikel sudah digunakan. Gunakan slug yang berbeda.']
      });
    }
    return next(error);
  }
});

router.get('/artikel/:id/edit', async (req, res, next) => {
  try {
    const [articles] = await db.execute('SELECT * FROM articles WHERE id = ? LIMIT 1', [req.params.id]);
    if (!articles.length) {
      return res.status(404).render('error', {
        pageTitle: 'Artikel tidak ditemukan',
        message: 'Artikel yang ingin diubah tidak ditemukan.'
      });
    }

    return res.render('admin/article-form', {
      pageTitle: 'Ubah Artikel',
      formTitle: 'Ubah Artikel',
      action: `/admin/artikel/${articles[0].id}`,
      article: articles[0],
      categories: await getCategories(),
      errors: []
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/artikel/:id', async (req, res, next) => {
  try {
    const [existing] = await db.execute('SELECT id, published_at FROM articles WHERE id = ? LIMIT 1', [req.params.id]);
    if (!existing.length) {
      return res.status(404).render('error', {
        pageTitle: 'Artikel tidak ditemukan',
        message: 'Artikel yang ingin diubah tidak ditemukan.'
      });
    }

    const { article, errors } = parseArticle(req.body);
    const categories = await getCategories();
    if (!categories.some((category) => category.id === article.category_id)) {
      errors.push('Kategori yang dipilih tidak ditemukan.');
    }

    if (errors.length) {
      return res.status(400).render('admin/article-form', {
        pageTitle: 'Ubah Artikel',
        formTitle: 'Ubah Artikel',
        action: `/admin/artikel/${req.params.id}`,
        article,
        categories,
        errors
      });
    }

    await db.execute(
      `UPDATE articles
       SET category_id = ?, title = ?, slug = ?, summary = ?, content = ?, image_url = ?, status = ?,
           published_at = CASE
             WHEN ? = 'draft' THEN NULL
             WHEN published_at IS NULL THEN CURRENT_TIMESTAMP
             ELSE published_at
           END
       WHERE id = ?`,
      [
        article.category_id,
        article.title,
        article.slug,
        article.summary,
        article.content,
        article.image_url || null,
        article.status,
        article.status,
        req.params.id
      ]
    );
    setNotice(req, 'Artikel berhasil diperbarui.');
    return res.redirect('/admin');
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).render('admin/article-form', {
        pageTitle: 'Ubah Artikel',
        formTitle: 'Ubah Artikel',
        action: `/admin/artikel/${req.params.id}`,
        article: parseArticle(req.body).article,
        categories: await getCategories(),
        errors: ['Slug artikel sudah digunakan. Gunakan slug yang berbeda.']
      });
    }
    return next(error);
  }
});

router.post('/artikel/:id/hapus', async (req, res, next) => {
  try {
    const [result] = await db.execute('DELETE FROM articles WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).render('error', {
        pageTitle: 'Artikel tidak ditemukan',
        message: 'Artikel yang ingin dihapus tidak ditemukan.'
      });
    }

    setNotice(req, 'Artikel berhasil dihapus.');
    return res.redirect('/admin');
  } catch (error) {
    return next(error);
  }
});

router.get('/kategori', async (req, res, next) => {
  try {
    const [categories] = await db.execute(
      `SELECT c.id, c.name, c.slug, COUNT(a.id) AS article_count
       FROM categories c
       LEFT JOIN articles a ON a.category_id = c.id
       GROUP BY c.id
       ORDER BY c.name`
    );
    return res.render('admin/categories', {
      pageTitle: 'Kelola Kategori',
      categories,
      category: { name: '', slug: '' },
      editingId: null,
      errors: []
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/kategori/:id/edit', async (req, res, next) => {
  try {
    const [categories] = await db.execute(
      `SELECT c.id, c.name, c.slug, COUNT(a.id) AS article_count
       FROM categories c
       LEFT JOIN articles a ON a.category_id = c.id
       WHERE c.id = ?
       GROUP BY c.id`,
      [req.params.id]
    );
    if (!categories.length) {
      return res.status(404).render('error', {
        pageTitle: 'Kategori tidak ditemukan',
        message: 'Kategori yang ingin diubah tidak ditemukan.'
      });
    }
    const [allCategories] = await db.execute(
      `SELECT c.id, c.name, c.slug, COUNT(a.id) AS article_count
       FROM categories c
       LEFT JOIN articles a ON a.category_id = c.id
       GROUP BY c.id
       ORDER BY c.name`
    );
    return res.render('admin/categories', {
      pageTitle: 'Ubah Kategori',
      categories: allCategories,
      category: categories[0],
      editingId: categories[0].id,
      errors: []
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/kategori', async (req, res, next) => saveCategory(req, res, next, null));
router.post('/kategori/:id', async (req, res, next) => saveCategory(req, res, next, req.params.id));

async function saveCategory(req, res, next, id) {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const slug = createSlug(typeof req.body.slug === 'string' && req.body.slug.trim()
      ? req.body.slug
      : name);
    const errors = [];
    if (name.length < 2 || name.length > 100) errors.push('Nama kategori harus berisi 2–100 karakter.');
    if (slug.length < 2 || slug.length > 120) errors.push('Slug kategori harus berisi 2–120 karakter.');

    if (!errors.length) {
      try {
        if (id) {
          const [existing] = await db.execute(
            'SELECT id FROM categories WHERE id = ? LIMIT 1',
            [id]
          );
          if (!existing.length) {
            return res.status(404).render('error', {
              pageTitle: 'Kategori tidak ditemukan',
              message: 'Kategori yang ingin diubah tidak ditemukan.'
            });
          }
          await db.execute(
            'UPDATE categories SET name = ?, slug = ? WHERE id = ?',
            [name, slug, id]
          );
          setNotice(req, 'Kategori berhasil diperbarui.');
        } else {
          await db.execute('INSERT INTO categories (name, slug) VALUES (?, ?)', [name, slug]);
          setNotice(req, 'Kategori berhasil ditambahkan.');
        }
        return res.redirect('/admin/kategori');
      } catch (error) {
        if (error.code !== 'ER_DUP_ENTRY') throw error;
        errors.push('Nama atau slug kategori sudah digunakan.');
      }
    }

    const [categories] = await db.execute(
      `SELECT c.id, c.name, c.slug, COUNT(a.id) AS article_count
       FROM categories c
       LEFT JOIN articles a ON a.category_id = c.id
       GROUP BY c.id
       ORDER BY c.name`
    );
    return res.status(400).render('admin/categories', {
      pageTitle: id ? 'Ubah Kategori' : 'Kelola Kategori',
      categories,
      category: { id, name, slug },
      editingId: id,
      errors
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = router;
