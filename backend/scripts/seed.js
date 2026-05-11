// =============================================================
// scripts/seed.js — Seed test users (MongoDB version)
// Run: node scripts/seed.js
// =============================================================
require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const bcrypt   = require("bcryptjs");
const mongoose = require("mongoose");
const User     = require("../models/User");

const SALT_ROUNDS = 12;

const testUsers = [
  {
    matric_staff_id: "BS2024001",
    password:  "student123",
    name:      "Ahmad Haziq bin Abdullah",
    role:      "student",
    email:     "haziq@ums.edu.my",
    phone:     "0112345678",
    ic_number: "030101080001",
    profile: {
      program:         "Asasi Sains",
      lecture_group:   "A1",
      tutorial_group:  "T1",
      practical_group: "P1",
      address: "Kolej Kediaman A, UMS, 88400 Kota Kinabalu, Sabah",
    },
  },
  {
    matric_staff_id: "ADMIN001",
    password:  "admin123",
    name:      "Siti Noraza binti Mohd Noor",
    role:      "admin",
    email:     "noraza@ums.edu.my",
    phone:     "0198765432",
    ic_number: "850505085001",
  },
  {
    matric_staff_id: "LEC001",
    password:  "lecturer123",
    name:      "Dr. Mohd Azri bin Hassan",
    role:      "lecturer",
    email:     "azri@ums.edu.my",
    phone:     "0187654321",
    ic_number: "780303079001",
  },
  {
    matric_staff_id: "PEN001",
    password:  "pengarah123",
    name:      "Prof. Madya Dr. Faridah binti Osman",
    role:      "pengarah",
    email:     "faridah@ums.edu.my",
    phone:     "0171234567",
    ic_number: "720101072001",
  },
];

const seed = async () => {
  console.log("🔌 Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ MongoDB Connected\n🌱 Seeding users...\n");

  for (const userData of testUsers) {
    const hashed = await bcrypt.hash(userData.password, SALT_ROUNDS);
    await User.findOneAndUpdate(
      { matric_staff_id: userData.matric_staff_id },
      { ...userData, password: hashed },
      { upsert: true, new: true }
    );
    console.log(`  ✅ ${userData.role.toUpperCase().padEnd(9)} | ${userData.matric_staff_id.padEnd(12)} | Pass: ${userData.password}`);
  }

  console.log("\n🎉 Seeding complete!\n");
  console.log("─".repeat(50));
  console.log("Student  → /login       | BS2024001 / student123");
  console.log("Admin    → /login/staff | ADMIN001  / admin123");
  console.log("Lecturer → /login/staff | LEC001    / lecturer123");
  console.log("Pengarah → /login/staff | PEN001    / pengarah123");
  console.log("─".repeat(50));
  await mongoose.disconnect();
  process.exit(0);
};

seed().catch(err => { console.error("❌ Seed failed:", err.message); process.exit(1); });
