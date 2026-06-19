import "dotenv/config";
import express, { type Express } from "express";
import cors from "cors";
import authRouter from "./routes/auth";
import uploadRouter from "./routes/upload";
import diagnosisRouter from "./routes/diagnosis";
import feedbackRouter from "./routes/feedback";
import { requestLogger } from "./middleware/logger";

const app: Express = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/upload", uploadRouter);
app.use("/api/v1/diagnosis", diagnosisRouter);
app.use("/api/v1/feedback", feedbackRouter);

app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
});

export default app;
