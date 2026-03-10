"use client";
import { useState } from "react";

type Article = {
  pmid: string;
  title: string;
  authors: string;
  journal: string;
  year: string;
  score: number;
  reason: string;
};

export default function Home() {
  const [query, setQuery] = useState("");
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [refinedQuery, setRefinedQuery] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setArticles([]);
    setRefinedQuery("");

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setArticles(data.articles);
      setRefinedQuery(data.refinedQuery);
    } catch (e: any) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function toAPA(a: Article) {
    return `${a.authors} (${a.year}). ${a.title}. ${a.journal}. https://pubmed.ncbi.nlm.nih.gov/${a.pmid}`;
  }

  function copyAPA(a: Article) {
    navigator.clipboard.writeText(toAPA(a));
    setCopied(a.pmid);
    setTimeout(() => setCopied(null), 2000);
  }

  function scoreColor(score: number) {
    if (score >= 75) return "#7fb5a0";
    if (score >= 50) return "#a0b5c8";
    return "#8a7fa0";
  }

  return (
    <main style={{
      minHeight: "100vh",
      background: "#1e2b30",
      color: "#d6e0e4",
      fontFamily: "'Poppins', sans-serif",
    }}>
      {/* Header */}
      <div style={{
        background: "#263338",
        borderBottom: "1px solid #3a4e56",
        padding: "1.5rem 3rem",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
      }}>
        <h1 style={{
          fontSize: "1.5rem",
          fontWeight: "600",
          color: "#d6e0e4",
          margin: 0,
          letterSpacing: "-0.01em",
        }}>
          Cal.AI
        </h1>
        <span style={{
          color: "#7fa8b8",
          fontSize: "0.8rem",
          fontWeight: "400",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}>
          PubMed Citation Assistant
        </span>
      </div>

      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "3rem 2rem" }}>

        <p style={{
          color: "#7fa8b8",
          fontSize: "0.95rem",
          marginBottom: "1.5rem",
          lineHeight: "1.6",
          fontWeight: "300",
        }}>
          Paste a sentence from your essay and we will find the most relevant PubMed sources to support your claim.
        </p>

        {/* Input */}
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. CRISPR-Cas9 has demonstrated efficacy in correcting genetic mutations associated with sickle cell disease..."
          rows={4}
          style={{
            width: "100%",
            background: "#263338",
            border: "1px solid #3a4e56",
            borderRadius: "8px",
            color: "#d6e0e4",
            fontFamily: "'Poppins', sans-serif",
            fontSize: "0.95rem",
            fontWeight: "300",
            padding: "1rem",
            resize: "vertical",
            outline: "none",
            lineHeight: "1.6",
            boxSizing: "border-box",
          }}
        />

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.75rem" }}>
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            style={{
              background: loading ? "#3a4e56" : "#4c5961",
              color: loading ? "#7fa8b8" : "#d6e0e4",
              border: "1px solid #5a6f79",
              borderRadius: "6px",
              padding: "0.6rem 1.6rem",
              fontFamily: "'Poppins', sans-serif",
              fontSize: "0.9rem",
              fontWeight: "500",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.2s, border-color 0.2s",
            }}
          >
            {loading ? "Searching..." : "Find Citations"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <p style={{ color: "#c97a7a", marginTop: "1rem", fontSize: "0.9rem" }}>{error}</p>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ marginTop: "2.5rem", color: "#7fa8b8", fontSize: "0.9rem", fontWeight: "300" }}>
            <p>Refining your query and searching PubMed...</p>
            <p style={{ marginTop: "0.25rem", opacity: 0.7 }}>Scoring relevance with AI...</p>
          </div>
        )}

        {/* Refined query */}
        {refinedQuery && !loading && (
          <div style={{
            marginTop: "2rem",
            padding: "0.75rem 1rem",
            background: "#263338",
            border: "1px solid #3a4e56",
            borderRadius: "6px",
            fontSize: "0.85rem",
            color: "#7fa8b8",
          }}>
            <span style={{ fontWeight: "500", color: "#a0c4d4" }}>Search query used: </span>
            <span style={{ fontWeight: "300" }}>{refinedQuery}</span>
          </div>
        )}

        {/* Results */}
        {articles.length > 0 && !loading && (
          <div style={{ marginTop: "2.5rem" }}>
            <h2 style={{
              fontSize: "0.75rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "#7fa8b8",
              fontWeight: "500",
              marginBottom: "1.25rem",
              borderBottom: "1px solid #3a4e56",
              paddingBottom: "0.5rem",
            }}>
              {articles.length} Sources Found
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {articles.map((a) => (
                <div key={a.pmid} style={{
                  background: "#263338",
                  border: "1px solid #3a4e56",
                  borderLeft: `3px solid ${scoreColor(a.score)}`,
                  borderRadius: "8px",
                  padding: "1.25rem 1.5rem",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                    <p style={{
                      fontSize: "0.95rem",
                      fontWeight: "500",
                      color: "#d6e0e4",
                      margin: 0,
                      lineHeight: "1.5",
                      flex: 1,
                    }}>
                      {a.title}
                    </p>
                    <span style={{
                      fontSize: "0.8rem",
                      fontWeight: "600",
                      color: scoreColor(a.score),
                      whiteSpace: "nowrap",
                      marginTop: "2px",
                      background: "#1e2b30",
                      padding: "2px 8px",
                      borderRadius: "12px",
                    }}>
                      {a.score}%
                    </span>
                  </div>

                  <p style={{
                    fontSize: "0.85rem",
                    color: "#7fa8b8",
                    margin: "0.5rem 0 0",
                    fontWeight: "300",
                    lineHeight: "1.5",
                    fontStyle: "italic",
                  }}>
                    {a.reason}
                  </p>

                  <div style={{
                    marginTop: "0.75rem",
                    fontSize: "0.8rem",
                    color: "#5a7a8a",
                    display: "flex",
                    gap: "0.5rem",
                    flexWrap: "wrap",
                    alignItems: "center",
                    fontWeight: "300",
                  }}>
                    <span>{a.authors}</span>
                    <span style={{ color: "#3a4e56" }}>|</span>
                    <span>{a.journal}</span>
                    <span style={{ color: "#3a4e56" }}>|</span>
                    <span>{a.year}</span>
                  </div>

                  <div style={{ marginTop: "0.75rem", display: "flex", gap: "1rem" }}>
                    <a
                      href={"https://pubmed.ncbi.nlm.nih.gov/" + a.pmid}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#a0c4d4", fontSize: "0.8rem", textDecoration: "none", fontWeight: "500" }}
                    >
                      View on PubMed
                    </a>
                    <button
                      onClick={() => copyAPA(a)}
                      style={{
                        background: "none",
                        border: "none",
                        color: copied === a.pmid ? "#7fb5a0" : "#5a7a8a",
                        fontSize: "0.8rem",
                        cursor: "pointer",
                        padding: 0,
                        fontFamily: "'Poppins', sans-serif",
                        fontWeight: "500",
                      }}
                    >
                      {copied === a.pmid ? "Copied!" : "Copy APA"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
