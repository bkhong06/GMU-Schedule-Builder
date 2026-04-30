# Quick Start Guide

## 1️⃣ Prerequisites

Make sure you have:
- Node.js 16+ installed
- A Firebase account (free at firebase.google.com)
- A code editor (VS Code recommended)

## 2️⃣ Clone/Extract Project

Your project is ready in `/home/ea/Downloads/full code/`

## 3️⃣ Install Dependencies

```bash
cd "/home/ea/Downloads/full code"
npm install
```

This installs React, Vite, Firebase, and other dependencies.

## 4️⃣ Set Up Firebase

1. **Create Project**
   - Go to https://console.firebase.google.com/
   - Click "Add Project"
   - Name it "gmu-schedule-planner"
   - Proceed through the setup

2. **Create Firestore Database**
   - Click "Firestore Database" in Firebase console
   - Click "Create Database"
   - Choose "Start in test mode"
   - Select your region (e.g., us-central1)
   - Click "Enable"

3. **Get Credentials**
   - Go to Project Settings (gear icon)
   - Find "Web" app section
   - Copy your Firebase config

## 5️⃣ Configure Environment

Create a file named `.env` in the project root:

```
VITE_FIREBASE_API_KEY=YOUR_API_KEY_HERE
VITE_FIREBASE_AUTH_DOMAIN=YOUR_PROJECT.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET=YOUR_PROJECT.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_ID
VITE_FIREBASE_APP_ID=YOUR_APP_ID
```

## 6️⃣ Run the App

```bash
npm run dev
```

The app will open at `http://localhost:3000`

## 7️⃣ First Time Setup

1. **Go to Admin Panel** - Click "Admin" in the header
2. **Add a Test Course** - Fill the form and click "Add Course"
3. **Go to Schedule** - Click "Schedule" to see your courses
4. **Search & Filter** - Try different search terms
5. **Add to Schedule** - Click "Add" on a course

## 📱 Main Features

### Schedule Tab
- View courses in calendar grid
- See current time indicator
- Click courses to remove them
- Track total credits

### My Courses Tab
- Table view of all scheduled courses
- Color-coded by course
- Campus location badges
- Online course indicators

### Admin Tab
- Add new courses
- Edit existing courses
- Delete courses
- Real-time updates to Firebase

### Search & Filter
- Search by course code
- Filter by campus
- Filter by modality (In-Person/Online/Hybrid)
- Sort by code, professor, or time

## 🚀 Build for Production

```bash
npm run build
```

Creates an optimized version in the `dist` folder.

## 📚 File Structure

```
src/
├── components/        # React components
├── firebase.ts        # Firebase config
├── types.ts          # TypeScript types
├── utils.ts          # Helper functions
├── styles.css        # Global CSS
└── main.tsx          # App entry point
```

## 🔧 Common Tasks

**Add a new course via admin panel:**
1. Click Admin
2. Fill in course details
3. Click "Add Course"
4. Verify in Firebase console

**Search for courses:**
1. Type in the search box
2. Results filter in real-time

**View your schedule:**
1. Add courses from the sidebar
2. Click "Calendar" tab to see grid view
3. Click "My Courses" tab to see table

**Print your schedule:**
1. Schedule → Print button (browser print)

## ⚠️ Important

- `.env` file contains sensitive keys - never commit to public repos
- Test mode Firestore rules are for development only
- Use proper authentication for production
- See `FIREBASE_SETUP.md` for detailed Firebase setup

## 🆘 Help

**Courses not showing?**
- Check `.env` variables are correct
- Verify Firestore collection `courses` exists
- Open browser console (F12) to see errors

**Build fails?**
- Delete `node_modules` folder
- Run `npm install` again
- Make sure Node.js is 16+

**Questions?**
- Check README.md for detailed docs
- See FIREBASE_SETUP.md for Firebase help
- Review browser console for error messages

---

**You're all set! Start with `npm run dev` and enjoy building your schedule planner!** 🎉
