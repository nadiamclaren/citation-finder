import { searchPubMed, fetchArticles } from "./ncbi";

async function test() {
  const ids = await searchPubMed("CRISPR gene editing cancer treatment");
  console.log("IDs found:", ids);

  const articles = await fetchArticles(ids);
  console.log("First article:", articles[0]);
}

test();