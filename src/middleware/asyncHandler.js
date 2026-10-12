// async ফাংশনের error গুলো errorHandler-এ পাঠিয়ে দেয়, যাতে প্রতিবার try/catch লিখতে না হয়
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
