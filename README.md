# Hammonia Taxi Shift Planner

A fully client-rendered shift planning web app for taxi fleets, built with **Next.js 15**, **Tailwind CSS**, and hosted on **Firebase Hosting (static)** — all running on the **free tier**.

> 🔗 [Live Site](https://hammonia-taxi-shift-plan-684e7.web.app)

---

## 🚀 Tech Stack

- 🔧 **Next.js** 15 (App Router)
- 🎨 **Tailwind CSS** for styling
- 🔐 **Firebase Auth**
- 📂 **Firestore** for data storage
- 🌐 **Firebase Hosting** (Static Export)

---

## 🏁 Quick Start

```bash
# 1. Clone the static branch
git clone --branch static https://github.com/harrymulalet/hammoniataxishiftplanner.git
cd hammoniataxishiftplanner

# 2. Install dependencies
npm install

# 3. Create your .env.local file and paste your Firebase Web config
touch .env.local
# Paste:
# NEXT_PUBLIC_FIREBASE_API_KEY=...
# NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
# NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
# NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
# NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
# NEXT_PUBLIC_FIREBASE_APP_ID=...

# 4. Build static site
npm run build      # creates ./out

# 5. Link your Firebase project (one time)
firebase login
firebase use --add

# 6. Deploy to Firebase Hosting
npm run deploy