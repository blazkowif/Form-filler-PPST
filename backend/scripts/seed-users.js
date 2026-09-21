// =============================================================
// scripts/seed-users.js — 10 dummy users per role
// Run: node scripts/seed-users.js
// =============================================================
require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const SALT_ROUNDS = 12;

// ── Passwords (case-sensitive — what users will type to log in) ──
const PASSWORDS = {
  student:  "Student123!",
  admin:     "123",
  lecturer:  "123",
  pengarah:  "123",
};

// ── Student 4-course pools ────────────────────────────────────────────
const COURSE_POOLS = [
  ["PST11101", "PST11102", "PST11201", "PST11301"],
  ["PST11101", "PST11102", "PST11201", "PST11301"],
  ["PST11101", "PST11103", "PST11202", "PST11301"],
  ["PST11102", "PST11104", "PST11201", "PST11302"],
  ["PST11101", "PST11102", "PST11104", "PST11301"],
  ["PST11103", "PST11102", "PST11202", "PST11302"],
  ["PST11101", "PST11104", "PST11201", "PST11301"],
  ["PST11102", "PST11103", "PST11202", "PST11302"],
  ["PST11101", "PST11102", "PST11201", "PST11301"],
  ["PST11103", "PST11104", "PST11202", "PST11302"],
];

// ── Lecturer subjects ─────────────────────────────────────────────────
const LEC_SUBJECTS = [
  ["PST11101", "PST11102"],
  ["PST11102", "PST11201"],
  ["PST11103", "PST11202"],
  ["PST11101", "PST11301"],
  ["PST11102", "PST11104"],
  ["PST11201", "PST11302"],
  ["PST11103", "PST11102"],
  ["PST11104", "PST11202"],
  ["PST11101", "PST11201"],
  ["PST11103", "PST11302"],
];

const PROGRAMS = [
  "Asasi Sains","Asasi Sains","Asasi Kejuruteraan","Asasi Sains",
  "Asasi Kejuruteraan","Asasi Sains","Asasi Kejuruteraan",
  "Asasi Sains","Asasi Kejuruteraan","Asasi Sains",
];

const DEPARTMENTS = [
  "Sains Komputer","Matematik","Fizik","Kimia","Biologi",
  "Kejuruteraan Elektrik","Kejuruteraan Mekanikal",
  "Sains Komputer","Matematik","Fizik",
];

const NAMES = {
  student: [
    "Ahmad Haziq bin Abdullah","Muhammad Firdaus bin Kamal",
    "Nur Aisyah binti Rahman","Siti Nurhaliza binti Abu",
    "Mohd Afif bin Yusof","Fatin Nabila binti Omar",
    "Amirul Zafran bin Haris","Jaslina binti Jalil",
    "Iskandar Zulkarnain bin Said","Raihanah binti Rahim",
  ],
  admin: [
    "Siti Noraza binti Mohd Noor","Wan Mohd Fadzli bin Kamaruz",
    "Noraini binti Ismail","Ahmad Fauzi bin Hassan",
    "Rohana binti Zakaria","Zulhelmi bin Awang",
    "Farah Liana binti Ghazali","Hafizuddin bin Lee",
    "Mariana binti Talib","Rashid bin Muhammad",
  ],
  lecturer: [
    "Dr. Mohd Azri bin Hassan","Prof. Madya Dr. Siti Hawa binti Ismail",
    "Dr. Lim Kiat Meng","Dr. Nurul Atiqah binti Khalid",
    "Ts. Muhammad Ridhwan bin Rahim","Dr. Sabrina binti Amran",
    "Dr. Tan Wee Keat","Dr. Fazira binti Osman",
    "Dr. Karim bin Salleh","Dr. Liew Yoke Kuen",
  ],
  pengarah: [
    "Prof. Madya Dr. Faridah binti Osman","Prof. Dr. Ahmad Kamil bin Hassan",
    "Assoc. Prof. Dr. Suresh a/l Krishnan","Prof. Dr. Zalina binti Zainal",
    "Dr. Mohamad Khairi bin Hashim","Prof. Madya Dr. Wong Mei Ling",
    "Dr. Ramli bin Adam","Prof. Dr. Jeffry Jaji",
    "Dr. Laila binti Nawawi","Prof. Dr. Shahrulizam bin Shamsuddin",
  ],
};

function makeId(role, i) {
  if (role==="student")  return `BS2024${String(i+1).padStart(3,"0")}`;
  if (role==="admin")    return `ADMIN${String(i+1).padStart(3,"0")}`;
  if (role==="lecturer") return `LEC${String(i+1).padStart(3,"0")}`;
  return `PEN${String(i+1).padStart(3,"0")}`;
}

const User = require("../models/User");

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log(`✅ Connected: ${mongoose.connection.host}\n🌱 Seeding users...\n`);

  let total = 0;
  for (const role of ["student","admin","lecturer","pengarah"]) {
    console.log(`── ${role.toUpperCase().padEnd(9)} ─────────────────`);
    for (let i = 0; i < 10; i++) {
      const id        = makeId(role, i);
      const hashed    = await bcrypt.hash(PASSWORDS[role], SALT_ROUNDS);
      const firstName = NAMES[role][i].split(" ")[0].toLowerCase();
      const email     = `${firstName}${i}@ums.edu.my`;
      const phone     = `01${String(2345678+i*111111).slice(0,8)}`;
      const ic        = `${84+i}0101${String(10000+i).padStart(5,"0")}`;

      let profile = null;
      if (role === "student") {
        profile = {
          program:         PROGRAMS[i],
          lecture_group:   `L${i+1}`,
          tutorial_group:  `T${i+1}`,
          practical_group: `P${i+1}`,
          address:         `Kolej Kediaman ${String.fromCharCode(65+i)}, UMS, 88400 Kota Kinabalu`,
          courses:         COURSE_POOLS[i],
        };
      } else if (role === "lecturer") {
        profile = {
          department: DEPARTMENTS[i],
          subjects:   LEC_SUBJECTS[i],
        };
      }

      await User.findOneAndUpdate(
        { matric_staff_id: id },
        {
          matric_staff_id: id,
          password: hashed,
          name:     NAMES[role][i],
          role,
          email,
          phone,
          ic_number: ic,
          profile,
        },
        { upsert: true, new: true }
      );
      console.log(`  ✓ ${role.padEnd(9)} | ${id.padEnd(12)} | Pass: ${PASSWORDS[role]}`);
      total++;
    }
    console.log("");
  }

  console.log("─".repeat(65));
  console.log(`✅ ${total} users seeded!\n📋 Credentials (case-sensitive):`);
  console.log("  Students  → /login        | BS2024001…BS2024010  | Student123!");
  console.log("  Admin     → /login/staff  | ADMIN001…ADMIN010    | 123");
  console.log("  Lecturer  → /login/staff  | LEC001…LEC010        | 123");
  console.log("  Pengarah  → /login/staff  | PEN001…PEN010        | 123");
  console.log("─".repeat(65));
  await mongoose.disconnect();
}

seed().catch((err) => { console.error("❌ Seed failed:", err); process.exit(1); });
