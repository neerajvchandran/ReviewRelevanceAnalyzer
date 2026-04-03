# Review Relevance Evaluator AI

An end-to-end full-stack AI system that contextually maps customer reviews to specific product descriptions utilizing semantic embeddings. Instead of general sentiment analysis, it matches exact product features and assigns an overall relevance score.

## How It Works

The system operates using sophisticated NLP models running locally via FastAPI, and a premium React-based frontend.

1. **Input**:
   - **Product Description**: You insert a paragraph outlining a product and its key features (e.g. "Smartwatch with 14-day battery, heart-rate monitor, waterproof"). The system extracts key features using Spacy.
   - **Customer Review**: You insert a user's review (e.g., "The battery died in 3 days but I love swimming with it!").

2. **Output**:
   The system provides semantic matching, a relevance score, a feature coverage metric, and highlights matched/unmatched product tags. In addition, it classifies the overall interaction into one of **4 distinct cases**:

   - ✅ **Relevant Positive**: The user actively discusses the actual product components extracted from the description and reports a primarily positive experience with them. 
   - ⚠️ **Relevant Neutral**: The user discusses the product components but expresses neither strong likings nor dislikings. 
   - 🛑 **Relevant Negative**: The user actively discusses the product but highlights flaws, criticisms, or negative sentiment regarding the matched features. 
   - 🚫 **Irrelevant**: The review does not meaningfully mention the specific features of the product described, indicating spam or a misplaced review (Score < 30%).

## Models Used

The backend executes these models directly from Python to ensure data privacy and fast local compute:

-   **Sentence-BERT (`all-MiniLM-L6-v2`)**: Used via `sentence-transformers` to compute heavy semantic embeddings of both the extracted product features and the individual sentences of the user review. This creates the dense matrices used for cosine similarity scoring, avoiding brittle keyword-only matches.
-   **SpaCy (`en_core_web_sm`)**: Used for extracting specific noun-chunks and cleaning deterministic language to identify the core "features" of the product dynamically. Also used to chunk paragraphs into easily analyzed semantic sentences.
-   **VaderSentiment**: A powerful, fast heuristic and rule-based sentiment analysis tool specifically attuned to social media linguistic patterns, utilized for measuring polarity.
