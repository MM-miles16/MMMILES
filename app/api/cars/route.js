import { supabase } from "../../../lib/supabaseClient";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city");
  if (!city) return Response.json({ error: "City missing" }, { status: 400 });

  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("city", city)
    .eq("available_status", true);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // basic cache header to avoid hammering Supabase
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "s-maxage=30, stale-while-revalidate=60" },
  });
}