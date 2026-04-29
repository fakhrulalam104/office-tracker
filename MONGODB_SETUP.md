# Office Tracker with MongoDB

Your app is now set up to use MongoDB for data storage! Here's how to get it running:

## Setup Instructions

### 1. Install Backend Dependencies

```bash
cd server
npm install
```

### 2. Start the Backend Server

From the `server` directory:

```bash
npm run dev
```

You should see: `✓ Connected to MongoDB` and `✓ Server running on http://localhost:5000`

### 3. In a New Terminal, Start the Frontend

From the root directory:

```bash
npm run dev
```

### 4. Open Your App

Navigate to `http://localhost:5173` (or the port shown by Vite)

## How It Works

- **Backend**: Express server at `http://localhost:5000` connects to MongoDB and provides APIs for CRUD operations
- **Frontend**: React app fetches/updates data from the backend instead of using localStorage
- **Database**: All data is stored in MongoDB under `office-tracker` database

## MongoDB Connection

Your connection string is configured in `server/.env`:

```
mongodb+srv://fakhrul:fakhrulPassword@cluster0.argkeuo.mongodb.net/office-tracker
```

## API Endpoints

- `GET /api/logs` - Get all logs
- `GET /api/logs/:date` - Get a single log by date
- `POST /api/logs/:date` - Create/update a log
- `DELETE /api/logs/:date` - Delete a log

## Important Notes

⚠️ **Security**: The `.env` file contains your MongoDB password. **DO NOT** commit this to git!

Add to `.gitignore`:

```
server/.env
.env
node_modules
```

## Troubleshooting

- **"Cannot connect to MongoDB"**: Check that your internet is stable and MongoDB Atlas cluster is active
- **"Port 5000 already in use"**: Change PORT in `server/.env` or kill the process using that port
- **CORS errors**: Make sure the backend is running before starting the frontend
