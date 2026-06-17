import "dotenv/config";
import express, { type Express } from "express";
import cors from "cors";
import authRouter from "./routes/auth";

const app: Express = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/v1/auth", authRouter);

app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
});

export default app;
