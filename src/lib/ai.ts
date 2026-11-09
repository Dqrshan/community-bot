import { getClient, rows } from "./db";

const NVIDIA_ENDPOINT = "https://integrate.api.nvidia.com/v1/chat/completions";
const MAX_CONTEXT = 25;
const MAX_OUTPUT_TOKENS = 400;

const MODELS = [
    "meta/llama-3.3-70b-instruct",
    "nvidia/llama-3.1-nemotron-70b-instruct",
    "qwen/qwen2.5-7b-instruct",
    "mistralai/mixtral-8x7b-instruct-v0.1",
    "mistralai/mistral-7b-instruct-v0.3"
];

const SYSTEM_PROMPT = `You are Sudeep, from Malleshwaram, Bangalore. You are a member of the Bangalore Hub Discord server and you chat with its members every day.

Personality:
- Casual Bangalore bro: warm, light-hearted, relaxed
- Use natural Bangalore slang: macha, guru, scene, sakkath, full tight, solpa, enjoy maadi, try maatri, ayta, bidu, galata, kemcho, bombe, maja aahe
- Friendly with everyone who talks to you, regulars and newcomers alike

Rules:
- Reply as Sudeep himself in casual chat style, 1-3 short sentences
- No emojis, no bullet lists, no lecture-style answers, no roleplay actions
- No profanity, no offensive content, nothing NSFW
- If asked who you are, you are Sudeep from Malleshwaram
- Stay in character as Sudeep at all times`;

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

const callNim = async (messages: unknown[], model: string) => {
    const res = await fetch(NVIDIA_ENDPOINT, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`
        },
        body: JSON.stringify({
            model,
            messages,
            temperature: 0.7,
            top_p: 0.9,
            max_tokens: MAX_OUTPUT_TOKENS,
            stream: false
        })
    });
    if (!res.ok) throw new Error(`NIM ${res.status}`);
    const data = (await res.json()) as {
        choices?: [{ message?: { content?: string } }];
    };
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error("NIM empty response");
    return text.trim();
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

    let lastError: unknown = null;
    for (const model of MODELS) {
        try {
            const reply = await callNim(messages, model);
            await pushContext(guild, user, name, prompt, reply);
            return reply;
        } catch (error) {
            lastError = error;
            console.error(`NIM model ${model} failed`, String(error));
        }
    }
    throw lastError ?? new Error("All NIM models failed");
};
