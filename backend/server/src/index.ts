import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";

import voiceRouter from "./routes/voice";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


app.use("/api/voice", voiceRouter);

app.get("/", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "ArthSaathi API" });
});

app.listen(PORT, () => {
  console.log(`ArthSaathi server running on port ${PORT}`);
});