import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_, res) => res.json({ ok: true }));

app.post("/tstw-generate", async (req, res) => {
  try {
    const { day, theme, language = "en" } = req.body || {};
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) return res.status(500).json({ ok: false, error: "Missing OPENAI_API_KEY" });

    const prompt = `
Return ONLY JSON with keys:
top_text, middle_text, bottom_text, caption, hashtags.
Rules:
- Structure: problem → hope → action
- Video length 6–9 seconds
- bottom_text MUST end with: "Join the mission → @t.s.t.w.7"
Day: ${day || ""}
Theme: ${theme || ""}
Language: ${language}
`;

    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: prompt,
        response_format: { type: "json_object" }
      })
    });

    if (!r.ok) {
      const t = await r.text();
      return res.status(500).json({ ok: false, error: "OpenAI error", details: t });
    }

    const data = await r.json();
    const text = data.output_text || "{}";

    let out;
    try { out = JSON.parse(text); }
    catch { out = { raw: text }; }

    res.json({ ok: true, ...out });
  } catch (e) {
    res.status(500).json({ ok: false, error: "Server error", details: String(e) });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("AI backend running on", port));
