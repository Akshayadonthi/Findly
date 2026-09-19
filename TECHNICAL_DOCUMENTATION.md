# 📘 Findly — Technical Architecture & Full Implementation Documentation

**Findly** is a modern, high-trust Campus and Community Lost & Found Reconnection Platform designed to help users quickly report, discover, match, and recover lost belongings.

---

## 1. 🏗️ Complete Tech Stack & Tools

### **Frontend & UI Layer**
- **Framework**: **Next.js 16.3** (App Router, Turbopack, React 19)
- **Language**: **TypeScript 5** (Strict type safety across 31 routes)
- **Styling**: **Tailwind CSS v4** (`@theme` customized design tokens)
- **UI Components & Icons**: **Lucide React**, Custom UI Design System (`Button`, `Input`, `Select`, `Badge`)
- **Animations**: **Framer Motion 13** (Spring physics, tab transitions, interactive hero matching flow)

### **Authentication Layer**
- **Authentication Engine**: **Firebase Authentication SDK v10** (`firebase/auth`)
- **Google OAuth**: Live **Google Account Picker Popup** (`signInWithPopup`, `GoogleAuthProvider`) connected to Firebase Project `findly-d3171`.
- **Session Management**: Client-side state synchronization in [`lib/auth-context.tsx`](file:///C:/Users/aksha/.gemini/antigravity/scratch/findly/lib/auth-context.tsx) with SSR hydration protection and instant offline fallback.

### **Database & Data Adapter**
- **Primary Backend**: **Supabase** (`@supabase/supabase-js` v2)
- **Resilient Offline-First Adapter**: [`lib/db.ts`](file:///C:/Users/aksha/.gemini/antigravity/scratch/findly/lib/db.ts) (Provides seamless client-side `localStorage` caching & fallback so data and reports are saved and retrieved instantly without network dependency).

### **Geolocation & Distance Filtering**
- **Distance Calculation**: **Haversine Formula** ([`lib/geo.ts`](file:///C:/Users/aksha/.gemini/antigravity/scratch/findly/lib/geo.ts)) for calculating distance between coordinates in kilometers.
- **Browser Geolocation**: HTML5 Geolocation API integration with a 1–50 km radius slider in [`components/items/ItemFilters.tsx`](file:///C:/Users/aksha/.gemini/antigravity/scratch/findly/components/items/ItemFilters.tsx).

### **Validation & Type Safety**
- **Schema Validation**: **Zod v4** ([`lib/validations/item.ts`](file:///C:/Users/aksha/.gemini/antigravity/scratch/findly/lib/validations/item.ts)) for validating title length, image limits, file formats, and dates.

---

## 🎨 2. Design System & Theme Specs

Findly uses **Option 2: Deep Teal + Tangerine (Very Distinctive)**:

| Element | Hex Code | Purpose |
|---|---|---|
| **Primary** | `#087E8B` | Deep Teal — Brand logo, primary buttons, active tabs, header highlights |
| **Accent** | `#FF6B35` | Tangerine — Callouts, feature highlights, special badges |
| **Lost Status** | `#D94F4F` | Warm Red — Lost item tags, active searches |
| **Found Status** | `#3FAE7A` | Jade Green — Recovered item tags, verified matches |
| **Background** | `#F4FAF9` | Soft teal-tinted background applied across all pages |

---

## ⚡ 3. Detailed Core Features Breakdown

### **1. Authentication System**
- **Email & Password**: Sign up & sign in with instant session persistence.
- **Google OAuth**: Clicking **Google** opens the official Google Account Picker window (`accounts.google.com`), authenticating users via Firebase project `findly-d3171` and setting their real Google name, email, and profile avatar.

### **2. Multi-Step Item Reporting Wizard**
- **Form Path**: [`/report/lost`](file:///C:/Users/aksha/.gemini/antigravity/scratch/findly/app/report/lost/page.tsx) and [`/report/found`](file:///C:/Users/aksha/.gemini/antigravity/scratch/findly/app/report/found/page.tsx).
- **Step 1 (Details)**: Title, Category, Description, Color, Brand, Model, Identifying Features.
- **Step 2 (When & Where)**: Date lost/found, Approximate time, City, Area, Specific location.
- **Step 3 (Photos)**: Image upload with instant preview thumbnail generation (up to 5 images).
- **Step 4 (Contact Info)**: Optional Finder Reward (₹) & **WhatsApp Phone Number input**.
- **Step 5 (Review)**: Summary preview card before final submission.

### **3. Dual Communication System**
- **In-App Messaging (`/messages`, `/messages/[id]`)**: Real-time 1-on-1 chat threads created via "Chat In-App" button between users and reporters.
- **Per-Reporter WhatsApp Chat**: Clicking "Chat on WhatsApp" on any item page formats the reporter's phone number (`https://wa.me/<phone_number>`) to launch a direct 1-on-1 WhatsApp chat with that specific reporter.

### **4. Real Feed & Search Engine**
- **Clean Real Data**: `DEMO_ITEMS` emptied in [`lib/demo-data.ts`](file:///C:/Users/aksha/.gemini/antigravity/scratch/findly/lib/demo-data.ts). Feeds on Homepage, `/lost`, and `/found` show **only authentic items** reported by users.
- **Filters**: Search query, Category dropdown, Date filters, City filter, and Haversine Geolocation Distance Slider (1-50 km).

### **5. Social Sharing & In-App Notifications**
- **1-Click Share Modal**: Share items directly to WhatsApp, X (Twitter), Telegram, Facebook, or Copy Link.
- **In-App Notifications**: Notification bell with unread badge count in Navbar, alerting users about claim updates and report resolutions.

---

## 📁 4. Project Sitemap & Key Directory Structure

```text
findly/
├── app/
│   ├── layout.tsx             # Root layout with AuthProvider & Navbar
│   ├── page.tsx               # Homepage with Hero, HowItWorks, Recent Feeds
│   ├── lost/page.tsx          # Browse Lost Items feed
│   ├── found/page.tsx         # Browse Found Items feed
│   ├── report/
│   │   ├── lost/page.tsx      # Report Lost Item page
│   │   └── found/page.tsx     # Report Found Item page
│   ├── item/[id]/page.tsx     # Detailed Item View page with Chat & WhatsApp buttons
│   ├── messages/
│   │   ├── page.tsx           # Messages inbox
│   │   └── [id]/page.tsx      # 1-on-1 conversation chat room
│   ├── login/page.tsx         # Login page with Firebase Google OAuth button
│   ├── signup/page.tsx        # Signup page
│   ├── admin/                 # Admin Dashboard (Analytics, Reports, Users)
│   └── moderator/             # Moderator Portal
├── components/
│   ├── layout/                # Navbar, Footer, Logo
│   ├── home/                  # Hero, HowItWorks, MatchingSection, CTASection
│   ├── items/                 # MultiStepReportForm, ItemGrid, ItemFilters, ShareModal
│   ├── notifications/         # NotificationDrawer
│   └── ui/                    # Button, Input, Select, Badge
├── lib/
│   ├── firebase.ts            # Live Firebase Web SDK configuration
│   ├── supabase.ts            # Supabase JS client configuration
│   ├── auth-context.tsx       # Global AuthContext & Google OAuth handler
│   ├── db.ts                  # Resilient Database Adapter (Supabase + LocalStorage)
│   ├── geo.ts                 # Haversine distance formula & geolocation
│   └── validations/item.ts    # Zod validation schemas
├── types/                     # TypeScript Interfaces (Item, User, Conversation, Message)
├── DEPLOYMENT.md              # Deployment Guide
└── package.json               # Package dependencies
```

---

## 🌐 5. Deployment & Repository Links

- **GitHub Repository**: **[https://github.com/Akshayadonthi/Findly.git](https://github.com/Akshayadonthi/Findly.git)**
- **Firebase Project**: `findly-d3171` (`findly-d3171.firebaseapp.com`)
- **Build Status**: Passed 100% (0 errors across 31 routes)
