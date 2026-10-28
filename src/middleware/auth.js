function requireAdmin(req, res, next) {
  if (!req.session.adminId) {
    return res.redirect('/admin/login');
  }

  return next();
}

module.exports = { requireAdmin };
