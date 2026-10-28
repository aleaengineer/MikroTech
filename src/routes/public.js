const express = require('express');
const rateLimit = require('express-rate-limit');
const db = require('../db');
const { renderMarkdown } = require('../utils/markdown');

const router = express.Router();
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: 'Terlalu banyak pesan dikirim. Silakan coba lagi satu jam lagi.'
});

function parseContactMessage(body) {
  const form = {
    name: typeof body.name === 'string' ? body.name.trim() : '',
    email: typeof body.email === 'string' ? body.email.trim().toLowerCase() : '',
    subject: typeof body.subject === 'string' ? body.subject.trim() : '',
    message: typeof body.message === 'string' ? body.message.trim() : ''
  };
  const errors = [];

  if (form.name.length < 2 || form.name.length > 100) {
    errors.push('Nama harus berisi 2–100 karakter.');
  }
  if (form.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.push('Masukkan alamat email yang valid.');
  }
  if (form.subject.length < 3 || form.subject.length > 160) {
    errors.push('Topik harus berisi 3–160 karakter.');
  }
  if (form.message.length < 10 || form.message.length > 5000) {
    errors.push('Pesan harus berisi 10–5.000 karakter.');
  }

  return { form, errors };
}

router.get('/', async (req, res, next) => {
  try {
    const [categories] = await db.execute(
      'SELECT id, name, slug FROM categories ORDER BY name'
    );
    const [articles] = await db.execute(
      `SELECT a.id, a.title, a.slug, a.summary, a.image_url, a.published_at,
              c.name AS category_name, c.slug AS category_slug
       FROM articles a
       JOIN categories c ON c.id = a.category_id
       WHERE a.status = 'published'
       ORDER BY a.published_at DESC, a.id DESC
       LIMIT 6`
    );

    res.render('home', {
      pageTitle: 'Belajar MikroTik, langkah demi langkah',
      pageDescription: req.app.locals.siteSettings.site_description,
      categories,
      articles
    });
  } catch (error) {
    next(error);
  }
});

router.get('/artikel', async (req, res, next) => {
  try {
    const search = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : '';
    const categorySlug = typeof req.query.kategori === 'string' ? req.query.kategori : '';
    const conditions = ["a.status = 'published'"];
    const values = [];

    if (search) {
      conditions.push('(a.title LIKE ? OR a.summary LIKE ? OR a.content LIKE ?)');
      const term = `%${search}%`;
      values.push(term, term, term);
    }

    if (categorySlug) {
      conditions.push('c.slug = ?');
      values.push(categorySlug);
    }

    const [categories] = await db.execute(
      'SELECT id, name, slug FROM categories ORDER BY name'
    );
    const [articles] = await db.execute(
      `SELECT a.id, a.title, a.slug, a.summary, a.image_url, a.published_at,
              c.name AS category_name, c.slug AS category_slug
       FROM articles a
       JOIN categories c ON c.id = a.category_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY a.published_at DESC, a.id DESC`,
      values
    );
    const selectedCategory = categories.find((category) => category.slug === categorySlug);

    res.render('articles', {
      pageTitle: selectedCategory ? selectedCategory.name : 'Semua Artikel',
      pageDescription: 'Jelajahi panduan MikroTik berdasarkan topik atau kata kunci.',
      articles,
      categories,
      search,
      categorySlug,
      selectedCategory
    });
  } catch (error) {
    next(error);
  }
});

router.get('/artikel/:slug', async (req, res, next) => {
  try {
    const [articles] = await db.execute(
      `SELECT a.id, a.title, a.slug, a.summary, a.content, a.image_url, a.published_at,
              c.name AS category_name, c.slug AS category_slug
       FROM articles a
       JOIN categories c ON c.id = a.category_id
       WHERE a.slug = ? AND a.status = 'published'
       LIMIT 1`,
      [req.params.slug]
    );

    if (articles.length === 0) {
      return res.status(404).render('error', {
        pageTitle: 'Artikel tidak ditemukan',
        message: 'Artikel yang kamu cari tidak tersedia atau belum dipublikasikan.'
      });
    }

    return res.render('article', {
      pageTitle: articles[0].title,
      pageDescription: articles[0].summary,
      article: {
        ...articles[0],
        contentHtml: renderMarkdown(articles[0].content)
      }
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/kategori/:slug', async (req, res, next) => {
  try {
    const [categories] = await db.execute(
      'SELECT id, name, slug FROM categories WHERE slug = ? LIMIT 1',
      [req.params.slug]
    );

    if (categories.length === 0) {
      return res.status(404).render('error', {
        pageTitle: 'Kategori tidak ditemukan',
        message: 'Kategori yang kamu cari tidak tersedia.'
      });
    }

    const [articles] = await db.execute(
      `SELECT a.id, a.title, a.slug, a.summary, a.image_url, a.published_at,
              c.name AS category_name, c.slug AS category_slug
       FROM articles a
       JOIN categories c ON c.id = a.category_id
       WHERE a.status = 'published' AND c.id = ?
       ORDER BY a.published_at DESC, a.id DESC`,
      [categories[0].id]
    );

    return res.render('articles', {
      pageTitle: categories[0].name,
      pageDescription: `Panduan MikroTik dalam kategori ${categories[0].name}.`,
      articles,
      categories,
      search: '',
      categorySlug: categories[0].slug,
      selectedCategory: categories[0]
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/tentang', (req, res) => {
  res.render('about', {
    pageTitle: 'Tentang MikroTech',
    pageDescription: 'Tentang tujuan dan materi pembelajaran di MikroTech.'
  });
});

router.get('/faq', (req, res) => {
  res.render('faq', {
    pageTitle: 'FAQ',
    pageDescription: 'Jawaban atas pertanyaan umum tentang panduan dan materi MikroTech.',
    faqs: [
      {
        question: 'Apa itu MikroTech?',
        answer: 'MikroTech adalah ruang belajar yang menyajikan artikel dan panduan MikroTik untuk membantu pembaca memahami konfigurasi jaringan secara bertahap.'
      },
      {
        question: 'Apakah panduan cocok untuk pemula?',
        answer: 'Ya. Materi disusun mulai dari dasar. Periksa kebutuhan dan topologi jaringanmu, lalu ikuti langkah yang sesuai dengan versi RouterOS dan perangkat yang digunakan.'
      },
      {
        question: 'Bagaimana cara menjalankan perintah konfigurasi?',
        answer: 'Baca konteks dan tujuan setiap perintah terlebih dahulu. Uji perubahan pada perangkat atau lingkungan lab, simpan cadangan konfigurasi, dan jangan langsung menempelkan perintah ke jaringan produksi tanpa memahami dampaknya.'
      },
      {
        question: 'Apakah semua konfigurasi berlaku untuk setiap router MikroTik?',
        answer: 'Tidak selalu. Nama interface, model perangkat, topologi, penyedia internet, dan versi RouterOS dapat berbeda. Sesuaikan contoh pada artikel dengan kondisi jaringanmu.'
      },
      {
        question: 'Bagaimana mencari panduan tertentu?',
        answer: 'Gunakan pencarian dan filter kategori di halaman Artikel. Kamu juga dapat membuka halaman kategori untuk melihat panduan dengan topik yang sama.'
      },
      {
        question: 'Bagaimana jika saya menemukan kesalahan atau punya pertanyaan?',
        answer: 'Kirimkan pertanyaan atau masukan melalui halaman Kontak. Sertakan judul artikel dan detail yang relevan agar tim MikroTech dapat memahami konteksnya.'
      }
    ]
  });
});

router.get('/kontak', (req, res) => {
  res.render('contact', {
    pageTitle: 'Kontak',
    pageDescription: 'Kirim pertanyaan, koreksi, atau saran kepada tim MikroTech.',
    form: { name: '', email: '', subject: '', message: '' },
    errors: []
  });
});

router.post('/kontak', contactLimiter, async (req, res, next) => {
  const { form, errors } = parseContactMessage(req.body);
  if (errors.length) {
    return res.status(400).render('contact', {
      pageTitle: 'Kontak',
      pageDescription: 'Kirim pertanyaan, koreksi, atau saran kepada tim MikroTech.',
      form,
      errors
    });
  }

  try {
    await db.execute(
      `INSERT INTO contact_messages (name, email, subject, message)
       VALUES (?, ?, ?, ?)`,
      [form.name, form.email, form.subject, form.message]
    );
    req.session.notice = {
      message: 'Pesan berhasil dikirim. Terima kasih sudah menghubungi MikroTech.',
      type: 'success'
    };
    return res.redirect('/kontak');
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
