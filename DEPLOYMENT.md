# Deployment Guide — CvSU E-Library Management System

## Stack
- **Backend**: Node.js + Express + Sequelize
- **Database**: PostgreSQL (Render) in production / MySQL locally
- **Frontend**: React + Vite → built as static files, served by the backend

---

## Deploy on Render + PostgreSQL

### Step 1 — Create a PostgreSQL Database on Render

1. Go to [render.com](https://render.com) → **New** → **PostgreSQL**
2. Give it a name (e.g. `elibrary-db`)
3. Choose the free plan
4. Click **Create Database**
5. Once created, copy the **Internal Database URL** (starts with `postgresql://`)

---

### Step 2 — Create a Web Service on Render

1. Go to **New** → **Web Service**
2. Connect your GitHub repo: `codebylorence/E-Library-Management-System`
3. Configure:

| Setting | Value |
|---|---|
| **Root Directory** | *(leave blank — use repo root)* |
| **Runtime** | Node |
| **Build Command** | `npm install --prefix back && npm install --prefix front && npm run build --prefix front` |
| **Start Command** | `node back/server.js` |
| **Plan** | Free |

---

### Step 3 — Set Environment Variables

In your Web Service → **Environment** tab, add these:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | *(paste the Internal Database URL from Step 1)* |
| `JWT_SECRET` | *(generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)* |
| `GOOGLE_CLIENT_ID` | *(from Google Cloud Console)* |
| `GOOGLE_CLIENT_SECRET` | *(from Google Cloud Console)* |
| `BACKEND_URL` | `https://your-app-name.onrender.com` |
| `FRONTEND_URL` | `https://your-app-name.onrender.com` |
| `ADMIN_EMAIL` | `cc.gideonpaul.alzaga@cvsu.edu.ph` |
| `ADMIN_NAME` | `Carmona Library Admin` |
| `KIOSK_PIN` | *(your chosen PIN)* |
| `DB_SYNC_ALTER` | `true` *(set to false after first deploy)* |

> **Note**: Do NOT add `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST` — those are only for local MySQL. On Render, `DATABASE_URL` is used instead.

---

### Step 4 — Deploy

1. Click **Create Web Service** — Render will build and deploy automatically
2. Watch the logs. You should see:
   ```
   Database synced ✅ (alter mode)
   Admin account created ✅
   Server running on port 10000
   ```
3. Once deployed successfully, go back to **Environment** and change `DB_SYNC_ALTER` to `false`, then click **Save** (triggers a redeploy)

---

### Step 5 — Update Google OAuth for Production

1. Go to [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials
2. Edit your OAuth 2.0 Client ID
3. Add to **Authorized JavaScript origins**:
   ```
   https://your-app-name.onrender.com
   ```
4. Add to **Authorized redirect URIs**:
   ```
   https://your-app-name.onrender.com/api/users/auth/google/callback
   ```
5. Save

---

### Step 6 — Access Your App

- **App**: `https://your-app-name.onrender.com`
- **Kiosk**: `https://your-app-name.onrender.com/kiosk`
- **Admin login**: Use the `ADMIN_EMAIL` you set, via Google OAuth

---

## Local Development (MySQL)

```bash
# Terminal 1 — Backend
cd back
npm run dev

# Terminal 2 — Frontend  
cd front
npm run dev
```

Frontend: http://localhost:5173  
Backend API: http://localhost:5000  
Kiosk: http://localhost:5173/kiosk

---

## Deployment Checklist

- [ ] PostgreSQL database created on Render
- [ ] `DATABASE_URL` set in Render environment variables
- [ ] `JWT_SECRET` is a strong random string (not `mysecretkey123`)
- [ ] `DB_SYNC_ALTER=true` on first deploy → `false` after
- [ ] Google OAuth redirect URIs updated for production domain
- [ ] `BACKEND_URL` and `FRONTEND_URL` set to your Render URL
- [ ] `KIOSK_PIN` changed from default `1234`
- [ ] `back/.env` is NOT committed to git ✅ (covered by .gitignore)

---

## Generating a Strong JWT Secret

Run this in any terminal with Node.js:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy the output and use it as your `JWT_SECRET`.
