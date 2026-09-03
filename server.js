import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ========================================
// HUGGING FACE CONFIGURATION
// ========================================

const HF_TOKEN = process.env.HF_TOKEN;

if (!HF_TOKEN) {
  console.error("ERROR: HF_TOKEN is missing.");
  console.error("Add HF_TOKEN in your OneBit Environment settings.");
  process.exit(1);
}

const MODEL =
  process.env.TEXT_MODEL ||
  "Qwen/Qwen3-4B-Instruct-2507";

const HF_URL =
  "https://router.huggingface.co/v1/chat/completions";

// ========================================
// SERVER CONFIGURATION
// ========================================

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.static(__dirname));

// ========================================
// ULTIM8 AI PERSONALITY
// ========================================

const SYSTEM_PROMPT = `
You are Ultim8 AI, an intelligent assistant inside the Ultim8 AI workspace.

Be helpful, clear, accurate, friendly and practical.

Ultim8 AI contains:

- Chat
- Create
- Images
- Music
- Finance Diary
- Library
- Schedule
- Projects
- Plugins
- Codex
- Personalizations

Never claim that you completed an action when you did not actually complete it.

For programming questions:
Give useful, working code and explain important parts clearly.

For app, website and game creation:
Help turn the user's idea into a practical project.

For creative requests:
Be imaginative and useful.

For music requests:
Help with concepts, genres, moods, instrumentation,
song structure and production ideas.

Keep answers appropriate for the user.
`;

// ========================================
// TASK MODES
// ========================================

const TASK_PROMPTS = {
  chat: `
Answer the user's request naturally.
Use previous conversation context when useful.
`,

  create: `
Act as a creation assistant.
Turn the user's idea into a concrete and useful result.
Provide code when appropriate.
`,

  code: `
Act as an expert programming assistant.
Provide complete, runnable code when appropriate.
Help identify and fix programming errors.
`,

  music: `
Act as a music creation assistant.
Create useful concepts involving genre, mood,
instrumentation, structure and production direction.
`
};

// ========================================
// CLEAN CHAT HISTORY
// ========================================

function cleanHistory(history) {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .slice(-20)
    .filter((item) => {
      return (
        item &&
        (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string"
      );
    })
    .map((item) => ({
      role: item.role,
      content: item.content.slice(0, 12000)
    }));
}

// ========================================
// HEALTH CHECK
// ========================================

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    app: "Ultim8 AI",
    provider: "Hugging Face",
    model: MODEL
  });
});

// ========================================
// AI CHAT
// ========================================

app.post("/api/ai", async (req, res) => {
  try {
    const {
      message,
      history = [],
      task = "chat",
      mode = "General"
    } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        success: false,
        error: "Message is required."
      });
    }

    const modePrompt =
      mode && mode !== "General"
        ? `
The user's current personalization mode is "${mode}".
Adapt your response to this mode.
`
        : `
The user's current mode is General.
`;

    const messages = [
      {
        role: "system",
        content: `
${SYSTEM_PROMPT}

${TASK_PROMPTS[task] || TASK_PROMPTS.chat}

${modePrompt}
`
      },

      ...cleanHistory(history),

      {
        role: "user",
        content: message.trim().slice(0, 12000)
      }
    ];

    const response = await fetch(HF_URL, {
      method: "POST",

      headers: {
        "Authorization": `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        model: MODEL,
        messages: messages,
        max_tokens: 4000,
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Hugging Face API error:", data);

      return res.status(500).json({
        success: false,
        error:
          data?.error ||
          "Hugging Face could not process the request."
      });
    }

    const output =
      data?.choices?.[0]?.message?.content;

    if (!output) {
      console.error("Unexpected response:", data);

      return res.status(500).json({
        success: false,
        error: "The AI returned an empty response."
      });
    }

    res.json({
      success: true,
      output: output
    });

  } catch (error) {
    console.error("Server error:", error);

    res.status(500).json({
      success: false,
      error: "Ultim8 AI could not connect to the AI service."
    });
  }
});

// ========================================
// IMAGE ENDPOINT
// ========================================

app.post("/api/image", async (_req, res) => {
  res.status(501).json({
    success: false,
    error: "Image generation is not connected yet."
  });
});

// ========================================
// WEBSITE FALLBACK
// ========================================

app.use((_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ========================================
// START SERVER
// ========================================

app.listen(PORT, () => {
  console.log("====================================");
  console.log("             ULTIM8 AI");
  console.log("====================================");
  console.log("Server started successfully.");
  console.log("Provider: Hugging Face");
  console.log("Model: " + MODEL);
  console.log("Port: " + PORT);
  console.log("====================================");
});
