// Central error handler. Anything thrown (or rejected) inside an async route
// handler is caught automatically by express-async-errors and lands here.
const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error(err);

  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ success: false, message: 'That value is already in use.' });
  }
  if (err instanceof (require('multer').MulterError)) {
    return res.status(400).json({ success: false, message: err.message });
  }

  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Something went wrong on our end.',
  });
};

module.exports = errorHandler;
