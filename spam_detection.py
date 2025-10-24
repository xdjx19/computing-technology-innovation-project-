import pandas as pd
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import seaborn as sns
import os

# === Load both datasets ===
# Original dataset
df1 = pd.read_csv("data/spam_cleaned.csv")

# Kaggle dataset
try:
    df2 = pd.read_csv("data/kaggle_spam_cleaned.csv", encoding="utf-8")
except UnicodeDecodeError:
    df2 = pd.read_csv("data/kaggle_spam_cleaned.csv", encoding="latin-1")

# === Standardize Kaggle dataset column names ===
df2 = df2.rename(columns={"label_num": "spam"})  # target column
df2 = df2[["text", "spam"]].dropna(subset=["text"])

# === Standardize original dataset column names ===
# (Assuming it already has "text" and "spam" columns)
if "spam" not in df1.columns or "text" not in df1.columns:
    raise ValueError("Original dataset must have columns 'text' and 'spam'.")

# === Combine both datasets ===
df = pd.concat([df1[["text", "spam"]], df2[["text", "spam"]]], ignore_index=True)

# === Check combined dataset ===
print("Combined dataset size:", df.shape)
print(df.head())

# Ensure results folder exists
os.makedirs("results", exist_ok=True)

# === Simple class distribution bar graph ===
sns.set(style="whitegrid")
plt.figure(figsize=(5, 4))
class_counts = df["spam"].value_counts().sort_index()
sns.barplot(x=["Ham", "Spam"], y=class_counts.values, palette=["#4CAF50", "#F44336"])
plt.title("Combined Dataset Class Distribution")
plt.xlabel("Message Type")
plt.ylabel("Count")
for i, v in enumerate(class_counts.values):
    plt.text(i, v + (v * 0.01), str(v), ha='center', fontweight='bold')
plt.tight_layout()
plt.savefig("results/spam_class_distribution.png")
plt.show()

# === Train/test split ===
X = df["text"]
y = df["spam"]
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# === TF-IDF Vectorization ===
vectorizer = TfidfVectorizer(stop_words="english", max_features=3000)
X_train_tfidf = vectorizer.fit_transform(X_train)
X_test_tfidf = vectorizer.transform(X_test)

# === Model training ===
model = LogisticRegression(max_iter=200)
model.fit(X_train_tfidf, y_train)

# === Predictions ===
y_pred = model.predict(X_test_tfidf)

# === Evaluation ===
print("Accuracy:", accuracy_score(y_test, y_pred))
report = classification_report(y_test, y_pred)
print(report)

# Save report
with open("results/spam_report.txt", "w") as f:
    f.write(report)

# === Confusion matrix ===
cm = confusion_matrix(y_test, y_pred)
sns.heatmap(
    cm,
    annot=True,
    fmt="d",
    cmap="Blues",
    xticklabels=["Ham", "Spam"],
    yticklabels=["Ham", "Spam"],
)
plt.title("Spam Detection Confusion Matrix")
plt.xlabel("Predicted")
plt.ylabel("Actual")
plt.tight_layout()
plt.savefig("results/spam_confusion_matrix.png")
plt.show()

import pickle
# Save both the model and vectorizer
with open("backend/models/spam_model.pkl", "wb") as f:
    pickle.dump(model, f)
with open("backend/models/vectorizer.pkl", "wb") as f:
    pickle.dump(vectorizer, f)
print("Spam model and vectorizer saved!")