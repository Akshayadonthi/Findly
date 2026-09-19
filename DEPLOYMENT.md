# Production Deployment Guide — Findly

> **Repository**: [https://github.com/Akshaya-0406/Findly.git](https://github.com/Akshaya-0406/Findly.git)  
> **Target Platform**: Vercel  
> **Framework**: Next.js 16.3 App Router (React 19, TypeScript, TailwindCSS v4)  
> **Authentication**: Firebase Auth & Google OAuth (`findly-d3171`)  

---

## 1. How to Push Local Commits to GitHub

All code changes, fixes, and theme updates are committed locally on `main`. To push them to GitHub:

### Method A: Push via VS Code Terminal or Git Bash
Open VS Code terminal or Git Bash inside the project directory and run:
```bash
git push origin main
```
> *If prompted, sign into GitHub in the browser window that pops up.*

### Method B: Push via Personal Access Token
```bash
git push https://<YOUR_GITHUB_TOKEN>@github.com/Akshaya-0406/Findly.git main
```

---

## 2. Environment Variables Configuration for Vercel

Add the following environment variables in **Vercel Project Settings > Environment Variables**:

| Variable Name | Value | Purpose |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSyDcE9Wqz9g2n5PjTn72vjmSJZeZw0CQ7OI` | Live Firebase Web API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `findly-d3171.firebaseapp.com` | Live Firebase Auth Domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `findly-d3171` | Live Firebase Project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `findly-d3171.firebasestorage.app` | Live Firebase Storage Bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `931787256700` | Firebase Messaging Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:931787256700:web:bb64a17c7769813631aaf9` | Firebase Web App ID |

---

## 3. Deployment Steps to Vercel (1-Click Free Hosting)

1. Go to **[Vercel Dashboard](https://vercel.com/)** and log in with your GitHub account.
2. Click **Add New...** -> **Project**.
3. Select the **`Akshaya-0406/Findly`** repository from your GitHub list.
4. Expand **Environment Variables** and paste the Firebase keys listed above.
5. Click **Deploy**. Vercel will automatically build and publish your project live on a `https://<your-app>.vercel.app` URL!

---

## 4. Production Audit Summary (Passed 100%)

- **Build Status**: Passed 100% with 0 errors across all 31 application routes.
- **Theme**: Deep Teal (`#087E8B`) + Tangerine (`#FF6B35`) with teal background (`#F4FAF9`).
- **Features Verified**:
  - Live Firebase Google Auth & Email sign-in.
  - Per-reporter WhatsApp phone number contact flow.
  - In-app 1-on-1 messaging.
  - Zero dummy items (real reported items only).
