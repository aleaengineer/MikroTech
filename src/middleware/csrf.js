const { randomBytes, timingSafeEqual } = require('node:crypto');

function csrfProtection(req, res, next) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = randomBytes(32).toString('hex');
  }

  res.locals.csrfToken = req.session.csrfToken;

  if (req.method === 'POST') {
    const submittedToken = req.body && req.body._csrf;
    const expected = Buffer.from(req.session.csrfToken);
    const submitted = Buffer.from(typeof submittedToken === 'string' ? submittedToken : '');

    if (expected.length !== submitted.length || !timingSafeEqual(expected, submitted)) {
      return res.status(403).render('error', {
        pageTitle: 'Permintaan tidak valid',
        message: 'Formulir kedaluwarsa atau token keamanan tidak valid. Silakan kembali dan coba lagi.'
      });
    }
  }

  return next();
}

module.exports = csrfProtection;
