// =============================================================
// models/User.js — Updated with courses & subjects support
// =============================================================
const mongoose = require("mongoose");

const studentProfileSchema = new mongoose.Schema({
  program: { type: String, default: "" },
  lecture_group: { type: String, default: "" },
  tutorial_group: { type: String, default: "" },
  practical_group: { type: String, default: "" },
  address: { type: String, default: "" },
  courses: [{ type: String }],
}, { _id: false });

const lecturerProfileSchema = new mongoose.Schema({
  department: { type: String, default: "" },
  subjects: [{ type: String }],
}, { _id: false });

const userSchema = new mongoose.Schema({
  matric_staff_id: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: {
    type: String,
    enum: ["student", "admin", "lecturer", "pengarah"],
    required: true,
  },
  email: { type: String, default: "" },
  phone: { type: String, default: "" },
  ic_number: { type: String, default: "" },
  profile: {
    type: mongoose.Schema.Types.Mixed,
  },
}, { timestamps: true });

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
