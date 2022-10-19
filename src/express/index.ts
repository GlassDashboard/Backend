// Initialize express, load in middleware, routes, and handle the rest api
import express from 'express';
export const app = express()

// Implement security middleware
import helmet from 'helmet';
app.use(helmet());

import ratelimit from './middleware/ratelimit';
app.use(ratelimit(300, '2m', false, ['/panel/']));

import cors from 'cors';
app.use(cors({ origin: process.env.CORS_URL, credentials: true }));

// Attach express server
import { createServer } from '../http'
createServer(app)

// Start routing express
import { router as v1Router } from './api/v1'
export function start() {
    console.log('Starting Express Web Server...')
    app.use('/v1', v1Router)
}