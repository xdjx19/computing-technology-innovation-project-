4Cyber – Spam and Malware Detection Project

initally, you need to install the required dependencies. once its done, you don't have to do it again. follow these commands

cd backend
pip install -r requirements.txt

too start backend enter these commands (terminal 1):
cd backend
uvicorn main:app --reload --port 8000

to start frontend enter these commands (terminal 2):
cd frontend
npm run dev

then go to this site in your browser
http://localhost:3000

Project Overview

This project covers two cybersecurity tasks:

Spam Detection – Classifies messages as “Ham” (0) or “Spam” (1) using a combination of an original spam dataset and a Kaggle dataset.

Malware Detection – Classifies software files as “Benign” (0) or “Malware” (1) using a preprocessed malware dataset.

The target users are anyone who wants to automatically filter harmful messages or detect malware in files.

Environment Setup

Python version: 3.10+
Required libraries:

pip install pandas matplotlib scikit-learn seaborn


Or using conda:

conda create -n ai4cyber python=3.10
conda activate ai4cyber
pip install pandas matplotlib scikit-learn seaborn

Data Preparation
Spam Dataset

Place the files in the data/ folder:

spam_cleaned.csv

kaggle_spam_cleaned.csv

The script will combine them automatically into a single dataset with two columns: text and spam.

Any missing messages are removed.

spam column: 0 = Ham, 1 = Spam

Malware Dataset

Place the file in data/malware_cleaned.csv.

ID-like columns like hash are removed automatically.

The target column classification is converted to 0 = Benign, 1 = Malware.

Running the Models
Spam Detection

Run spam_detection.py.

The script will:

Convert text to TF-IDF features (up to 3000 features, English stop words)

Train a Logistic Regression model

Use an 80/20 train/test split

Malware Detection

Run malware_detection.py.

The script will:

Train a Random Forest Classifier with 100 trees

Use an 80/20 train/test split

Outputs
Spam Detection

results/spam_class_distribution.png – Bar chart showing number of Ham vs Spam

results/spam_report.txt – Classification report

results/spam_confusion_matrix.png – Confusion matrix

Malware Detection

results/class_distribution.png – Bar chart of Benign vs Malware

results/malware_report.txt – Classification report

results/malware_confusion_matrix.png – Confusion matrix

results/feature_importance.png – Top 15 important features

Folder Structure
project/
├─ data/
│  ├─ spam_cleaned.csv
│  ├─ kaggle_spam_cleaned.csv
│  └─ malware_cleaned.csv
├─ results/
├─ spam_detection.py
├─ malware_detection.py
└─ Session5-Group5-Readme.pdf

Making Predictions
Spam
text_sample = ["Free entry! Win a prize now."]
prediction = model.predict(vectorizer.transform(text_sample))
print(prediction)  # 0 = Ham, 1 = Spam

Malware
sample_df = pd.DataFrame([sample_features])
prediction = rf.predict(sample_df)
print(prediction)  # 0 = Benign, 1 = Malware

Notes

Spam detection may misclassify very unusual messages.

Malware detection relies on features from the dataset, so results may vary with unknown malware types.

Scripts assume the data/ folder exists and the results/ folder is writable.

Submission Naming

Readme: Session5-Group5-Readme.pdf

Meeting minutes: Session5-Group5-MeetingMinutes.pdf

Contribution form: Session5-Group5-ContributionForm.pdf

Files to Include in Submission

Datasets used (data/ folder)

spam_detection.py and malware_detection.py

Readme, meeting minutes, and contribution form PDFs