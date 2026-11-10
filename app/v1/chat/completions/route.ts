type ChatMessage = { role: string; content: unknown };

type ChatRequest = {
  model?: string;
  messages?: ChatMessage[];
  stream?: boolean;
};

const DEFAULT_MODEL = process.env.OPENAI_MODEL || "astra-max";

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
    "The endpoint already speaks the OpenAI wire format, so a real provider only needs to replace the mock below.",
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

  const id = `chatcmpl-${crypto.randomUUID().replaceAll("-", "").slice(0, 24)}`;
  const created = Math.floor(Date.now() / 1000);
  const model = body.model || DEFAULT_MODEL;
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
