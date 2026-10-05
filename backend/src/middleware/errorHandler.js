function errorHandler(err, req, res, next) {
  console.error('API Error:', {
    name: err.name,
    code: err.code,
    message: err.message,
    path: req.originalUrl,
    method: req.method
  });

  let statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  let message = err.message || 'Internal server error occurred';

  // Handle Prisma Known Errors
  if (err.code === 'P2002') {
    statusCode = 409;
    const target = err.meta?.target ? ` on field (${err.meta.target})` : '';
    message = `A record with this unique field already exists${target}`;
  } else if (err.code === 'P2025') {
    statusCode = 404;
    message = 'Requested record was not found';
  } else if (err.code === 'P2003') {
    statusCode = 400;
    message = 'Invalid reference: related record does not exist';
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    details: err.details || null
  });
}

module.exports = errorHandler;
