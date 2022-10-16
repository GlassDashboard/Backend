import mongoose, { Mongoose } from 'mongoose';

export var mongo: Mongoose;

export async function connect() {
    mongo = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/test');
    console.log('Connected to mongo as database')
}