# GMU Schedule Planner

A modern, full-featured course schedule planner built with React, Vite, and Firebase. Includes an admin panel for managing courses dynamically.

## Features

- ✅ **Dynamic Course Management**: Add, edit, and delete courses via admin panel
- ✅ **Calendar View**: Visualize your schedule with a weekly calendar grid
- ✅ **List View**: See all scheduled courses in table format
- ✅ **Advanced Filtering**: Filter by campus, modality, and search
- ✅ **Firebase Integration**: All data synced with Firestore
- ✅ **Credit Tracking**: Monitor total credits with warnings over 18
- ✅ **Conflict Detection**: Prevents scheduling conflicts
- ✅ **Responsive Design**: Works on desktop and tablets
- ✅ **Real-time Updates**: Live time indicator on calendar

## Project Structure

```
src/
├── components/
│   ├── App.tsx                  # Main app component with routing
│   ├── Header.tsx               # Header with branding
│   ├── Sidebar.tsx              # Course list and search
│   ├── CourseCard.tsx           # Individual course card
│   ├── FilterDropdown.tsx       # Filter options
│   ├── MainContent.tsx          # Tab container
│   ├── ScheduleCalendar.tsx     # Calendar grid view
│   ├── CourseListView.tsx       # Table view
│   ├── CourseModal.tsx          # Course details modal
│   └── AdminPanel.tsx           # Admin CRUD interface
├── firebase.ts                  # Firebase configuration
├── types.ts                     # TypeScript interfaces
├── utils.ts                     # Helper functions
├── styles.css                   # Global styles
└── main.tsx                     # React entry point
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Firestore Database
4. Set database rules to allow read/write (for development)
5. Get your Firebase config from Project Settings

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Set Up Firestore

Create a `courses` collection in Firestore with the following structure:

```
Collection: courses
Document fields:
- code: string (e.g., "IT 104")
- title: string
- crn: string
- professor: string
- schedule: string (e.g., "M W 10:00 AM - 11:30 AM" or "Online")
- location: string
- campus: string ("Fairfax" | "Arlington" | "Science and Tech" | "Online")
- credits: number
- modality: string ("In-Person" | "Online" | "Hybrid")
- seats: number
- seatsAvailable: number
- color: string (hex color)
- description?: string
- prerequisites?: string
- corequisites?: string
```

### 5. Run Development Server

```bash
npm run dev
```

The app will open at `http://localhost:3000`

## Usage

### For Students

1. **Browse Courses**: Search and filter courses in the left sidebar
2. **View Details**: Click the menu icon on any course to see full details
3. **Add to Schedule**: Click "Add" to add a course
4. **View Calendar**: See your schedule in the calendar tab
5. **View List**: See all courses in table format in the "My Courses" tab
6. **Remove Course**: Click a course event or use the remove button in list view

### For Admins

1. Click the **Admin** button in the header
2. **Add Course**: Fill in the form at the top and click "Add Course"
3. **Edit Course**: Click "Edit" on any course row
4. **Delete Course**: Click "Delete" on any course row
5. All changes are saved automatically to Firebase

## Firebase Firestore Rules (Development)

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

**Note**: Use proper authentication and security rules for production.

## Build for Production

```bash
npm run build
```

This creates an optimized build in the `dist` folder.

## Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **Firebase** - Backend and database
- **Firestore** - NoSQL database
- **CSS3** - Styling

## Key Features Explained

### Calendar Grid
- 30-minute time slots (6 AM - 11 PM)
- Color-coded courses
- Click to remove courses
- Real-time current time indicator

### Admin Panel
- Full CRUD operations
- Dynamic form validation
- Table view of all courses
- In-line edit/delete actions

### Filtering System
- Search by code, title, professor
- Filter by campus and modality
- Real-time result updates
- Sort by code, professor, or time

### Credit Tracking
- Automatic credit calculation
- Warning when exceeding 18 credits
- Visual indicator in list view

## Sample Course Data

If Firebase is not configured, the app loads sample courses automatically:

```typescript
- IT 104: Introduction to Computing
- IT 213: Multimedia and Web Design
- ECON 103: Contemporary Microeconomic Principles
```

## Troubleshooting

**Firebase not connecting?**
- Check that `.env` file has correct credentials
- Verify Firestore database is created
- Check browser console for error messages

**Courses not appearing?**
- Ensure `courses` collection exists in Firestore
- Check that documents have required fields
- Refresh the page

**Admin panel not working?**
- Verify you have write permissions in Firestore
- Check browser console for errors
- Ensure Firebase is initialized correctly

## Future Enhancements

- [ ] User authentication
- [ ] Save schedules per user
- [ ] Email notifications
- [ ] PDF export
- [ ] Mobile app version
- [ ] Course reviews/ratings
- [ ] Prerequisite validation

## License

MIT

## Support

For issues or questions, check the Firebase documentation or create an issue in the project repository.
