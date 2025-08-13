import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { CORS_ORIGIN } from './config.js';
import healthRouter from './routes/health.js';
import { notFound, errorHandler } from './middleware/error.js';
import authRouter from './routes/auth.js';

const app = express();

// Security & parsers
app.use(helmet());
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/health', healthRouter);
app.use('/auth', authRouter);

// 404 + errors
app.use(notFound);
app.use(errorHandler);

export default app;
