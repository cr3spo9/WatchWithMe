# WatchWithMe

Watch YouTube live streams perfectly synchronized with your friends.

## The Problem

When multiple people watch the same YouTube live stream from different locations, they're often out of sync by several seconds. This makes it impossible to react together to the same moments.

## The Solution

WatchWithMe creates synchronized viewing rooms where one person (the host) controls playback, and all viewers automatically sync to the host's timeline using smooth playback speed adjustments.

## Features

- **Room System**: Create or join rooms with a simple 6-character code
- **Perfect Sync**: Viewers automatically sync to host's timeline
- **Smooth Adjustments**: Uses playback speed (not hard seeks) for seamless synchronization
- **Host Controls**: Only the host can play/pause the video
- **Real-time Participants**: See who's in the room
- **Authentication**: Clerk-powered user authentication

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + shadcn/ui |
| Video Player | YouTube IFrame API |
| Real-time | Socket.IO (WebSockets) |
| Backend | Node.js + Express + Socket.IO |
| Auth | Clerk |
| Package Manager | Bun |

## Project Structure

```
watchwithme/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── context/        # React context (RoomContext)
│   │   ├── hooks/          # Custom hooks (useSocket, useYouTubePlayer)
│   │   └── utils/          # Utilities
│   └── ...
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── socket/         # Socket.IO handlers & room management
│   │   └── types/          # TypeScript types
│   └── ...
└── package.json            # Monorepo root
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed
- A [Clerk](https://clerk.com/) account for authentication

### Installation

1. Clone the repository:
```bash
git clone https://github.com/cr3spo9/WatchWithMe.git
cd WatchWithMe
```

2. Install dependencies:
```bash
bun install
```

3. Configure Clerk:
   - Create a Clerk application at [dashboard.clerk.com](https://dashboard.clerk.com)
   - Copy your Publishable Key
   - Create `client/.env`:
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
```

4. Start the development servers:
```bash
bun run dev
```

This starts both the client (http://localhost:5173) and server (http://localhost:3001).

## How It Works

### Synchronization Algorithm

1. **Host** sends their current timestamp every 500ms
2. **Server** broadcasts this to all viewers in the room
3. **Viewers** calculate the difference with their local time:
   - If diff > 5 seconds: seek directly to host's time
   - If diff > 0.3 seconds: adjust playback speed (0.75x - 1.5x)
   - If diff < 0.3 seconds: normal speed (synced!)

### WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `create-room` | Client → Server | Create a new room |
| `join-room` | Client → Server | Join existing room |
| `sync-time` | Client → Server | Host sends current time |
| `sync-update` | Server → Client | Broadcast time to viewers |
| `play-video` | Server → Client | Host pressed play |
| `pause-video` | Server → Client | Host pressed pause |

## Usage

1. **Sign in** with your Clerk account
2. **Create a room** by pasting a YouTube live stream URL
3. **Share the room code** with your friends
4. **Friends join** using the 6-character code
5. **Watch together** in perfect sync!

## License

MIT
