# Flow

<div align="center">

**An ADHD-friendly task tracker with visual timeline, flexible completion states, and goal planning**

Built with ♥ by MazadiaS

[Features](#features) • [Getting Started](#getting-started) • [Documentation](#documentation) • [Tech Stack](#tech-stack)

</div>

---

## Overview

Flow is a comprehensive productivity application designed with ADHD-friendly principles. It combines task tracking, goal planning, timeline visualization, and student mode to help you stay focused and organized.

## Features

### 🎯 Core Task Management

**Four Task Types:**
- **Duration Tasks**: Timer-based tasks with session tracking and estimated time
- **Count Tasks**: Number-based tasks (e.g., push-ups, water intake)
- **Completion Tasks**: Flexible completion states (Done, Partial, Skipped)
- **Homework Tasks**: Student mode with subjects, due dates, grades, and resources

**Task Organization:**
- ⭐ Priority levels (High, Medium, Low)
- 📊 Importance ratings
- 🔄 Recurring tasks (daily, weekly, monthly, custom patterns)
- 📅 Task scheduling
- 📎 Media attachments (links, images, files)
- 📝 Subtask management with progress tracking
- 🎨 Custom icons and color coding
- 🔗 Goal linking for alignment tracking

### 🎓 Student Mode

Perfect for students managing coursework:
- Subject organization
- Assignment types (reading, writing, problem sets, projects, exam prep)
- Difficulty levels
- Estimated vs actual time tracking
- Grade tracking
- Due date management
- Resource attachments (URLs, files)
- Submission status

### 🗺️ Goal Planning System

**Comprehensive Goal Management:**
- **Goal Hierarchy**: Parent-child goal relationships
- **Mind Map View**: Visual goal exploration with interactive nodes
- **Flowchart Editor**: Create custom goal workflows with rich text
- **Calendar View**: Timeline-based goal planning
- **Table View**: Structured goal data management
- **Progress Tracking**: Link tasks to goals and track contribution
- **AI-Assisted Goal Generation**: Interview-based goal creation

### 📊 Visualization & Analytics

- **Timeline View**: Visual representation of your day's activities
- **Statistics Dashboard**: Comprehensive analytics and trends
- **Archive System**: Historical data with efficiency metrics
- **Day Session Tracking**: Full day productivity analysis
- **Streak Tracking**: Monitor consistency for completion tasks

### 🎨 ADHD-Friendly Design

- Minimal distractions with clean interface
- Clear visual hierarchy
- Smooth animations and satisfying interactions
- Color-coded task types
- Large, tappable buttons
- Fullscreen timer mode for deep focus
- Glassmorphism design with gradient accents

### 💾 Data Management

- **Local Storage**: All data saved locally in browser
- **Gist Sync**: Automatic backup to GitHub Gists
- **Export/Import**: JSON data export and import
- **Privacy First**: No data sent to external servers
- **Offline Support**: Full PWA capabilities

### 🔧 Advanced Features

- **Developer Mode**: Secret gesture activation (click "My Tasks" 7 times)
- **Keyboard Shortcuts**: Quick navigation and actions
- **Browser Notifications**: Timer alerts and reminders
- **PWA Support**: Install as mobile/desktop app
- **Electron Desktop App**: Native macOS/Windows application
- **Responsive Design**: Works on all screen sizes

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Web Application

1. Clone the repository and install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to `http://localhost:5173`

### Desktop Application (Electron)

1. Install dependencies:
```bash
npm install
```

2. Run in development mode:
```bash
npm run dev:electron
```

3. Build for production:
```bash
# macOS
npm run build:mac

# General build
npm run build:electron
```

The built app will be in the `release/` directory.

### PWA Installation

1. Build the application:
```bash
npm run build
```

2. Deploy to a web server (Vercel, Netlify, etc.)

3. On mobile/desktop, visit the site and click "Install App" when prompted

## Documentation

### Quick Start Guide

**Starting Your Day:**
1. Click "START DAY" to begin tracking
2. The day timer starts running at the top
3. All task activities are logged to this session

**Adding Tasks:**
1. Click the "+" button or use `Ctrl+N` (Windows) / `Cmd+N` (Mac)
2. Choose task type (Duration, Count, Completion, Homework)
3. Set priority, estimated time, and other details
4. Add subtasks, media attachments, or link to goals

**Working on Tasks:**
- **Duration Tasks**: Click START to begin timer, STOP to end session
- **Count Tasks**: Enter count value and click LOG IT
- **Completion Tasks**: Choose status (Done, Partial, Skipped)
- **Homework**: Track subject, due date, resources, and submission

**Goal Planning:**
1. Click "Goals" from the navigation
2. Create goal hierarchy or use AI-assisted interview
3. View goals in Mind Map, Flowchart, Calendar, or Table view
4. Link tasks to goals for progress tracking

**Timeline & Statistics:**
- Click "Timeline" to see visual day representation
- Click "Statistics" for analytics and trends
- Click "Archive" to review past days

**Developer Mode:**
- Click "My Tasks" title 7 times quickly
- Access advanced settings and debug tools
- Export/import data
- Configure Gist sync

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + N` | Add new task |
| `Ctrl/Cmd + E` | Export data |
| `Ctrl/Cmd + I` | Import data |
| `Space` | Start/Stop active timer |
| `Esc` | Exit fullscreen timer |
| `1-5` | Switch views (Tasks, Goals, Timeline, Stats, Archive) |
| `/` | Focus search |

### Setting Up Gist Sync

1. Create a GitHub Personal Access Token:
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Generate new token with `gist` scope

2. In Flow, enable Developer Mode (click "My Tasks" 7 times)

3. Navigate to Backup Settings

4. Enter your GitHub token

5. Enable auto-sync

Your data will automatically backup to a private GitHub Gist.

## Tech Stack

- **React 19** - UI framework with concurrent features
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool
- **CSS3** - Glassmorphism and gradient animations
- **LocalStorage** - Client-side data persistence
- **DOMPurify** - XSS protection for user content
- **@xyflow/react** - Interactive flowchart visualization
- **html2canvas & jsPDF** - Export functionality
- **Electron** - Desktop application wrapper
- **PWA (Vite Plugin)** - Progressive web app capabilities

## Project Structure

```
flow/
├── src/
│   ├── components/
│   │   ├── TaskList.tsx           # Main task list view
│   │   ├── TaskDetail.tsx         # Individual task view
│   │   ├── DaySession.tsx         # Day tracking component
│   │   ├── Statistics.tsx         # Analytics dashboard
│   │   ├── TimelineView.tsx       # Visual timeline
│   │   ├── Archive.tsx            # Historical data
│   │   ├── FullscreenTimer.tsx    # Focus mode timer
│   │   ├── Goals/
│   │   │   ├── GoalPlanView.tsx   # Main goal interface
│   │   │   ├── GoalMindMap.tsx    # Mind map visualization
│   │   │   ├── GoalFlowGraph.tsx  # Flowchart editor
│   │   │   ├── GoalCalendar.tsx   # Calendar view
│   │   │   └── GoalTableView.tsx  # Table view
│   │   ├── SubtaskManager.tsx     # Subtask UI
│   │   ├── HomeworkResourceManager.tsx
│   │   ├── BackupSettings.tsx     # Gist sync config
│   │   └── Footer.tsx             # App footer
│   ├── utils/
│   │   ├── storage.ts             # LocalStorage API
│   │   ├── goalStorage.ts         # Goal persistence
│   │   ├── gistSync.ts            # GitHub Gist backup
│   │   ├── timeUtils.ts           # Time formatting
│   │   ├── goalCalculations.ts    # Goal computations
│   │   └── debounce.ts            # Performance utils
│   ├── types/
│   │   ├── goals.ts               # Goal type definitions
│   │   └── types.ts               # Core type definitions
│   ├── context/
│   │   └── AppContext.tsx         # Global state
│   └── App.tsx                    # Main app component
├── electron/
│   └── main.cjs                   # Electron entry point
├── public/                        # Static assets
├── dist/                          # Build output
└── release/                       # Electron builds
```

## Security

Flow implements multiple security measures:
- **DOMPurify** sanitization for all user content
- **Content Security Policy** headers
- **Input validation** on all forms
- **Local-first** architecture (no server data exposure)
- **Optional Gist sync** with encrypted token storage

See [SECURITY.md](SECURITY.md) for full security documentation.

## Deployment

### Vercel (Web App)

```bash
npm install -g vercel
vercel
```

### Netlify (Web App)

```bash
npm run build
# Deploy the `dist` folder
```

### Electron (Desktop)

```bash
# macOS DMG
npm run build:mac

# The .dmg will be in release/
```

See [deployment documentation](docs/DEPLOYMENT.md) for platform-specific guides.

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Contributing

This is a personal project by MazadiaS. Feel free to fork and customize for your own needs!

## License

MIT License - feel free to use and modify

## Credits

Built with ♥ by **MazadiaS**

Designed with ADHD-friendly principles and evidence-based productivity research.

---

<div align="center">

**[⬆ Back to Top](#flow)**

</div>
