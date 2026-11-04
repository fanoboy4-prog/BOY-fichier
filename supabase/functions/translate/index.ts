const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface TranslateRequest {
  text: string;
  source: string;
  targets: string[];
}

interface TranslateResult {
  [lang: string]: string;
}

async function translateText(
  text: string,
  source: string,
  target: string,
): Promise<string> {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${source}|${target}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Translation API error: ${res.status}`);
  }
  const data = await res.json();
  const translated = data?.responseData?.translatedText;
  if (!translated || typeof translated !== "string") {
    throw new Error("No translation returned");
  }
  return translated;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { text, source, targets } = (await req.json()) as TranslateRequest;

    if (!text || typeof text !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'text' field" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!source || !Array.isArray(targets) || targets.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing 'source' or 'targets' field" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const results: TranslateResult = {};
    for (const target of targets) {
      try {
        results[target] = await translateText(text, source, target);
      } catch {
        results[target] = "";
      }
    }

    return new Response(JSON.stringify({ translations: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
