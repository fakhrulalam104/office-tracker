import mongoose from 'mongoose';
import { OfficeLog } from '../../server/models/OfficeLog.js';

const MONGODB_URI = process.env.MONGODB_URI;

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then(mongoose => {
      return mongoose;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    await connectDB();
    const { date } = req.query;

    if (req.method === 'GET') {
      const log = await OfficeLog.findOne({ date });
      res.status(200).json(log || null);
    } else if (req.method === 'POST') {
      const { entry } = req.body;
      const log = await OfficeLog.findOneAndUpdate(
        { date },
        { date, entry },
        { upsert: true, new: true }
      );
      res.status(200).json(log);
    } else if (req.method === 'DELETE') {
      await OfficeLog.deleteOne({ date });
      res.status(200).json({ success: true });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
