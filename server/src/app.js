import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { CORS_ORIGIN } from "./config.js";
import healthRouter from "./routes/health.js";
import { notFound, errorHandler } from "./middleware/error.js";
import authRouter from "./routes/auth.js";
import journalRouter from "./routes/journal.js";
import moonRouter from "./routes/moon.js";
import tarotRouter from "./routes/tarot.js";

const app = express();

// Security & parsers
app.use(helmet());
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// CORS: allow comma-separated origins in env
const allowList = (CORS_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // curl or same-origin
      if (allowList.length === 0 || allowList.includes(origin))
        return cb(null, true);
      return cb(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

// Routes
app.use("/health", healthRouter);
app.use("/auth", authRouter);
app.use("/journal", journalRouter);
app.use("/moon", moonRouter);
app.use("/tarot", tarotRouter);

// 404 + errors
app.use(notFound);
app.use(errorHandler);

export default app;
