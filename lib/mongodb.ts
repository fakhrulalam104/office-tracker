import mongoose from "mongoose";
import { authDebug, authDebugError } from "@/lib/auth-debug";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  authDebug("mongodb.env-missing", {
    hasMongoUri: false
  });
  throw new Error("Missing MONGODB_URI environment variable");
}

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached = global.mongooseCache ?? { conn: null, promise: null };

if (process.env.NODE_ENV !== "production") {
  global.mongooseCache = cached;
}

export async function connectToDatabase() {
  if (cached.conn) {
    authDebug("mongodb.cache-hit", {
      readyState: cached.conn.connection.readyState,
      dbName: cached.conn.connection.name
    });
    return cached.conn;
  }

  if (!cached.promise) {
    const uri = MONGODB_URI as string;
    authDebug("mongodb.connect-start", {
      hasMongoUri: Boolean(uri),
      nodeEnv: process.env.NODE_ENV
    });
    cached.promise = mongoose.connect(uri, {
      dbName: "office-tracker"
    });
  } else {
    authDebug("mongodb.promise-reuse");
  }

  try {
    cached.conn = await cached.promise;
    authDebug("mongodb.connect-success", {
      readyState: cached.conn.connection.readyState,
      dbName: cached.conn.connection.name,
      host: cached.conn.connection.host
    });
  } catch (error) {
    cached.promise = null;
    authDebugError("mongodb.connect-error", error);
    throw error;
  }

  return cached.conn;
}
