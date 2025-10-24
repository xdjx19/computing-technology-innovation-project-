from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pickle
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
import numpy as np

app = FastAPI()

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load your trained models (you'll need to save them as .pkl files first)
try:
    with open("models/malware_model.pkl", "rb") as f:
        malware_model = pickle.load(f)
    with open("models/spam_model.pkl", "rb") as f:
        spam_model = pickle.load(f)
    with open("models/vectorizer.pkl", "rb") as f:
        vectorizer = pickle.load(f)
except:
    print("Models not found - run training first")
    malware_model = None
    spam_model = None
    vectorizer = None

# Request models
class MalwareRequest(BaseModel):
    features: list  # Your malware feature values

class SpamRequest(BaseModel):
    text: str

class PredictionResponse(BaseModel):
    prediction: str
    confidence: float
    model_used: str

# Routes
@app.get("/")
def read_root():
    return {"message": "Cybersecurity AI API Running"}

@app.post("/predict/malware", response_model=PredictionResponse)
def predict_malware(request: MalwareRequest):
    if malware_model is None:
        raise HTTPException(status_code=500, detail="Model not loaded")
    
    try:
        features_array = np.array([request.features])
        prediction = malware_model.predict(features_array)[0]
        confidence = max(malware_model.predict_proba(features_array)[0])
        
        result = "malware" if prediction == 1 else "benign"
        return PredictionResponse(
            prediction=result,
            confidence=float(confidence),
            model_used="malware_detection"
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Prediction error: {str(e)}")

@app.post("/predict/spam", response_model=PredictionResponse)
def predict_spam(request: SpamRequest):
    if spam_model is None or vectorizer is None:
        raise HTTPException(status_code=500, detail="Model not loaded")
    
    try:
        # Transform text using the same vectorizer from training
        text_vectorized = vectorizer.transform([request.text])
        prediction = spam_model.predict(text_vectorized)[0]
        confidence = max(spam_model.predict_proba(text_vectorized)[0])
        
        result = "spam" if prediction == 1 else "ham"
        return PredictionResponse(
            prediction=result,
            confidence=float(confidence),
            model_used="spam_detection"
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Prediction error: {str(e)}")

@app.get("/models/status")
def get_model_status():
    return {
        "malware_model_loaded": malware_model is not None,
        "spam_model_loaded": spam_model is not None
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)