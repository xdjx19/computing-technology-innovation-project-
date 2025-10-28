from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import pickle
import numpy as np

app = FastAPI(title="Cyber Security AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MalwareRequest(BaseModel):
    features: List[float]

class SpamRequest(BaseModel):
    text: str

class PredictionResponse(BaseModel):
    prediction: str
    confidence: float
    model_used: str

# Load the FIXED models
try:
    malware_model = pickle.load(open("../models/malware_model.pkl", "rb"))
    spam_model = pickle.load(open("../models/spam_model.pkl", "rb")) 
    vectorizer = pickle.load(open("../models/vectorizer.pkl", "rb"))
    print("✅ PROPER models loaded successfully!")
except Exception as e:
    print(f"❌ Error: {e}")
    print("💡 Run fix_models.py first!")
    exit(1)

@app.post("/api/predict/malware", response_model=PredictionResponse)
async def predict_malware(request: MalwareRequest):
    try:
        # Ensure exactly 5 features
        if len(request.features) != 5:
            raise HTTPException(status_code=400, detail="Please provide exactly 5 numbers separated by commas")
        
        features_array = np.array([request.features])
        prediction = malware_model.predict(features_array)[0]
        confidence = max(malware_model.predict_proba(features_array)[0])
        
        return PredictionResponse(
            prediction="malware" if prediction == 1 else "benign",
            confidence=float(confidence),
            model_used="malware_detection"
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/predict/spam", response_model=PredictionResponse)
async def predict_spam(request: SpamRequest):
    try:
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="Please enter some text")
        
        text_vectorized = vectorizer.transform([request.text])
        prediction = spam_model.predict(text_vectorized)[0]
        confidence = max(spam_model.predict_proba(text_vectorized)[0])
        
        return PredictionResponse(
            prediction="spam" if prediction == 1 else "ham",
            confidence=float(confidence),
            model_used="spam_detection"
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/")
async def root():
    return {"message": "Cyber Security AI API - PROPER MODELS"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)