import { mintOwner, ownerCookie, ownerFrom } from "@/lib/identity";
import { clearChat, clearTurns, forgetTurns, listTurns } from "@/lib/memory";

export async function DELETE(request: Request) {
  const owner = ownerFrom(request);
  if (!owner) return Response.json({ cleared: 0 });

  const params = new URL(request.url).searchParams;
  const chat = params.get("chat");
  const turns = params.get("turn");

  if (turns) {
    return Response.json({ cleared: forgetTurns(owner, turns.split(",").filter(Boolean)) });
  }

  return Response.json({ cleared: chat ? clearChat(owner, chat) : clearTurns(owner) });
}

export async function GET(request: Request) {
  const existing = ownerFrom(request);
  const owner = existing ?? mintOwner();
  const turns = existing ? listTurns(owner) : [];

  const response = Response.json({
    turns: turns.map((turn) => ({
      id: turn.id,
      at: turn.at,
      role: turn.role,
      text: turn.text,
      chat: turn.chat,
    })),
  });

  if (!existing) response.headers.append("set-cookie", ownerCookie(owner));
  return response;
}
