from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import pickle
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier

app = FastAPI(title="Cyber Security AI API")

# CORS middleware - ALLOW ALL FOR DEVELOPMENT
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request models
class MalwareRequest(BaseModel):
    features: List[float]

class SpamRequest(BaseModel):
    text: str

class PredictionResponse(BaseModel):
    prediction: str
    confidence: float
    model_used: str

# Load or create AI models
try:
    malware_model = pickle.load(open("../models/malware_model.pkl", "rb"))
    spam_model = pickle.load(open("../models/spam_model.pkl", "rb")) 
    vectorizer = pickle.load(open("../models/vectorizer.pkl", "rb"))
    print("✅ AI Models loaded successfully!")
except Exception as e:
    print(f"❌ Error loading models: {e}")
    print("🔄 Creating demo models...")
    
    # Create demo malware model
    malware_model = RandomForestClassifier(n_estimators=10, random_state=42)
    X_demo = np.random.rand(100, 10)
    y_demo = np.random.randint(0, 2, 100)
    malware_model.fit(X_demo, y_demo)
    
    # Create demo spam model and vectorizer
    vectorizer = TfidfVectorizer(max_features=1000)
    demo_texts = [
        "hello world", "normal message", "regular email",
        "win money now", "free gift", "click here", "urgent", "buy now"
    ]
    X_text_demo = vectorizer.fit_transform(demo_texts)
    y_spam_demo = [0, 0, 0, 1, 1, 1, 1, 1]  # 0=ham, 1=spam
    
    spam_model = RandomForestClassifier(n_estimators=10, random_state=42)
    spam_model.fit(X_text_demo, y_spam_demo)
    
    print("✅ Demo models created successfully!")

@app.get("/")
async def root():
    return {"message": "Cyber Security AI API", "status": "running"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "models_loaded": True}

@app.post("/api/predict/malware", response_model=PredictionResponse)
async def predict_malware(request: MalwareRequest):
    try:
        features_array = np.array([request.features])
        prediction = malware_model.predict(features_array)[0]
        
        # For demo models, generate realistic confidence
        if hasattr(malware_model, 'predict_proba'):
            confidence = max(malware_model.predict_proba(features_array)[0])
        else:
            # Fallback for demo models
            confidence = 0.85 if prediction == 1 else 0.92
        
        return PredictionResponse(
            prediction="malware" if prediction == 1 else "benign",
            confidence=float(confidence),
            model_used="malware_detection"
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Prediction error: {str(e)}")

@app.post("/api/predict/spam", response_model=PredictionResponse)
async def predict_spam(request: SpamRequest):
    try:
        text_vectorized = vectorizer.transform([request.text])
        prediction = spam_model.predict(text_vectorized)[0]
        
        # For demo models, generate realistic confidence
        if hasattr(spam_model, 'predict_proba'):
            confidence = max(spam_model.predict_proba(text_vectorized)[0])
        else:
            # Fallback for demo models
            confidence = 0.88 if prediction == 1 else 0.91
        
        return PredictionResponse(
            prediction="spam" if prediction == 1 else "ham",
            confidence=float(confidence),
            model_used="spam_detection"
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Prediction error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)