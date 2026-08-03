
## Cyber-Simulation Training Platform

SENTRI is a comprehensive web-based training platform designed to educate K-12 students on critical cybersecurity concepts through interactive modules and realistic scenarios. The platform features adaptive learning paths, progress tracking, and role-based access control to create an engaging and effective learning experience.

### Key Features

- **Interactive Training Modules**: Hands-on exercises covering topics like password security, phishing detection, and safe browsing.
- **Realistic Simulation Environment**: Browser-based scenarios that mimic real-world cyber threats.
- **Gamified Learning**:
  - **Points & Badges**: Earn rewards for completing lessons and challenges.
  - **Leaderboards**: Track progress against peers and classrooms.
  - **Streaks**: Maintain daily engagement with progress tracking.
- **Content Management System (CMS)**:
  - **Role-Based Editing**: Teachers and administrators can create and edit lessons, quizzes, and scenarios.
  - **Multi-Format Content**: Support for video lessons, text content, interactive quizzes, and branching scenarios.
- **Progress Tracking**: Detailed analytics for students, teachers, and administrators to monitor learning progress.
- **User Management**: Secure authentication and role management for students, teachers, and administrators.

### Getting Started

#### Prerequisites

- **Node.js** 18.x or higher
- **npm** 9.x or higher
- **Firebase CLI**: `npm install -g firebase-tools`

#### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd SENTRI
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

#### Running Locally

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Run Firebase emulators (optional):
   ```bash
   firebase emulators:start
   ```

3. Build for production:
   ```bash
   npm run build
   ```

4. Deploy to Firebase Hosting:
   ```bash
   firebase deploy
   ```

#### Scheduled analytics

`scheduledAnalyticsAggregation` recomputes every analytics aggregate
(six modules, the whole-cohort rollup, and one rollup per section in use)
nightly at 02:00 Asia/Manila, so the admin dashboard is never staler than
a day without anyone clicking Refresh.

It is deployed by `firebase deploy --only functions` like any other
function, but the first deploy also needs the **Cloud Scheduler API**
enabled on the project (Firebase prompts for this, or enable it in the
Google Cloud console). Cloud Scheduler is billed per job beyond the free
tier's three, and this is one job.

Nothing depends on the schedule having run — every aggregate is still
recomputable on demand from the Analytics page, and the scheduled run and
the manual "Refresh All" share the same code path.

### Project Structure

The codebase follows a modular architecture:

- `src/features`: Contains feature-specific components, hooks, and services.
  - `auth`: Authentication flows.
  - `learning`: Core learning components (quizzes, scenarios).
  - `admin`: Administrative tools and content management.
  - `student`: Student-facing interfaces.
- `src/components`: Reusable UI components.
- `src/contexts`: Shared React contexts.
- `src/hooks`: Custom React hooks.
- `src/services`: API and Firebase services.
- `src/styles`: Global styles and themes.
- `src/pages`: Page components.

### Tech Stack

- **Frontend**: React, Vite, CSS Modules
- **State Management**: React Context API, Redux Toolkit (in some modules)
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Styling**: Tailwind CSS (in some modules), CSS Modules

### License