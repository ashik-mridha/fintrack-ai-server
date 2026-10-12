export const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`পাওয়া যায়নি: ${req.originalUrl}`));
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  let status = res.statusCode >= 400 ? res.statusCode : 500;
  if (err.name === 'ValidationError' || err.name === 'CastError') status = 400;
  if (err.code === 11000) {
    status = 400;
    err.message = 'এই ইমেইল দিয়ে আগেই অ্যাকাউন্ট খোলা হয়েছে';
  }
  res.status(status).json({ message: err.message });
};
