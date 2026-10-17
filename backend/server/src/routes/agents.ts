import { Router, type Request, type Response } from "express";

const router = Router();

const getAgentBase = () => {
  let base = (process.env.AGENT_API_URL || "http://127.0.0.1:8000").trim().replace(/\/$/, "");
  if (!base.startsWith("http://") && !base.startsWith("https://")) {
    base = `https://${base}`;
  }
  return base;
};
const AGENT_BASE = getAgentBase();

router.use(async (req: Request, res: Response) => {
  const suffix = req.originalUrl.replace(/^\/api\/agents/, "") || "/";
  const path = suffix.startsWith("/") ? suffix : `/${suffix}`;
  const target = `${AGENT_BASE}${path}`;

  try {
    const method = req.method.toUpperCase();
    const hasBody = method !== "GET" && method !== "HEAD";
    const init: RequestInit = { method };
    if (hasBody) {
      init.headers = { "content-type": "application/json" };
      init.body = JSON.stringify(req.body ?? {});
    }
    const upstream = await fetch(target, init);

    const text = await upstream.text();
    const contentType = upstream.headers.get("content-type");
    if (contentType) {
      res.setHeader("content-type", contentType);
    }
    res.status(upstream.status).send(text);
  } catch (error) {
    res.status(502).json({
      error: "Agent service unreachable.",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
