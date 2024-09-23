import mongoose from 'mongoose';

let isConnected = false;

export async function connectDB(){
    if (isConnected) {
        return;
    }
    isConnected = true;
    await mongoose.connect(process.env.MONGODB_URL ?? '');
    return;
}