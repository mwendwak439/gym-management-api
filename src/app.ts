import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/authRoutes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { config } from "./config";

const app = express();

// Security & parsing middleware
app.use(helmet());
app.use(cors({ origin: config.cors.origin }));
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/auth", authRoutes);

// 404 for unknown routes
app.use(notFoundHandler);

// Error handler (must be LAST)
app.use(errorHandler);

export default app;