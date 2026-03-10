const NCBI_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const API_KEY = ""; // add this later

export async function searchPubMed(query: string, maxResults = 5): Promise<string[]> {
  const url = `${NCBI_BASE}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${maxResults}&retmode=json${API_KEY ? `&api_key=${API_KEY}` : ""}`;
  
  const res = await fetch(url);
  const data = await res.json();
  
  return data.esearchresult.idlist; 
}

export async function fetchArticles(ids: string[]) {
  const url = `${NCBI_BASE}/esummary.fcgi?db=pubmed&id=${ids.join(",")}&retmode=json${API_KEY ? `&api_key=${API_KEY}` : ""}`;
  
  const res = await fetch(url);
  const data = await res.json();

  return ids.map((id) => {
    const article = data.result[id];
    return {
      pmid: id,
      title: article.title,
      authors: article.authors?.map((a: any) => a.name).join(", ") ?? "Unknown",
      journal: article.fulljournalname,
      year: article.pubdate?.split(" ")[0] ?? "Unknown",
    };
  });
}