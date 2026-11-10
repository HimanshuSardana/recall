const MODELS = [
  { id: "astra-max", name: "Astra Max" },
  { id: "astra-mini", name: "Astra Mini" },
  { id: "kraken-1.5", name: "Kraken 1.5" },
];

export async function GET() {
  return Response.json({
    object: "list",
    data: MODELS.map(({ id, name }) => ({
      id,
      object: "model",
      created: 0,
      owned_by: "kraken",
      name,
    })),
  });
}
