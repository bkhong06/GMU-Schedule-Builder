# Firebase Setup Guide for GMU Schedule Planner

## Step 1: Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Click "Add project"
3. Enter project name: "gmu-schedule-planner"
4. Accept the terms and create project
5. Wait for project to initialize

## Step 2: Create Firestore Database

1. In Firebase console, go to "Firestore Database"
2. Click "Create database"
3. Start in test mode (for development)
4. Choose US multi-region (or your preferred location)
5. Click "Enable"

## Step 3: Get Firebase Configuration

1. In Firebase console, go to Project Settings (gear icon)
2. Scroll to "Your apps" section
3. Click on "Web" icon to register a web app
4. Copy the Firebase config object

## Step 4: Create .env File

Create a `.env` file in the project root with your Firebase config:

```
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=gmu-schedule-planner.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=gmu-schedule-planner
VITE_FIREBASE_STORAGE_BUCKET=gmu-schedule-planner.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

## Step 5: Install Dependencies & Run

```bash
npm install
npm run dev
```

## Step 6: Add Sample Data (Optional)

In the admin panel, add a test course:

- Code: IT 104
- Title: Introduction to Computing
- CRN: 12345
- Professor: Dr. Smith
- Schedule: M W 10:00 AM - 11:30 AM
- Location: Innovation Hall 201
- Campus: Fairfax
- Credits: 3
- Modality: In-Person
- Seats: 50
- Available: 45

## Step 7: Test the App

1. Go to http://localhost:3000
2. Search for courses
3. Click "Add" to add to schedule
4. Switch to "Admin" tab
5. Add a new course via the form

## Firestore Security Rules (Development)

In Firestore, go to "Rules" and paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /courses/{document=**} {
      allow read, write: if true;
    }
  }
}
```

**Important**: Use proper authentication for production!

## Troubleshooting

**"VITE_FIREBASE_* is not defined"**
- Make sure .env file exists and variables are set
- Restart the dev server after changing .env

**"Firebase not initialized"**
- Check that all environment variables are correct
- Verify API key is enabled in Google Cloud Console

**"Permission denied" in Firestore**
- Update your Firestore security rules
- Make sure you're in test mode for development

**Courses not showing**
- Verify courses collection exists in Firestore
- Check browser console (F12) for errors
- Make sure documents have all required fields
