import { connection } from "next/server";

const FALLBACK = [
  { id: "astra-max", name: "Astra Max" },
  { id: "astra-mini", name: "Astra Mini" },
  { id: "kraken-1.5", name: "Kraken 1.5" },
];

const BASE_URL = process.env.OPENAI_BASE_URL?.replace(/\/+$/, "");
const API_KEY = process.env.OPENAI_API_KEY;

export async function GET() {
  await connection();

  if (BASE_URL && API_KEY) {
    try {
      const upstream = await fetch(`${BASE_URL}/models`, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${API_KEY}` },
      });

      if (upstream.ok) {
        const payload = await upstream.json();
        const models = (payload.data ?? [])
          .filter((model: { id?: unknown }) => typeof model.id === "string")
          .map((model: { id: string; name?: string; created?: number; owned_by?: string }) => ({
            id: model.id,
            object: "model",
            created: model.created ?? 0,
            owned_by: model.owned_by ?? "provider",
            name: model.name ?? model.id,
          }));

        if (models.length > 0) {
          return Response.json({ object: "list", data: models });
        }
      }
    } catch {
      // Fall through to the local list so the picker is never empty.
    }
  }

  return Response.json({
    object: "list",
    data: FALLBACK.map(({ id, name }) => ({
      id,
      object: "model",
      created: 0,
      owned_by: "kraken",
      name,
    })),
  });
}
