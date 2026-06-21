import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is missing")
}
let cached = (global as any).mongoose;

if (!cached) {
    cached = (global as any).mongoose = {conn: null, promise: null};

}


async function connectDB() {
    if (cached.conn) {
       return cached.conn; 
    }

    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI, {

        }).then((mongoose) => {
            return mongoose;
        });
    }

     try {
        cached.conn = await cached.promise;
    } catch (error) {
        cached.promise = null;   // allow the next call to attempt a fresh connection
        throw error;
    }
    return cached.conn;
}

export { connectDB };