# Slack Leaderboard - ELO Rating System

A modern leaderboard website with an ELO rating system for tracking competitive matches across different games.

## Features

- **User Management**: Add and manage users
- **Game-Specific ELO Rating**: Separate skill ratings for each game
- **Challenge System**: Issue challenges to other players and accept/decline incoming challenges
- **1v1 & 4-Player Matches**: Support for head-to-head and multiplayer games
- **Game Tracking**: Record matches for different games
- **Win/Loss Records**: Complete match history
- **Real-time Notifications**: See pending challenges with badge notifications
- **Beautiful UI**: Modern, responsive design

## Getting Started

### Installation

```bash
npm install
```

### Firebase Setup (Optional but Recommended)

The app works without Firebase but uses in-memory storage (data is lost on restart). For persistent storage:

#### Option 1: Service Account JSON File (Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Go to Project Settings → Service Accounts
4. Click "Generate New Private Key"
5. Save the downloaded JSON file as `firebase-service-account.json` in the project root
6. Create a Firestore database in your Firebase project (Start in production mode or test mode)

#### Option 2: Environment Variables

1. Copy `.env.example` to `.env`
2. Fill in your Firebase credentials from the service account JSON

**Note**: The app will run fine without Firebase - it will just use in-memory storage and show a warning on startup.

### Running the Application

```bash
npm run dev
```

This will start both the backend server (port 3001) and frontend (port 3000).

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

If Firebase is configured, you'll see: ✅ Firebase initialized successfully  
If not: ⚠️ Running without Firebase. Data will not persist between restarts.

## How It Works

### Game-Specific ELO Rating System

Each user has a separate ELO rating for every game they play:
- New players start at 1200 rating for each game
- K-factor of 32 is used for rating updates
- Overall rating is the average of all game-specific ratings
- Rankings can be viewed overall or filtered by specific games

### Challenge System

Players can challenge each other to friendly competition:
1. Select yourself as the challenger
2. Choose an opponent and game
3. Add optional trash talk message
4. Opponent can accept or decline
5. Record the match result when complete

**No authentication needed** - This system is designed for trusted environments (like a team workspace) where everyone knows each other. Simply select your name from the dropdown to act on your behalf.

### API Endpoints

**Users**
- `GET /api/users` - Get all users
- `POST /api/users` - Add a new user
- `GET /api/users/:id` - Get user details with match history

**Matches**
- `GET /api/matches` - Get all matches
- `POST /api/matches` - Record a 1v1 match
- `POST /api/matches/multiplayer` - Record a 4-player match

**Challenges**
- `GET /api/challenges` - Get all challenges
- `POST /api/challenges` - Create a challenge
- `PATCH /api/challenges/:id` - Accept/decline a challenge
- `PATCH /api/challenges/:id/complete` - Mark challenge as completed
- `DELETE /api/challenges/:id` - Delete a challenge

**Games**
- `GET /api/games` - Get list of games
- `POST /api/games` - Add a new game

## Tech Stack

- **Frontend**: React, Vite
- **Backend**: Express.js, Node.js
- **Styling**: Modern CSS with gradients and animations

