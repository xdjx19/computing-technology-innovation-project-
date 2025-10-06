import pandas as pd
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import seaborn as sns

# Load dataset
df = pd.read_csv("data/spam_dataset.csv")

# Basic info
print("Dataset size:", df.shape)
print(df.head())

# === Simple class distribution bar graph ===
sns.set(style="whitegrid")
plt.figure(figsize=(5, 4))
class_counts = df["spam"].value_counts().sort_index()  # ensure 0 (ham) then 1 (spam)
sns.barplot(x=["Ham", "Spam"], y=class_counts.values, palette=["#4CAF50", "#F44336"])
plt.title("Dataset Class Distribution")
plt.xlabel("Message Type")
plt.ylabel("Count")
for i, v in enumerate(class_counts.values):
    plt.text(i, v + (v * 0.01), str(v), ha='center', fontweight='bold')
plt.tight_layout()
plt.savefig("results/spam_class_distribution.png")
plt.show()

# Split features + labels
X = df["text"]
y = df["spam"]

# Train/test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# TF-IDF vectorization
vectorizer = TfidfVectorizer(stop_words="english", max_features=3000)
X_train_tfidf = vectorizer.fit_transform(X_train)
X_test_tfidf = vectorizer.transform(X_test)

# Model training
model = LogisticRegression(max_iter=200)
model.fit(X_train_tfidf, y_train)

# Predictions
y_pred = model.predict(X_test_tfidf)

# Evaluation
print("Accuracy:", accuracy_score(y_test, y_pred))
report = classification_report(y_test, y_pred)
print(report)

# Save report
with open("results/spam_report.txt", "w") as f:
    f.write(report)

# Confusion matrix
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
