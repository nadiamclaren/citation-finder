# Cal.AI — PubMed Citation Assistant

Cal.AI is a web app that helps students and researchers find relevant academic sources to support sentences in their essays. Paste a sentence, and Cal.AI will search PubMed, score each result for relevance using AI, and return ranked citations ready to copy in APA format.

Built as a passion project, originally designed with biomedical research in mind.

---

## Features

- **AI-powered query refinement** — your sentence is rephrased into an optimised PubMed search query using Claude
- **Real PubMed results** — pulls live data from the NCBI API
- **Relevance scoring** — each result is scored 0–100 and explained by Claude
- **APA citation copy** — copy any result as a formatted APA citation in one click
- **Direct PubMed links** — jump straight to the source

---

## Tech Stack

- [Next.js](https://nextjs.org/) — full-stack React framework
- [NCBI E-utilities API](https://www.ncbi.nlm.nih.gov/home/develop/api/) — PubMed search and metadata
- [Anthropic Claude API](https://www.anthropic.com/) — query refinement and relevance scoring
- [Poppins](https://fonts.google.com/specimen/Poppins) via Google Fonts

---

## Getting Started

### Prerequisites

- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/)

### Installation

```bash
git clone https://github.com/nadiamclaren/citation-finder.git
cd citation-finder
npm install
```

### Environment Variables

Create a `.env.local` file in the root of the project:

```
ANTHROPIC_API_KEY=your_api_key_here
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Usage

1. Paste a sentence from your essay into the text box
2. Click **Find Citations**
3. Cal.AI will search PubMed and return ranked, relevant sources
4. Click **View on PubMed** to read the full paper, or **Copy APA** to copy the citation

---

## Planned Features

- [ ] Abstract previews for each result
- [ ] Additional citation formats (MLA, Vancouver)
- [ ] Support for additional databases (arXiv, Semantic Scholar)
- [ ] Text highlighting — select a sentence directly from a pasted essay
- [ ] Vercel deployment

---

## License

MIT
