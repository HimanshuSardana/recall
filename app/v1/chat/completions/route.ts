import { resolveModel } from "@/lib/models";

type ChatMessage = { role: string; content: unknown };

type ChatRequest = {
  model?: string;
  messages?: ChatMessage[];
  stream?: boolean;
  session_id?: string;
};

const BASE_URL = process.env.OPENAI_BASE_URL?.replace(/\/+$/, "");
const API_KEY = process.env.OPENAI_API_KEY;

function invalid(message: string) {
  return Response.json(
    { error: { message, type: "invalid_request_error", param: null, code: null } },
    { status: 400 },
  );
}

function mockReply(messages: ChatMessage[]) {
  const lastUser = [...messages]
    .reverse()
    .find((message) => message.role === "user" && typeof message.content === "string");

  const said = typeof lastUser?.content === "string" ? lastUser.content.trim() : "";
  const gist = said.length > 140 ? `${said.slice(0, 140)}…` : said;

  return [
    "This is a mock reply, no model is wired up yet.",
    gist ? `You said: "${gist}".` : "I could not find a question in that request.",
    "Set OPENAI_API_KEY and OPENAI_BASE_URL to talk to a real provider.",
  ].join(" ");
}

export async function POST(request: Request) {
  let body: ChatRequest;
  try {
    body = await request.json();
  } catch {
    return invalid("Request body must be JSON.");
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return invalid("`messages` must be a non-empty array.");
  }

  const model = resolveModel(body.model);

  if (BASE_URL && API_KEY) {
    // A provider is configured, so this is a thin proxy: the upstream response
    // is passed through untouched, which keeps SSE framing and error shapes.
    const upstream = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
        "x-opencode-session": body.session_id || crypto.randomUUID(),
      },
      body: JSON.stringify({ ...body, model }),
    });

    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  }

  const id = `chatcmpl-${crypto.randomUUID().replaceAll("-", "").slice(0, 24)}`;
  const created = Math.floor(Date.now() / 1000);
  const reply = mockReply(body.messages);

  if (body.stream === false) {
    return Response.json({
      id,
      object: "chat.completion",
      created,
      model,
      choices: [
        { index: 0, message: { role: "assistant", content: reply }, finish_reason: "stop" },
      ],
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    });
  }

  const encoder = new TextEncoder();
  const tokens = reply.match(/\S+\s*/g) ?? [];

  const stream = new ReadableStream({
    async start(controller) {
      const chunk = (delta: object, finishReason: string | null = null) => ({
        id,
        object: "chat.completion.chunk",
        created,
        model,
        choices: [{ index: 0, delta, finish_reason: finishReason }],
      });

      controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk({ role: "assistant", content: "" }))}\n\n`));

      for (const token of tokens) {
        await new Promise((resolve) => setTimeout(resolve, 18));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk({ content: token }))}\n\n`));
      }

      controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk({}, "stop"))}\n\n`));
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
