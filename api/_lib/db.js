/**
 * MongoDB connection helper para Vercel Functions.
 *
 * En serverless cada invocación arranca desde cero, pero Node reutiliza
 * el proceso entre invocaciones si están cerca en el tiempo ("warm").
 * Cacheamos la conexión en `global` para reusarla mientras el proceso vive.
 *
 * Basado en: https://vercel.com/guides/using-databases-with-vercel
 */
import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  throw new Error('MONGO_URI no está configurada. Configurala en Vercel → Settings → Environment Variables');
}

// Cache global — sobrevive entre invocaciones del mismo container
let cached = global.__mongoose;
if (!cached) {
  cached = global.__mongoose = { conn: null, promise: null };
}

export async function connectMongo() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGO_URI, {
      // En serverless queremos conexiones rápidas
      serverSelectionTimeoutMS: 5000,
      // maxPoolSize bajo — cada function tiene su propio pool
      maxPoolSize: 5,
      // Evitar buffering (queremos errores rápidos si no conecta)
      bufferCommands: false,
    }).then(m => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
