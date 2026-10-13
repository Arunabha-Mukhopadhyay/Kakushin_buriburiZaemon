import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";

import voiceRouter from "./routes/voice";
import agentsRouter from "./routes/agents";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json());

app.use("/api/voice", voiceRouter);
app.use("/api/agents", agentsRouter);

app.get("/", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "FinMate API", port: PORT });
});

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`FinMate server running on port ${PORT}`);
  });
}

export default app;