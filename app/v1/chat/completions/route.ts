import { resolveModel } from "@/lib/models";
import { webSearch } from "@/lib/search";

type ChatMessage = { role: string; content: unknown };

type ChatRequest = {
  model?: string;
  messages?: ChatMessage[];
  stream?: unknown;
  session_id?: string;
  tools?: unknown;
};

type ToolCall = { id: string; name: string; arguments: string };

const BASE_URL = process.env.OPENAI_BASE_URL?.replace(/\/+$/, "");
const API_KEY = process.env.OPENAI_API_KEY;

const FINAL_NUDGE =
  "Searching is done. Answer the original question now, in prose, using the results above. Do not call any tool.";

type ToolEvent = {
  name: string;
  query: string;
  results: number;
  sources: { title: string; url: string }[];
};

const WEB_SEARCH = {
  type: "function",
  function: {
    name: "web_search",
    description:
      "Search the public web. Use it for anything after your training cutoff, current events, prices, releases, or facts you are not sure about. Returns titles, URLs and snippets. Search once, twice only if the results are unusable, then answer with what you have.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "The search query, phrased like a search engine query." },
      },
      required: ["query"],
      additionalProperties: false,
    },
  },
};

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

function sseHeaders() {
  return {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
  };
}

/** Forwards deltas to the client while collecting any tool call the model asks for. */
async function relay(
  body: ReadableStream<Uint8Array>,
  emit: (delta: object) => void,
): Promise<{ content: string; calls: ToolCall[] }> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  const calls = new Map<number, ToolCall>();
  let buffer = "";
  let content = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const event of events) {
      const line = event.trim();
      if (!line.startsWith("data:")) continue;

      const payload = line.slice(5).trim();
      if (payload === "[DONE]") continue;

      let chunk: {
        choices?: {
          delta?: {
            content?: string | null;
            tool_calls?: {
              index?: number;
              id?: string;
              function?: { name?: string; arguments?: string };
            }[];
          };
        }[];
      };

      try {
        chunk = JSON.parse(payload);
      } catch {
        continue;
      }

      const delta = chunk.choices?.[0]?.delta;
      if (!delta) continue;

      if (delta.tool_calls?.length) {
        for (const call of delta.tool_calls) {
          const index = call.index ?? 0;
          const entry = calls.get(index) ?? { id: "", name: "", arguments: "" };
          if (call.id) entry.id = call.id;
          if (call.function?.name) entry.name = call.function.name;
          if (call.function?.arguments) entry.arguments += call.function.arguments;
          calls.set(index, entry);
        }
        continue;
      }

      if (typeof delta.content === "string" && delta.content) {
        content += delta.content;
      }

      emit(delta);
    }
  }

  return { content, calls: [...calls.values()].filter((call) => call.name) };
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
  const history: ChatMessage[] = body.messages;

  if (!BASE_URL || !API_KEY) {
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
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(chunk({ role: "assistant", content: "" }))}\n\n`),
        );
        for (const token of tokens) {
          await new Promise((resolve) => setTimeout(resolve, 18));
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk({ content: token }))}\n\n`));
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk({}, "stop"))}\n\n`));
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new Response(stream, { headers: sseHeaders() });
  }

  const upstreamHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${API_KEY}`,
    "x-opencode-session": body.session_id || crypto.randomUUID(),
  };

  // A client that brings its own tools is proxied untouched; we only drive the
  // loop for the tool we advertise.
  if (body.tools) {
    const upstream = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      cache: "no-store",
      headers: upstreamHeaders,
      body: JSON.stringify({ ...body, model }),
    });

    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        "Content-Type":
          upstream.headers.get("content-type") ?? "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  }

  if (body.stream === false) {
    // Non-streaming callers get the loop run to completion, then one JSON reply.
    const messages: unknown[] = [...history];
    let answer = "";

    for (let round = 0; round < 3; round += 1) {
      const upstream = await fetch(`${BASE_URL}/chat/completions`, {
        method: "POST",
        cache: "no-store",
        headers: upstreamHeaders,
        body: JSON.stringify({ ...body, model, stream: false, messages, tools: [WEB_SEARCH] }),
      });

      if (!upstream.ok) {
        return new Response(await upstream.text(), {
          status: upstream.status,
          headers: { "Content-Type": upstream.headers.get("content-type") ?? "application/json" },
        });
      }

      const payload = (await upstream.json()) as {
        choices?: {
          message?: {
            content?: string | null;
            tool_calls?: { id: string; function?: { name?: string; arguments?: string } }[];
          };
        }[];
      };
      const message = payload.choices?.[0]?.message;
      const calls = (message?.tool_calls ?? [])
        .filter((call) => call.function?.name === "web_search")
        .map((call) => ({
          id: call.id,
          name: "web_search",
          arguments: call.function?.arguments ?? "{}",
        }));

      if (calls.length === 0) {
        answer = message?.content ?? "";
        break;
      }

      messages.push({ role: "assistant", content: message?.content ?? null, tool_calls: message?.tool_calls });
      const { messages: toolMessages } = await runToolCalls(calls);
      messages.push(...toolMessages);
    }

    if (!answer) {
      // Out of rounds while still asking to search. The tool stays advertised:
      // withholding it makes this model emit raw tool-call syntax as text, so a
      // nudge turn is what actually ends the loop.
      messages.push({ role: "user", content: FINAL_NUDGE });

      const upstream = await fetch(`${BASE_URL}/chat/completions`, {
        method: "POST",
        cache: "no-store",
        headers: upstreamHeaders,
        body: JSON.stringify({
          ...body,
          model,
          stream: false,
          messages,
          tools: [WEB_SEARCH],
          tool_choice: "auto",
        }),
      });

      if (upstream.ok) {
        const payload = (await upstream.json()) as {
          choices?: { message?: { content?: string | null } }[];
        };
        answer = payload.choices?.[0]?.message?.content ?? "";
      }
    }

    return Response.json({
      id: `chatcmpl-${crypto.randomUUID().replaceAll("-", "").slice(0, 24)}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model,
      choices: [{ index: 0, message: { role: "assistant", content: answer }, finish_reason: "stop" }],
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    });
  }

  const encoder = new TextEncoder();
  const id = `chatcmpl-${crypto.randomUUID().replaceAll("-", "").slice(0, 24)}`;
  const created = Math.floor(Date.now() / 1000);

  const relayStream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (payload: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      const chunk = (delta: object, finishReason: string | null = null) => ({
        id,
        object: "chat.completion.chunk",
        created,
        model,
        choices: [{ index: 0, delta, finish_reason: finishReason }],
      });

      const messages: unknown[] = [...history];
      let started = false;
      let answered = false;

      for (let round = 0; round < 3; round += 1) {
        const upstream = await fetch(`${BASE_URL}/chat/completions`, {
          method: "POST",
          cache: "no-store",
          headers: upstreamHeaders,
          body: JSON.stringify({
            ...body,
            model,
            messages,
            stream: true,
            tools: [WEB_SEARCH],
            tool_choice: "auto",
          }),
        });

        if (!upstream.ok || !upstream.body) {
          send(
            chunk({
              content: `The provider rejected the request (${upstream.status}).`,
            }),
          );
          break;
        }

        if (!started) {
          send(chunk({ role: "assistant", content: "" }));
          started = true;
        }

        const { content, calls } = await relay(upstream.body, (delta) => send(chunk(delta)));

        if (calls.length === 0) {
          answered = true;
          break;
        }

        // The model's preamble and the next round's answer would otherwise
        // arrive glued together.
        if (content.trim()) send(chunk({ content: "\n\n" }));

        messages.push({
          role: "assistant",
          content: content || null,
          tool_calls: calls.map((call) => ({
            id: call.id,
            type: "function",
            function: { name: call.name, arguments: call.arguments },
          })),
        });

        const { messages: toolMessages, events } = await runToolCalls(calls);
        messages.push(...toolMessages);

        for (const event of events) {
          send({
            id,
            object: "chat.completion.chunk",
            created,
            model,
            choices: [{ index: 0, delta: {}, finish_reason: null }],
            kraken: { tool: event },
          });
        }

        answered = false;
      }

      if (!answered) {
        messages.push({ role: "user", content: FINAL_NUDGE });

        const last = await fetch(`${BASE_URL}/chat/completions`, {
          method: "POST",
          cache: "no-store",
          headers: upstreamHeaders,
          body: JSON.stringify({
            ...body,
            model,
            messages,
            stream: true,
            tools: [WEB_SEARCH],
            tool_choice: "auto",
          }),
        });

        if (last.ok && last.body) {
          await relay(last.body, (delta) => send(chunk(delta)));
        }
      }

      send(chunk({}, "stop"));
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(relayStream, { headers: sseHeaders() });
}

async function runToolCalls(calls: ToolCall[]) {
  const messages: { role: "tool"; tool_call_id: string; content: string }[] = [];
  const events: ToolEvent[] = [];

  for (const call of calls) {
    let payload: unknown;
    let query = "";

    try {
      const args = JSON.parse(call.arguments) as { query?: unknown };
      query = typeof args.query === "string" ? args.query : "";
      payload = { results: await webSearch(query) };
    } catch (error) {
      payload = { error: error instanceof Error ? error.message : "Search failed." };
    }

    const found = (payload as { results?: { title?: string; url?: string }[] }).results ?? [];

    events.push({
      name: call.name,
      query,
      results: found.length,
      sources: found.slice(0, 4).map((source) => ({
        title: source.title ?? "",
        url: source.url ?? "",
      })),
    });

    messages.push({
      role: "tool",
      tool_call_id: call.id,
      content: JSON.stringify(payload),
    });
  }

  return { messages, events };
}
