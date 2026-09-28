import { getChatGPTUser } from "@/app/chatgpt-auth";
import { requestDb } from "@/db/requests";
import { requestSchema, quote } from "@/lib/pricing";
const noStore = { "Cache-Control": "no-store" };
export async function POST(req: Request) {
  const user = await getChatGPTUser();
  if (!user)
    return Response.json(
      { error: "Sign in to save your demo request." },
      { status: 401, headers: noStore },
    );
  if (
    req.headers.get("origin") &&
    req.headers.get("origin") !== new URL(req.url).origin
  )
    return Response.json(
      { error: "Please submit from BeThere." },
      { status: 403 },
    );
  let data;
  try {
    const raw = await req.text();
    if (raw.length > 16000)
      return Response.json(
        { error: "Please shorten your request." },
        { status: 413 },
      );
    const result = requestSchema.safeParse(JSON.parse(raw));
    if (!result.success)
      return Response.json(
        { error: result.error.issues[0].message },
        { status: 400 },
      );
    data = result.data;
  } catch {
    return Response.json(
      { error: "Please send a valid request." },
      { status: 400 },
    );
  }
  try {
    const { requestId, selection, details } = data;
    const priced = quote(selection);
    const payload = JSON.stringify({ selection, details });
    const createdAt = new Date().toISOString();
    const db = requestDb();
    await db
      .prepare(
        "INSERT INTO demo_requests (id,owner_id,payload,total_cents,representative_cents,created_at,status) VALUES (?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING",
      )
      .bind(
        requestId,
        user.userId,
        payload,
        priced.total,
        priced.representative,
        createdAt,
        "demo_request",
      )
      .run();
    const row = await db
      .prepare(
        "SELECT id,payload,total_cents,representative_cents,created_at,status FROM demo_requests WHERE id=? AND owner_id=?",
      )
      .bind(requestId, user.userId)
      .first<{
        id: string;
        payload: string;
        total_cents: number;
        representative_cents: number;
        created_at: string;
        status: string;
      }>();
    if (!row || row.payload !== payload)
      return Response.json(
        {
          error:
            "This request reference was already used. Start a new request.",
        },
        { status: 409 },
      );
    return Response.json(
      {
        id: row.id,
        ...JSON.parse(row.payload),
        quote: priced,
        status: row.status,
        createdAt: row.created_at,
      },
      { status: 201, headers: noStore },
    );
  } catch (error) {
    console.error(
      "Demo request save failed",
      error instanceof Error ? error.message : "unknown",
    );
    return Response.json(
      {
        error:
          "We couldn’t save your request. Your details are still here; please try again.",
      },
      { status: 503, headers: noStore },
    );
  }
}
export async function GET(req: Request) {
  const user = await getChatGPTUser();
  if (!user)
    return Response.json(
      { error: "Sign in to view your saved request." },
      { status: 401, headers: noStore },
    );
  const id = new URL(req.url).searchParams.get("id");
  if (!id || !/^[a-f0-9-]{36}$/i.test(id))
    return Response.json(
      { error: "Invalid request reference." },
      { status: 400 },
    );
  try {
    const row = await requestDb()
      .prepare(
        "SELECT id,payload,total_cents,representative_cents,created_at,status FROM demo_requests WHERE id=? AND owner_id=?",
      )
      .bind(id, user.userId)
      .first<{
        id: string;
        payload: string;
        total_cents: number;
        representative_cents: number;
        created_at: string;
        status: string;
      }>();
    if (!row)
      return Response.json(
        { error: "This saved request is unavailable for your account." },
        { status: 404, headers: noStore },
      );
    const data = JSON.parse(row.payload);
    return Response.json(
      {
        id: row.id,
        ...data,
        quote: {
          ...quote(data.selection),
          total: row.total_cents,
          representative: row.representative_cents,
        },
        status: row.status,
        createdAt: row.created_at,
      },
      { headers: noStore },
    );
  } catch {
    return Response.json(
      {
        error: "Saved requests are temporarily unavailable. Please try again.",
      },
      { status: 503, headers: noStore },
    );
  }
}
