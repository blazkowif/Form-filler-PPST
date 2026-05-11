# MongoDB Atlas Setup Guide
## PPST E-Portal — Replace XAMPP with Free Cloud Database

---

## Why MongoDB Atlas?
- ✅ **100% free** (512MB — more than enough for this project)
- ✅ **No installation** — runs entirely in the cloud
- ✅ Works from anywhere, including Cloudflare Tunnel
- ✅ No XAMPP, no local MySQL needed at all

---

## Step 1 — Create a Free Atlas Account

1. Go to **https://www.mongodb.com/cloud/atlas/register**
2. Sign up with your email (or Google)
3. Choose **"I'm learning MongoDB"** when asked your goal
4. Click **"Try Free"**

---

## Step 2 — Create Your Free Cluster

1. On the Atlas dashboard, click **"Create"** (or "Build a Database")
2. Choose **M0 FREE** tier (it says "Free forever")
3. Provider: **AWS** · Region: **Singapore (ap-southeast-1)** ← closest to Malaysia
4. Cluster name: leave as `Cluster0`
5. Click **"Create Deployment"**

---

## Step 3 — Create a Database User

A popup will appear asking you to create a user:

1. Username: `ppst_admin` (or anything you like)
2. Password: click **"Autogenerate Secure Password"** → **copy this password now**
3. Click **"Create Database User"**

> ⚠️ **Save the password somewhere safe** — you'll need it in the next step.

---

## Step 4 — Allow Your IP Address

1. Still in the popup, scroll down to **"Where would you like to connect from?"**
2. Click **"Add My Current IP Address"**
3. For testing, you can also click **"Allow Access From Anywhere"** (adds `0.0.0.0/0`)  
   - This is fine for development, but restrict it before going to production
4. Click **"Finish and Close"**

---

## Step 5 — Get Your Connection String

1. On the cluster page, click **"Connect"**
2. Choose **"Drivers"**
3. Driver: **Node.js** · Version: **5.5 or later**
4. Copy the connection string — it looks like:
   ```
   mongodb+srv://ppst_admin:<password>@cluster0.abc123.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<password>` with the password you saved in Step 3
6. Add the database name before the `?`:
   ```
   mongodb+srv://ppst_admin:YourPassword@cluster0.abc123.mongodb.net/ppst_eportal?retryWrites=true&w=majority
   ```

---

## Step 6 — Add the Connection String to Your .env

Open `backend/.env` in Notepad and update it:

```env
PORT=5000
NODE_ENV=development

MONGO_URI=mongodb+srv://ppst_admin:YourPassword@cluster0.abc123.mongodb.net/ppst_eportal?retryWrites=true&w=majority

JWT_SECRET=ppst_ums_super_secret_key_2025_change_this
JWT_EXPIRES_IN=8h

FRONTEND_URL=http://localhost:5173

UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=10
```

> Replace the entire `MONGO_URI` line with your actual connection string.

---

## Step 7 — Install Dependencies & Run

```bash
# Inside the backend folder
cd backend

# Install dependencies (mongoose replaces mysql2)
npm install

# Seed the test users
node scripts/seed.js

# Start the server
npm run dev
```

You should see:
```
✅ MongoDB Connected: cluster0.abc123.mongodb.net
🚀 PPST E-Portal Server | Port: 5000
```

---

## Step 8 — Verify in Atlas

1. Go back to Atlas dashboard
2. Click your cluster → **"Browse Collections"**
3. You should see the `ppst_eportal` database with a `users` collection
4. Inside `users` you'll see your 4 test accounts

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `Authentication failed` | Wrong password in MONGO_URI — re-check Step 5 |
| `IP not whitelisted` | Go to Atlas → Security → Network Access → Add your IP |
| `Cannot find module 'mongoose'` | Run `npm install` in the backend folder |
| `ECONNREFUSED` | Your MONGO_URI is still pointing to localhost — it should start with `mongodb+srv://` |

---

## Test Login Credentials

After seeding, use these to log in:

| Role | URL | ID | Password |
|------|-----|----|----------|
| Student | `/login` | BS2024001 | student123 |
| Admin | `/login/staff` | ADMIN001 | admin123 |
| Lecturer | `/login/staff` | LEC001 | lecturer123 |
| Pengarah | `/login/staff` | PEN001 | pengarah123 |

---

## Database Structure (Collections)

MongoDB uses collections instead of tables:

| MySQL Table | MongoDB Collection | Notes |
|-------------|-------------------|-------|
| `users` + `students_profiles` | `users` | Profile is embedded inside the user document |
| `forms_applications` + `form_sick_leave` + `form_appeal_review` | `formapplications` | Form-specific data embedded as sub-documents |

No `schema.sql` needed — MongoDB creates collections automatically when data is inserted.
