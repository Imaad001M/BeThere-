import { quoteSchema, quote } from "@/lib/pricing";
export async function POST(req: Request) {
  try {
    const raw = await req.text();
    if (raw.length > 4000)
      return Response.json({ error: "Request too large." }, { status: 413 });
    const input = quoteSchema.safeParse(JSON.parse(raw));
    if (!input.success)
      return Response.json(
        { error: input.error.issues[0].message },
        { status: 400 },
      );
    return Response.json(quote(input.data), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json(
      { error: "Please send a valid quote request." },
      { status: 400 },
    );
  }
}
