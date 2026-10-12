import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
  },
  { timestamps: true }
);

// সেভ করার আগে পাসওয়ার্ড হ্যাশ করা
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.matchPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

// API রেসপন্সে পাসওয়ার্ড যেন না যায়
userSchema.methods.toJSON = function () {
  const { password, __v, ...rest } = this.toObject();
  return rest;
};

export default mongoose.model('User', userSchema);
