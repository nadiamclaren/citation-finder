import { searchPubMed, fetchArticles } from "@/lib/ncbi";

export async function POST(req: Request) {
  const { query } = await req.json();

  if (!query) {
    return Response.json({ error: "No query provided" }, { status: 400 });
  }

  const refineRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-opus-4-5",
      max_tokens: 100,
      messages: [
        {
          role: "user",
          content: `Convert this sentence into a concise PubMed search query using relevant medical/scientific keywords. Return ONLY the search query string, nothing else.\n\nSentence: "${query}"`,
        },
      ],
    }),
  });

  const refineData = await refineRes.json();
  const refinedQuery = refineData.content[0].text.trim();
  console.log("Refined query:", refinedQuery);

  const ids = await searchPubMed(refinedQuery);
  console.log("IDs found:", ids);

  const articles = await fetchArticles(ids);
  console.log("Articles:", articles);

  const scoreRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-opus-4-5",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: `You are a research assistant. Given a sentence from an academic essay and a list of potential citation sources, score each source's relevance to the sentence and provide a one-sentence explanation of why it is or isn't relevant.

Sentence: "${query}"

Sources:
${articles.map((a, i) => `${i}. Title: ${a.title} | Journal: ${a.journal} | Year: ${a.year}`).join("\n")}

Respond ONLY with a JSON array in this exact format, no markdown, no backticks:
[{"index": 0, "score": 85, "reason": "Directly studies X in the context of Y"}, ...]

Score from 0-100. Be strict — only high scores for genuinely relevant sources.`,
        },
      ],
    }),
  });

  const scoreData = await scoreRes.json();
  console.log("Raw scores response:", scoreData.content[0].text);

  const scores = JSON.parse(scoreData.content[0].text.trim());

  const scored = articles.map((a, i) => {
    const match = scores.find((s: any) => s.index === i);
    return {
      ...a,
      score: match?.score ?? 0,
      reason: match?.reason ?? "No relevance data",
    };
  }).sort((a, b) => b.score - a.score);

  return Response.json({ articles: scored, refinedQuery });
}