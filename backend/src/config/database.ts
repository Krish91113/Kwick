import mongoose from 'mongoose';
import { env } from './env';

export async function connectDatabase(uri = env.MONGODB_URI): Promise<void> {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  try {
    // Mask credentials for safe logging
    const maskedUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@');
    console.log(`Connecting to MongoDB at ${maskedUri}...`);

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: env.NODE_ENV !== 'production'
    });

    console.log('Successfully connected to MongoDB.');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error instanceof Error ? error.message : error);
    if (env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('MongoDB connection closed.');
  }
}

export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
