// =============================================================
// models/User.js
// =============================================================
const mongoose = require("mongoose");

const studentProfileSchema = new mongoose.Schema({
  program:         { type: String, default: "" },
  lecture_group:   { type: String, default: "" },
  tutorial_group:  { type: String, default: "" },
  practical_group: { type: String, default: "" },
  address:         { type: String, default: "" },
}, { _id: false });

const userSchema = new mongoose.Schema({
  matric_staff_id: { type: String, required: true, unique: true, trim: true },
  password:        { type: String, required: true },
  name:            { type: String, required: true },
  role:            {
    type: String,
    enum: ["student", "admin", "lecturer", "pengarah"],
    required: true,
  },
  email:           { type: String, default: "" },
  phone:           { type: String, default: "" },
  ic_number:       { type: String, default: "" },
  // Student profile embedded directly in user document
  profile: studentProfileSchema,
}, { timestamps: true });

// Remove password from JSON output
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
