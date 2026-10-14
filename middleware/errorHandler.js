function notFound(req, res, next) {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.status = 404;
  next(error);
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0] || 'value';
    return res.status(400).json({
      error: 'Validation failed',
      fields: [{ field, message: 'must be unique' }],
    });
  }

  if (error.name === 'ValidationError') {
    const fields = Object.entries(error.errors).map(([field, issue]) => ({
      field,
      message: issue.kind === 'required' ? 'is required' : issue.message,
    }));
    return res.status(400).json({ error: 'Validation failed', fields });
  }

  if (error.name === 'CastError') {
    return res.status(400).json({
      error: 'Validation failed',
      fields: [{ field: error.path || 'id', message: 'has an invalid value' }],
    });
  }

  const status = Number.isInteger(error.status) ? error.status : 500;
  const response = { error: status === 500 ? 'Internal server error' : error.message };
  if (error.fields) {
    response.fields = error.fields;
  }
  return res.status(status).json(response);
}

module.exports = { errorHandler, notFound };