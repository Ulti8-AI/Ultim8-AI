import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!process.env.OPENAI_API_KEY) {
  console.error("\nMissing OPENAI_API_KEY.");
  console.error("Create a .env file using .env.example and add your API key.\n");
  process.exit(1);
}

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(__dirname));

const BASE = `You are Ultim8 AI, the assistant inside a general-purpose AI workspace.
Be helpful, clear, accurate and practical. Never pretend an action was completed when it was not.
Ultim8 has Chat, Create, Images, Music, Finance Diary, Library, Schedule, Projects, Plugins,
Codex and Personalizations. Adapt to the selected personalization mode.
For code requests, provide usable code and explain important decisions.
For creative requests, be imaginative but useful.`;

const taskInstructions = {
  chat: "Answer the user's request naturally. Preserve useful conversation context.",
  create: "Act as a product and creation assistant. Turn the idea into a concrete, useful output. If code is appropriate, include it.",
  code: "Act as an expert programming assistant. Return complete, runnable code when appropriate, with concise setup notes.",
  music: "Create a detailed music concept including style, mood, instrumentation, structure and production direction. Do not claim to have produced audio unless an audio service is actually connected."
};

function cleanHistory(history) {
  if (!Array.isArray(history)) return [];
  return history.slice(-20).filter(x =>
    x && (x.role === "user" || x.role === "assistant") &&
    typeof x.content === "string"
  ).map(x => ({ role: x.role, content: x.content.slice(0, 12000) }));
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, app: "Ultim8 AI", model: process.env.TEXT_MODEL || "gpt-5.6-luna" });
});

app.post("/api/ai", async (req, res) => {
  try {
    const { task = "chat", message, history = [], mode = "General" } = req.body || {};
    if (!message || typeof message !== "string") {
      return res.status(400).json({ success: false, error: "Message is required." });
    }

    const model = process.env.TEXT_MODEL || "gpt-5.6-luna";
    const modeText = mode && mode !== "General"
      ? `The current personalization mode is "${mode}". Adapt your response accordingly.`
      : "The current mode is General.";

    const response = await client.responses.create({
      model,
      instructions: `${BASE}\n\n${taskInstructions[task] || taskInstructions.chat}\n${modeText}`,
      input: [
        ...cleanHistory(history),
        { role: "user", content: message.trim().slice(0, 12000) }
      ],
      max_output_tokens: 5000
    });

    res.json({ success: true, output: response.output_text || "No response was returned." });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: "The AI request failed. Check your API key, model name and account access."
    });
  }
});

app.post("/api/image", async (req, res) => {
  try {
    const { prompt, style = "", size = "1024x1024" } = req.body || {};
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ success: false, error: "Image prompt is required." });
    }

    const model = process.env.IMAGE_MODEL || "gpt-image-2";
    const finalPrompt = style ? `${prompt}\nVisual style: ${style}` : prompt;

    const result = await client.images.generate({
      model,
      prompt: finalPrompt.slice(0, 10000),
      size
    });

    const item = result.data?.[0];
    if (!item?.b64_json) {
      throw new Error("The image API did not return image data.");
    }

    res.json({ success: true, image: `data:image/png;base64,${item.b64_json}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: "Image generation failed. Check that your image model/account is available."
    });
  }
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`\nUltim8 AI is running at http://localhost:${PORT}`);
  console.log(`Text model: ${process.env.TEXT_MODEL || "gpt-5.6-luna"}`);
  console.log(`Image model: ${process.env.IMAGE_MODEL || "gpt-image-2"}\n`);
});