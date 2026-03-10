"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type Article = {
  pmid: string;
  title: string;
  authors: string;
  journal: string;
  year: string;
  score: number;
  reason: string;
  abstract: string;
};

type Folder = {
  id: string;
  name: string;
  created_at: string;
};

type SavedCitation = {
  id: string;
  folder_id: string;
  pmid: string;
  title: string;
  authors: string;
  journal: string;
  year: string;
  abstract: string;
  score: number;
};

export default function Home() {
  const [query, setQuery] = useState("");
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [refinedQuery, setRefinedQuery] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [savedCitations, setSavedCitations] = useState<SavedCitation[]>([]);
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [savingTo, setSavingTo] = useState<string | null>(null);
  const [showFolderMenu, setShowFolderMenu] = useState<string | null>(null);
  const [saved, setSaved] = useState<Record<string, string>>({});

  useEffect(() => {
    loadFolders();
  }, []);

  async function loadFolders() {
    const { data } = await supabase.from("folders").select("*").order("created_at", { ascending: false });
    if (data) setFolders(data);
  }

  async function createFolder() {
    if (!newFolderName.trim()) return;
    const { data } = await supabase.from("folders").insert({ name: newFolderName.trim() }).select().single();
    if (data) {
      setFolders([data, ...folders]);
      setNewFolderName("");
      setShowNewFolder(false);
    }
  }

  async function deleteFolder(id: string) {
    await supabase.from("folders").delete().eq("id", id);
    setFolders(folders.filter((f) => f.id !== id));
    if (selectedFolder?.id === id) {
      setSelectedFolder(null);
      setSavedCitations([]);
    }
  }

  async function openFolder(folder: Folder) {
    setSelectedFolder(folder);
    const { data } = await supabase.from("citations").select("*").eq("folder_id", folder.id).order("created_at", { ascending: false });
    if (data) setSavedCitations(data);
  }

  async function saveToFolder(article: Article, folderId: string) {
    setSavingTo(article.pmid);
    await supabase.from("citations").insert({
      folder_id: folderId,
      pmid: article.pmid,
      title: article.title,
      authors: article.authors,
      journal: article.journal,
      year: article.year,
      abstract: article.abstract,
      score: article.score,
    });
    setSaved((prev) => ({ ...prev, [article.pmid]: folderId }));
    setSavingTo(null);
    setShowFolderMenu(null);
    if (selectedFolder?.id === folderId) openFolder(selectedFolder);
  }

  async function removeCitation(id: string) {
    await supabase.from("citations").delete().eq("id", id);
    setSavedCitations(savedCitations.filter((c) => c.id !== id));
  }

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setArticles([]);
    setRefinedQuery("");
    setSaved({});

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

  function toAPA(a: Article | SavedCitation) {
    return `${a.authors} (${a.year}). ${a.title}. ${a.journal}. https://pubmed.ncbi.nlm.nih.gov/${a.pmid}`;
  }

  function copyAPA(a: Article | SavedCitation) {
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
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{
        background: "#263338",
        borderBottom: "1px solid #3a4e56",
        padding: "1.5rem 2rem",
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
          cursor: "pointer",
        }} onClick={() => { setSelectedFolder(null); setSavedCitations([]); }}>
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

      <div style={{ display: "flex", flex: 1 }}>
        {/* Sidebar */}
        <div style={{
          width: "240px",
          minWidth: "240px",
          background: "#1a2428",
          borderRight: "1px solid #3a4e56",
          padding: "1.5rem 1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#7fa8b8", fontWeight: "500" }}>
              Folders
            </span>
            <button
              onClick={() => setShowNewFolder(!showNewFolder)}
              style={{
                background: "none", border: "none", color: "#7fa8b8",
                cursor: "pointer", fontSize: "1.2rem", lineHeight: 1, padding: "0 4px",
              }}
            >
              +
            </button>
          </div>

          {showNewFolder && (
            <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.5rem" }}>
              <input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") createFolder(); }}
                placeholder="Folder name..."
                autoFocus
                style={{
                  flex: 1, background: "#263338", border: "1px solid #3a4e56", borderRadius: "4px",
                  color: "#d6e0e4", fontFamily: "'Poppins', sans-serif", fontSize: "0.8rem",
                  padding: "0.4rem 0.6rem", outline: "none",
                }}
              />
              <button
                onClick={createFolder}
                style={{
                  background: "#4c5961", border: "none", borderRadius: "4px", color: "#d6e0e4",
                  fontSize: "0.8rem", padding: "0.4rem 0.6rem", cursor: "pointer", fontFamily: "'Poppins', sans-serif",
                }}
              >
                Add
              </button>
            </div>
          )}

          {folders.length === 0 && (
            <p style={{ fontSize: "0.8rem", color: "#4a6470", fontStyle: "italic", marginTop: "0.5rem" }}>
              No folders yet. Click + to create one.
            </p>
          )}

          {folders.map((folder) => (
            <div
              key={folder.id}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "0.5rem 0.75rem", borderRadius: "6px",
                background: selectedFolder?.id === folder.id ? "#263338" : "transparent",
                border: selectedFolder?.id === folder.id ? "1px solid #3a4e56" : "1px solid transparent",
                cursor: "pointer",
              }}
              onClick={() => openFolder(folder)}
            >
              <span style={{ fontSize: "0.85rem", color: "#d6e0e4", fontWeight: "400", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {folder.name}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }}
                style={{
                  background: "none", border: "none", color: "#4a6470",
                  cursor: "pointer", fontSize: "0.75rem", padding: "0 2px", fontFamily: "'Poppins', sans-serif",
                }}
              >
                x
              </button>
            </div>
          ))}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, padding: "2.5rem 2rem", maxWidth: "760px" }}>
          {selectedFolder ? (
            // Folder view
            <div>
              {/* Folder header with Copy Bibliography button */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <button
                    onClick={() => { setSelectedFolder(null); setSavedCitations([]); }}
                    style={{
                      background: "none", border: "none", color: "#7fa8b8",
                      cursor: "pointer", fontFamily: "'Poppins', sans-serif",
                      fontSize: "0.85rem", padding: 0,
                    }}
                  >
                    {"<- Back"}
                  </button>
                  <h2 style={{ fontSize: "1.2rem", fontWeight: "600", color: "#d6e0e4", margin: 0 }}>
                    {selectedFolder.name}
                  </h2>
                </div>

                {savedCitations.length > 0 && (
                  <button
                    onClick={() => {
                      const bibliography = savedCitations
                        .map((c) => `${c.authors} (${c.year}). ${c.title}. ${c.journal}. https://pubmed.ncbi.nlm.nih.gov/${c.pmid}`)
                        .join("\n\n");
                      navigator.clipboard.writeText(bibliography);
                      setCopied("bibliography");
                      setTimeout(() => setCopied(null), 2000);
                    }}
                    style={{
                      background: copied === "bibliography" ? "#4c5961" : "#263338",
                      border: "1px solid #3a4e56",
                      borderRadius: "6px",
                      color: copied === "bibliography" ? "#7fb5a0" : "#a0c4d4",
                      fontSize: "0.85rem",
                      fontWeight: "500",
                      padding: "0.5rem 1rem",
                      cursor: "pointer",
                      fontFamily: "'Poppins', sans-serif",
                      transition: "all 0.2s",
                    }}
                  >
                    {copied === "bibliography" ? "Copied!" : "Copy Bibliography"}
                  </button>
                )}
              </div>

              {savedCitations.length === 0 ? (
                <p style={{ color: "#4a6470", fontStyle: "italic", fontSize: "0.9rem" }}>
                  No citations saved here yet. Search for sources and save them to this folder.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {savedCitations.map((c) => (
                    <div key={c.id} style={{
                      background: "#263338", border: "1px solid #3a4e56",
                      borderLeft: `3px solid ${scoreColor(c.score)}`,
                      borderRadius: "8px", padding: "1.25rem 1.5rem",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                        <p style={{ fontSize: "0.95rem", fontWeight: "500", color: "#d6e0e4", margin: 0, lineHeight: "1.5", flex: 1 }}>
                          {c.title}
                        </p>
                        <span style={{
                          fontSize: "0.8rem", fontWeight: "600", color: scoreColor(c.score),
                          whiteSpace: "nowrap", background: "#1e2b30", padding: "2px 8px", borderRadius: "12px",
                        }}>
                          {c.score}%
                        </span>
                      </div>
                      <p style={{ fontSize: "0.85rem", color: "#b0c4cc", margin: "0.5rem 0 0", fontWeight: "300", lineHeight: "1.6" }}>
                        {c.abstract}
                      </p>
                      <div style={{ marginTop: "0.75rem", fontSize: "0.8rem", color: "#5a7a8a", display: "flex", gap: "0.5rem", flexWrap: "wrap", fontWeight: "300" }}>
                        <span>{c.authors}</span>
                        <span style={{ color: "#3a4e56" }}>|</span>
                        <span>{c.journal}</span>
                        <span style={{ color: "#3a4e56" }}>|</span>
                        <span>{c.year}</span>
                      </div>
                      <div style={{ marginTop: "0.75rem", display: "flex", gap: "1rem" }}>
                        <a href={"https://pubmed.ncbi.nlm.nih.gov/" + c.pmid} target="_blank" rel="noopener noreferrer"
                          style={{ color: "#a0c4d4", fontSize: "0.8rem", textDecoration: "none", fontWeight: "500" }}>
                          View on PubMed
                        </a>
                        <button onClick={() => copyAPA(c)}
                          style={{ background: "none", border: "none", color: copied === c.pmid ? "#7fb5a0" : "#5a7a8a", fontSize: "0.8rem", cursor: "pointer", padding: 0, fontFamily: "'Poppins', sans-serif", fontWeight: "500" }}>
                          {copied === c.pmid ? "Copied!" : "Copy APA"}
                        </button>
                        <button onClick={() => removeCitation(c.id)}
                          style={{ background: "none", border: "none", color: "#5a7a8a", fontSize: "0.8rem", cursor: "pointer", padding: 0, fontFamily: "'Poppins', sans-serif", fontWeight: "500" }}>
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Search view
            <div>
              <p style={{ color: "#7fa8b8", fontSize: "0.95rem", marginBottom: "1.5rem", lineHeight: "1.6", fontWeight: "300" }}>
                Paste a sentence from your essay and we will find the most relevant PubMed sources to support your claim.
              </p>

              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. CRISPR-Cas9 has demonstrated efficacy in correcting genetic mutations associated with sickle cell disease..."
                rows={4}
                style={{
                  width: "100%", background: "#263338", border: "1px solid #3a4e56", borderRadius: "8px",
                  color: "#d6e0e4", fontFamily: "'Poppins', sans-serif", fontSize: "0.95rem", fontWeight: "300",
                  padding: "1rem", resize: "vertical", outline: "none", lineHeight: "1.6", boxSizing: "border-box",
                }}
              />

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.75rem" }}>
                <button
                  onClick={handleSearch}
                  disabled={loading || !query.trim()}
                  style={{
                    background: loading ? "#3a4e56" : "#4c5961", color: loading ? "#7fa8b8" : "#d6e0e4",
                    border: "1px solid #5a6f79", borderRadius: "6px", padding: "0.6rem 1.6rem",
                    fontFamily: "'Poppins', sans-serif", fontSize: "0.9rem", fontWeight: "500",
                    cursor: loading ? "not-allowed" : "pointer", transition: "background 0.2s",
                  }}
                >
                  {loading ? "Searching..." : "Find Citations"}
                </button>
              </div>

              {error && <p style={{ color: "#c97a7a", marginTop: "1rem", fontSize: "0.9rem" }}>{error}</p>}

              {loading && (
                <div style={{ marginTop: "2.5rem", color: "#7fa8b8", fontSize: "0.9rem", fontWeight: "300" }}>
                  <p>Refining your query and searching PubMed...</p>
                  <p style={{ marginTop: "0.25rem", opacity: 0.7 }}>Scoring relevance with AI...</p>
                </div>
              )}

              {refinedQuery && !loading && (
                <div style={{ marginTop: "2rem", padding: "0.75rem 1rem", background: "#263338", border: "1px solid #3a4e56", borderRadius: "6px", fontSize: "0.85rem", color: "#7fa8b8" }}>
                  <span style={{ fontWeight: "500", color: "#a0c4d4" }}>Search query used: </span>
                  <span style={{ fontWeight: "300" }}>{refinedQuery}</span>
                </div>
              )}

              {articles.length > 0 && !loading && (
                <div style={{ marginTop: "2.5rem" }}>
                  <h2 style={{ fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#7fa8b8", fontWeight: "500", marginBottom: "1.25rem", borderBottom: "1px solid #3a4e56", paddingBottom: "0.5rem" }}>
                    {articles.length} Sources Found
                  </h2>

                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {articles.map((a) => (
                      <div key={a.pmid} style={{
                        background: "#263338", border: "1px solid #3a4e56",
                        borderLeft: `3px solid ${scoreColor(a.score)}`, borderRadius: "8px", padding: "1.25rem 1.5rem",
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                          <p style={{ fontSize: "0.95rem", fontWeight: "500", color: "#d6e0e4", margin: 0, lineHeight: "1.5", flex: 1 }}>
                            {a.title}
                          </p>
                          <span style={{ fontSize: "0.8rem", fontWeight: "600", color: scoreColor(a.score), whiteSpace: "nowrap", background: "#1e2b30", padding: "2px 8px", borderRadius: "12px" }}>
                            {a.score}%
                          </span>
                        </div>

                        <p style={{ fontSize: "0.85rem", color: "#7fa8b8", margin: "0.5rem 0 0", fontWeight: "300", lineHeight: "1.5", fontStyle: "italic" }}>
                          {a.reason}
                        </p>

                        <p style={{ fontSize: "0.85rem", color: "#b0c4cc", margin: "0.5rem 0 0", fontWeight: "300", lineHeight: "1.6" }}>
                          {a.abstract}
                        </p>

                        <div style={{ marginTop: "0.75rem", fontSize: "0.8rem", color: "#5a7a8a", display: "flex", gap: "0.5rem", flexWrap: "wrap", fontWeight: "300" }}>
                          <span>{a.authors}</span>
                          <span style={{ color: "#3a4e56" }}>|</span>
                          <span>{a.journal}</span>
                          <span style={{ color: "#3a4e56" }}>|</span>
                          <span>{a.year}</span>
                        </div>

                        <div style={{ marginTop: "0.75rem", display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
                          <a href={"https://pubmed.ncbi.nlm.nih.gov/" + a.pmid} target="_blank" rel="noopener noreferrer"
                            style={{ color: "#a0c4d4", fontSize: "0.8rem", textDecoration: "none", fontWeight: "500" }}>
                            View on PubMed
                          </a>
                          <button onClick={() => copyAPA(a)}
                            style={{ background: "none", border: "none", color: copied === a.pmid ? "#7fb5a0" : "#5a7a8a", fontSize: "0.8rem", cursor: "pointer", padding: 0, fontFamily: "'Poppins', sans-serif", fontWeight: "500" }}>
                            {copied === a.pmid ? "Copied!" : "Copy APA"}
                          </button>

                          <div style={{ position: "relative" }}>
                            <button
                              onClick={() => setShowFolderMenu(showFolderMenu === a.pmid ? null : a.pmid)}
                              style={{
                                background: "none", border: "none",
                                color: saved[a.pmid] ? "#7fb5a0" : "#5a7a8a",
                                fontSize: "0.8rem", cursor: "pointer", padding: 0,
                                fontFamily: "'Poppins', sans-serif", fontWeight: "500",
                              }}
                            >
                              {savingTo === a.pmid ? "Saving..." : saved[a.pmid] ? "Saved!" : "Save to Folder"}
                            </button>

                            {showFolderMenu === a.pmid && (
                              <div style={{
                                position: "absolute", bottom: "1.5rem", left: 0, background: "#1a2428",
                                border: "1px solid #3a4e56", borderRadius: "6px", minWidth: "180px", zIndex: 10, padding: "0.4rem 0",
                              }}>
                                {folders.length === 0 ? (
                                  <p style={{ fontSize: "0.8rem", color: "#4a6470", padding: "0.5rem 0.75rem", margin: 0 }}>
                                    No folders yet — create one in the sidebar!
                                  </p>
                                ) : (
                                  folders.map((f) => (
                                    <button key={f.id} onClick={() => saveToFolder(a, f.id)}
                                      style={{
                                        display: "block", width: "100%", background: "none", border: "none",
                                        color: "#d6e0e4", fontSize: "0.85rem", padding: "0.5rem 0.75rem",
                                        cursor: "pointer", textAlign: "left", fontFamily: "'Poppins', sans-serif",
                                      }}
                                    >
                                      {f.name}
                                    </button>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
