import { Router, Request, Response } from "express";

const router = Router();

/**
 * GET /api/voice/token
 *
 * Generates a short-lived signed URL for the ElevenLabs Conversational AI agent.
 * The frontend uses this URL to open a WebSocket connection directly with ElevenLabs.
 * The API key never leaves the server — only the signed URL is sent to the client.
 *
 * Called by: React frontend before starting a voice conversation.
 */
router.get("/token", async (_req: Request, res: Response) => {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID;

  if (!apiKey || !agentId) {
    res.status(500).json({
      error: "ElevenLabs credentials not configured on server.",
    });
    return;
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
      {
        method: "GET",
        headers: {
          "xi-api-key": apiKey,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs signed URL error:", errorText);
      res.status(response.status).json({
        error: "Failed to get signed URL from ElevenLabs.",
        details: errorText,
      });
      return;
    }

    const data = (await response.json()) as { signed_url: string };

    res.json({ signed_url: data.signed_url });
  } catch (err) {
    console.error("Voice token endpoint error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
