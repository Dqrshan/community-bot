import { getClient, rows } from "./db";

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const GROQ_CHAT_URL = `${GROQ_BASE_URL}/chat/completions`;
const MODEL = "allam-2-7b";
const MAX_CONTEXT = 25;
const MAX_OUTPUT_TOKENS = 120;

const SYSTEM_PROMPT = `You are Sudeep, from Malleshwaram, Bangalore. You are a member of the Bangalore Hub Discord server and you chat with its members every day.

Personality:
- Casual Bangalore bro: warm, light-hearted, relaxed
- Use natural Bangalore slang: macha, guru, scene, sakkath, full tight, solpa, enjoy maadi, try maatri, ayta, bidu, galata, kemcho, bombe, maja aahe
- Friendly with everyone who talks to you, regulars and newcomers alike

Limits:
- Keep every reply short: 1-3 short sentences, simple conversation only
- Long, detailed or lecture-style answers are not wanted
- No emojis, no bullet lists, no markdown, no roleplay actions
- Never mention or ping anyone: no user mentions, no role mentions, no @everyone or @here. Channel links like <#123> are fine

Server knowledge (share only when relevant, and keep it brief):
- Want to know more about the server? Head over to <#1075735310736035900>
- Need to reach staff about an inquiry? Open a ticket at <#1031159883673911336>
- Want to suggest a feature? Use the "+suggest" command in <#1513518749356003479>
- Want a message highlighted on starboard? It is at <#1031246196565614633> and needs 3+ star reactions

Rules:
- Reply as Sudeep himself in casual chat style
- No profanity, no offensive content, nothing NSFW
- If asked who you are, you are Sudeep from Malleshwaram
- Stay in character as Sudeep at all times`;

// Belt-and-braces: strip any mention syntax the model still produces.
// Channel links (<#id>) are deliberately kept so the knowledge base works.
const sanitizeReply = (text: string) =>
    text
        .replace(/<@[!&]?\d+>/g, "")
        .replace(/@(everyone|here)\b/gi, "$1")
        .replace(/\s+([,.!?])/g, "$1")
        .replace(/[ \t]{2,}/g, " ")
        .replace(/ *\n */g, "\n")
        .trim();

type Turn = {
    name: string;
    role: "user" | "assistant";
    content: string;
};

type ContextRow = {
    guild: string;
    user: string;
    messages: string;
    timestamp: number;
};

export const getContext = async (guild: string, user: string) => {
    const db = await getClient();
    const row = rows<ContextRow>(await db.execute({
        sql: "SELECT messages FROM ai_context_data WHERE guild = ? AND user = ?",
        args: [guild, user]
    }))[0];
    if (!row) return [];
    try {
        return JSON.parse(row.messages) as Turn[];
    } catch {
        return [];
    }
};

export const pushContext = async (
    guild: string,
    user: string,
    name: string,
    content: string,
    reply: string
) => {
    const db = await getClient();
    const history = await getContext(guild, user);
    history.push(
        { name, role: "user", content },
        { name: "Sudeep", role: "assistant", content: reply }
    );
    const trimmed = history.slice(-MAX_CONTEXT);
    await db.execute({
        sql: `INSERT INTO ai_context_data (guild, user, messages, timestamp)
              VALUES (?, ?, ?, ?)
              ON CONFLICT (guild, user) DO UPDATE SET
                  messages = excluded.messages,
                  timestamp = excluded.timestamp`,
        args: [guild, user, JSON.stringify(trimmed), Date.now()]
    });
};

const callGroq = async (messages: unknown[]) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY is not configured");
    const res = await fetch(GROQ_CHAT_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: MODEL,
            messages,
            temperature: 0.7,
            top_p: 0.9,
            max_tokens: MAX_OUTPUT_TOKENS,
            stream: false
        })
    });
    if (!res.ok) throw new Error(`Groq ${res.status}`);
    const data = (await res.json()) as {
        choices?: [{ message?: { content?: string } }];
    };
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error("Groq empty response");
    const cleaned = sanitizeReply(text);
    if (!cleaned) throw new Error("Groq empty response");
    return cleaned;
};

export const chatAsSudeep = async (
    guild: string,
    user: string,
    name: string,
    prompt: string
) => {
    const context = await getContext(guild, user);
    const messages: unknown[] = [
        { role: "system", content: SYSTEM_PROMPT },
        ...context,
        { role: "user", name, content: prompt }
    ];

    const reply = await callGroq(messages);
    await pushContext(guild, user, name, prompt, reply);
    return reply;
};

export const askAI = async (prompt: string) => {
    return callGroq([
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt }
    ]);
};
