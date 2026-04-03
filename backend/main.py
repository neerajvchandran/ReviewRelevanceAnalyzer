from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import spacy
from sklearn.metrics.pairwise import cosine_similarity
import re

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load NLP models
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    print("Downloading SpaCy model 'en_core_web_sm'...")
    from spacy.cli import download
    download("en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")

print("Initializing SentenceTransformer Model (this might take a few moments)...")
sbert_model = SentenceTransformer('all-MiniLM-L6-v2')
sentiment_analyzer = SentimentIntensityAnalyzer()
print("All NLP Models loaded successfully.")

class ExtractRequest(BaseModel):
    product_description: str

class AnalyzeRequest(BaseModel):
    product_description: str
    review: str
    features: list[str]

@app.post("/extract_features")
def extract_features(request: ExtractRequest):
    desc = request.product_description
    doc = nlp(desc)
    
    # Simple extraction: using noun chunks
    features = set()
    for chunk in doc.noun_chunks:
        # Keep short, meaningful noun chunks (1-3 words) ignoring simple determiners
        words = [token.text.lower() for token in chunk if token.pos_ not in ['DET', 'PRON']]
        text = " ".join(words)
        if text and len(words) <= 3 and len(text) > 2:
            features.add(text.title())
            
    features_list = list(features)
    
    # Pick top relevant features based on frequency
    final_features = sorted(features_list, key=lambda x: -desc.lower().count(x.lower()))[:10]
    if not final_features:
        final_features = ["Product", "Quality"]
    
    return {"features": final_features}

@app.post("/analyze")
def analyze(request: AnalyzeRequest):
    review = request.review
    features = request.features
    
    matched_features = []
    unmatched_features = []
    
    # 1. Split review into sentences to match features locally
    review_doc = nlp(review)
    review_sentences = [sent.text for sent in review_doc.sents]
    if not review_sentences:
        review_sentences = [review]
        
    sentence_embeddings = sbert_model.encode(review_sentences)
    feature_embeddings = sbert_model.encode(features)
    
    sim_matrix = cosine_similarity(feature_embeddings, sentence_embeddings)
    
    for i, feature in enumerate(features):
        best_sim = sim_matrix[i].max()
        if best_sim > 0.35: # Threshold for semantic matching
            matched_features.append(feature)
        else:
            unmatched_features.append(feature)
            
    feature_coverage = int((len(matched_features) / len(features)) * 100) if features else 0
    
    # 2. Relevance Score (Overall semantic similarity of review to product description)
    desc_embedding = sbert_model.encode([request.product_description])
    review_embedding = sbert_model.encode([request.review])
    overall_sim = max(0, cosine_similarity(desc_embedding, review_embedding)[0][0])
    
    # Boost by coverage
    relevance_score = int(min(1.0, overall_sim + (feature_coverage / 100) * 0.3) * 100)
    
    # 3. Sentiment Classification
    sentiment = sentiment_analyzer.polarity_scores(review)
    compound = sentiment['compound']
    
    if relevance_score < 30:
        classification = "Irrelevant"
        explanation = "The review does not significantly discuss the key product features or match the core description."
    else:
        if compound >= 0.05:
            classification = "Relevant Positive"
            feature_text = f" It positively mentions aspects like: {', '.join(matched_features[:3])}." if matched_features else ""
            explanation = f"The review is relevant and expresses a positive sentiment.{feature_text}"
        elif compound <= -0.05:
            classification = "Relevant Negative"
            explanation = "The review is relevant to the product but expresses a critical or negative sentiment."
        else:
            classification = "Relevant Neutral"
            explanation = "The review discusses the product in a neutral tone without strong positive or negative emotion."
            
    return {
        "relevance_score": relevance_score,
        "feature_coverage": feature_coverage,
        "classification": classification,
        "matched_features": matched_features,
        "unmatched_features": unmatched_features,
        "explanation": explanation
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
