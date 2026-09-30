export function errorHandler(err, req, res, next) {
  console.error('🔥 Server Error Handler:', err);

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Đã có lỗi hệ thống xảy ra trên server.';

  res.status(statusCode).json({
    success: false,
    error: message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
}

export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: `API Route không tồn tại: ${req.method} ${req.originalUrl}`
  });
}
