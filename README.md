4Cyber – Spam and Malware Detection Project

A full-stack cybersecurity project integrating FastAPI (backend) and React (frontend) for detecting spam messages and malware files using trained machine-learning models.

⚙️ Setup and Running the Application
🔹 Step 1: Install Required Dependencies

You only need to do this once — after installing, you don’t need to repeat it again.

cd backend
pip install -r requirements.txt

🔹 Step 2: Start the Backend (Terminal 1)
cd backend
uvicorn main:app --reload --port 8000


This launches the FastAPI server on port 8000.

🔹 Step 3: Start the Frontend (Terminal 2)
cd frontend
npm run dev


This runs the React frontend on port 3000.

Then, open your browser and go to:
👉 http://localhost:3000

🧠 Project Overview

This project performs two cybersecurity classification tasks:

Spam Detection – Classifies text messages as
0 = Ham or 1 = Spam,
using both an original spam dataset and a Kaggle dataset.

Malware Detection – Classifies files as
0 = Benign or 1 = Malware,
using a preprocessed malware dataset.

Target Users:
Anyone who wants to automatically filter harmful messages or detect malware in software files.

🧩 Environment Setup

Python Version: 3.10+

If needed, install essential libraries manually:

pip install pandas matplotlib scikit-learn seaborn


Or using Conda:

conda create -n ai4cyber python=3.10
conda activate ai4cyber
pip install pandas matplotlib scikit-learn seaborn

📊 Data Preparation
Spam Dataset

Place the following files in the data/ folder:

spam_cleaned.csv

kaggle_spam_cleaned.csv

The script will automatically:

Merge both files into a single dataset

Remove missing entries

Keep two columns: text and spam (0 = Ham, 1 = Spam)

Malware Dataset

Place the file malware_cleaned.csv in the data/ folder.

The script will automatically:

Drop ID-like columns (e.g., hashes)

Map the classification column to 0 = Benign, 1 = Malware

🚀 Running the Models
Spam Detection

Run:

python spam_detection.py


This script:

Converts text to TF-IDF features (max 3000 features, English stop words)

Trains a Logistic Regression model

Splits data 80/20 for training and testing

Malware Detection

Run:

python malware_detection.py


This script:

Trains a Random Forest Classifier (100 trees)

Splits data 80/20 for training and testing

📁 Folder Structure
project/
├─ backend/
│  ├─ models/
│  ├─ data/
│  ├─ main.py
│  └─ requirements.txt
│
├─ frontend/
│  ├─ src/
│  │  ├─ App.jsx
│  │  ├─ index.css
│  │  └─ main.jsx
│  ├─ index.html
│  ├─ package.json
│  └─ vite.config.js
│
├─ models/
├─ results/
├─ malware_detection.py
├─ spam_detection.py
└─ README.md

📈 Outputs
Spam Detection

results/spam_class_distribution.png – Ham vs Spam bar chart

results/spam_report.txt – Classification report

results/spam_confusion_matrix.png – Confusion matrix

Malware Detection

results/class_distribution.png – Benign vs Malware bar chart

results/malware_report.txt – Classification report

results/malware_confusion_matrix.png – Confusion matrix

results/feature_importance.png – Top 15 most important features

🧪 Making Predictions
Spam Example
text_sample = ["Free entry! Win a prize now."]
prediction = model.predict(vectorizer.transform(text_sample))
print(prediction)  # 0 = Ham, 1 = Spam

Malware Example
sample_df = pd.DataFrame([sample_features])
prediction = rf.predict(sample_df)
print(prediction)  # 0 = Benign, 1 = Malware