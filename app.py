from flask import Flask, request, jsonify
import pickle
import numpy as np
import os
import random
from datetime import datetime, timedelta

app = Flask(__name__)

# Enable CORS manually
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
    return response

# Create models folder if it doesn't exist
os.makedirs("models", exist_ok=True)

# Load AI models with better error handling
try:
    print("Looking for model files...")
    
    if not os.path.exists("models/malware_model.pkl"):
        print("malware_model.pkl not found - creating demo models...")
        from sklearn.ensemble import RandomForestClassifier
        from sklearn.feature_extraction.text import TfidfVectorizer
        import warnings
        warnings.filterwarnings('ignore')
        
        # Create simple demo models
        demo_malware_model = RandomForestClassifier()
        X_demo = np.random.rand(10, 5)
        y_demo = np.random.randint(0, 2, 10)
        demo_malware_model.fit(X_demo, y_demo)
        
        with open("models/malware_model.pkl", "wb") as f:
            pickle.dump(demo_malware_model, f)
        print("Created demo malware model")
        
        demo_vectorizer = TfidfVectorizer()
        demo_texts = ["hello world", "win money now", "free gift", "normal message"]
        demo_vectorizer.fit(demo_texts)
        
        with open("models/vectorizer.pkl", "wb") as f:
            pickle.dump(demo_vectorizer, f)
            
        demo_spam_model = RandomForestClassifier()
        X_spam_demo = demo_vectorizer.transform(demo_texts)
        y_spam_demo = [0, 1, 1, 0]
        demo_spam_model.fit(X_spam_demo.toarray(), y_spam_demo)
        
        with open("models/spam_model.pkl", "wb") as f:
            pickle.dump(demo_spam_model, f)
        print("Created demo spam model")
        
    # Load the models
    malware_model = pickle.load(open("models/malware_model.pkl", "rb"))
    spam_model = pickle.load(open("models/spam_model.pkl", "rb")) 
    vectorizer = pickle.load(open("models/vectorizer.pkl", "rb"))
    print("AI Models loaded successfully!")
    
except Exception as e:
    print(f"Error loading models: {e}")
    exit(1)

@app.route('/predict/malware', methods=['POST', 'OPTIONS'])
def predict_malware():
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        data = request.json
        features = np.array([data['features']])
        prediction = malware_model.predict(features)[0]
        confidence = max(malware_model.predict_proba(features)[0])
        return jsonify({
            "prediction": "malware" if prediction == 1 else "benign", 
            "confidence": float(confidence)
        })
    except Exception as e:
        return jsonify({"error": str(e), "prediction": "demo", "confidence": 0.85})

@app.route('/predict/spam', methods=['POST', 'OPTIONS'])
def predict_spam():
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        data = request.json
        text_vectorized = vectorizer.transform([data['text']])
        prediction = spam_model.predict(text_vectorized)[0]
        confidence = max(spam_model.predict_proba(text_vectorized)[0])
        return jsonify({
            "prediction": "spam" if prediction == 1 else "ham", 
            "confidence": float(confidence)
        })
    except Exception as e:
        return jsonify({"error": str(e), "prediction": "demo", "confidence": 0.85})

@app.route('/')
def home():
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Cyber Security AI Application</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <style>
            /* Background gradient */
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
                min-height: 100vh;
                background: linear-gradient(120deg, #a8edea, #fed6e3);
            }

            /* Main container */
            .main-container {
                max-width: 1200px;
                margin: 0 auto;
                background: #fff;
                padding: 2rem;
                border-radius: 1.2rem;
                box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
            }

            /* Title */
            h1 {
                text-align: center;
                color: #4b4efc;
                margin-bottom: 0.5rem;
            }

            .subtitle {
                text-align: center;
                color: #555;
                margin-bottom: 2rem;
            }

            /* Tab buttons */
            .tab-buttons {
                display: flex;
                gap: 10px;
                margin-bottom: 2rem;
                justify-content: center;
            }

            .tab-button {
                background: #4be4fc;
                border: none;
                color: white;
                padding: 12px 24px;
                border-radius: 0.6rem;
                cursor: pointer;
                font-size: 1rem;
                transition: 0.3s;
            }

            .tab-button:hover {
                background: #34c0d1;
            }

            .tab-button.active {
                background: #4b4efc;
            }

            /* Tab content */
            .tab-content {
                margin: 2rem 0;
            }

            .tab-panel {
                display: none;
            }

            .tab-panel.active {
                display: block;
            }

            /* Input areas */
            .input-group {
                margin-bottom: 1.5rem;
            }

            .input-group label {
                display: block;
                margin-bottom: 0.5rem;
                color: #333;
                font-weight: bold;
            }

            input, textarea {
                width: 100%;
                padding: 12px;
                font-size: 0.95rem;
                border: 1px solid #ccc;
                border-radius: 0.6rem;
                outline: none;
                resize: none;
                margin-bottom: 1rem;
                box-sizing: border-box;
            }

            textarea {
                height: 120px;
            }

            /* Analysis button */
            .analyse-button {
                background: #4be4fc;
                border: none;
                color: white;
                padding: 12px 30px;
                border-radius: 0.6rem;
                cursor: pointer;
                font-size: 1rem;
                transition: 0.3s;
                display: block;
                margin: 0 auto;
            }

            .analyse-button:hover {
                background: #34c0d1;
            }

            /* Results */
            .result {
                margin: 2rem 0;
                padding: 20px;
                border-radius: 0.8rem;
                border: 2px solid;
            }

            .safe {
                background: #d4edda;
                border-color: #c3e6cb;
                color: #155724;
            }

            .threat {
                background: #f8d7da;
                border-color: #f5c6cb;
                color: #721c24;
            }

            /* Charts container */
            .charts-container {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin: 2rem 0;
            }

            .chart-box {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 0.8rem;
                border: 1px solid #e9ecef;
            }

            .chart-title {
                text-align: center;
                margin-bottom: 1rem;
                color: #333;
                font-weight: bold;
            }

            .chart-wrapper {
                position: relative;
                height: 250px;
            }
        </style>
    </head>
    <body>
        <div class="main-container">
            <h1>Cyber Security AI Dashboard</h1>
            <div class="subtitle">Advanced threat detection using machine learning</div>
            
            <div class="tab-buttons">
                <button class="tab-button active" onclick="showTab('malware')">Malware Detection</button>
                <button class="tab-button" onclick="showTab('spam')">Spam Detection</button>
            </div>

            <!-- Malware Tab -->
            <div id="malwareTab" class="tab-panel active">
                <div class="tab-content">
                    <div class="input-group">
                        <label for="malwareInput">Enter feature values (comma-separated):</label>
                        <input type="text" id="malwareInput" placeholder="For example: 0.1, 0.5, 0.3, 0.2, 0.8">
                    </div>
                    <button class="analyse-button" onclick="predictMalware()">Analyse for Malware</button>
                </div>
            </div>

            <!-- Spam Tab -->
            <div id="spamTab" class="tab-panel">
                <div class="tab-content">
                    <div class="input-group">
                        <label for="spamInput">Enter message to analyse:</label>
                        <textarea id="spamInput" placeholder="Type your message here..."></textarea>
                    </div>
                    <button class="analyse-button" onclick="predictSpam()">Analyse for Spam</button>
                </div>
            </div>

            <!-- Results Section -->
            <div id="result"></div>

            <!-- Charts Section -->
            <div class="charts-container">
                <div class="chart-box">
                    <div class="chart-title">Confidence Analysis</div>
                    <div class="chart-wrapper">
                        <canvas id="confidenceChart"></canvas>
                    </div>
                </div>
                <div class="chart-box">
                    <div class="chart-title">Threat Distribution</div>
                    <div class="chart-wrapper">
                        <canvas id="threatChart"></canvas>
                    </div>
                </div>
                <div class="chart-box">
                    <div class="chart-title">Detection History</div>
                    <div class="chart-wrapper">
                        <canvas id="historyChart"></canvas>
                    </div>
                </div>
                <div class="chart-box">
                    <div class="chart-title">Risk Level Timeline</div>
                    <div class="chart-wrapper">
                        <canvas id="timelineChart"></canvas>
                    </div>
                </div>
            </div>
        </div>

        <script>
            let charts = {};
            let analysisHistory = [];
            let threatStatistics = { malware: 0, spam: 0, benign: 0, ham: 0 };

            // Show/hide tabs
            function showTab(tabName) {
                // Hide all tabs
                document.querySelectorAll('.tab-panel').forEach(tab => {
                    tab.classList.remove('active');
                });
                document.querySelectorAll('.tab-button').forEach(button => {
                    button.classList.remove('active');
                });
                
                // Show selected tab
                document.getElementById(tabName + 'Tab').classList.add('active');
                event.target.classList.add('active');
            }

            // Malware prediction
            async function predictMalware() {
                const input = document.getElementById('malwareInput').value;
                if (!input) {
                    alert('Please enter some numerical values');
                    return;
                }
                const features = input.split(',').map(num => parseFloat(num.trim()));
                
                try {
                    const response = await fetch('/predict/malware', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({features: features})
                    });
                    const result = await response.json();
                    displayResult(result, 'Malware Analysis');
                    updateThreatStatistics(result, 'malware');
                } catch (error) {
                    alert('Error: ' + error.message);
                }
            }

            // Spam prediction  
            async function predictSpam() {
                const text = document.getElementById('spamInput').value;
                if (!text) {
                    alert('Please enter a message');
                    return;
                }
                
                try {
                    const response = await fetch('/predict/spam', {
                        method: 'POST', 
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({text: text})
                    });
                    const result = await response.json();
                    displayResult(result, 'Spam Analysis');
                    updateThreatStatistics(result, 'spam');
                } catch (error) {
                    alert('Error: ' + error.message);
                }
            }

            // Display results
            function displayResult(result, title) {
                const isThreat = result.prediction.includes('malware') || result.prediction.includes('spam');
                const className = isThreat ? 'threat' : 'safe';
                
                document.getElementById('result').innerHTML = `
                    <div class="result ${className}">
                        <h3>${title}</h3>
                        <p><strong>Result:</strong> ${result.prediction.toUpperCase()}</p>
                        <p><strong>Confidence Level:</strong> ${(result.confidence * 100).toFixed(2)}%</p>
                        <p><strong>Status:</strong> ${isThreat ? 'THREAT DETECTED - Immediate action recommended' : 'System secure - No threats identified'}</p>
                    </div>
                `;

                // Add to history
                analysisHistory.push({
                    confidence: result.confidence,
                    label: `Analysis ${analysisHistory.length + 1}`,
                    isThreat: isThreat,
                    type: title.includes('Malware') ? 'malware' : 'spam',
                    timestamp: new Date()
                });
                
                updateAllCharts();
            }

            // Update threat statistics
            function updateThreatStatistics(result, analysisType) {
                if (analysisType === 'malware') {
                    if (result.prediction === 'malware') {
                        threatStatistics.malware++;
                    } else {
                        threatStatistics.benign++;
                    }
                } else {
                    if (result.prediction === 'spam') {
                        threatStatistics.spam++;
                    } else {
                        threatStatistics.ham++;
                    }
                }
            }

            // Update all charts
            function updateAllCharts() {
                updateConfidenceChart();
                updateThreatChart();
                updateHistoryChart();
                updateTimelineChart();
            }

            function updateConfidenceChart() {
                const ctx = document.getElementById('confidenceChart').getContext('2d');
                if (charts.confidence) charts.confidence.destroy();
                
                charts.confidence = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: analysisHistory.map(h => h.label),
                        datasets: [{
                            label: 'Confidence Score',
                            data: analysisHistory.map(h => h.confidence),
                            backgroundColor: analysisHistory.map(h => h.isThreat ? '#dc3545' : '#28a745'),
                            borderColor: analysisHistory.map(h => h.isThreat ? '#c82333' : '#1e7e34'),
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: { 
                                beginAtZero: true, 
                                max: 1.0,
                                title: {
                                    display: true,
                                    text: 'Confidence Level'
                                }
                            }
                        }
                    }
                });
            }

            function updateThreatChart() {
                const ctx = document.getElementById('threatChart').getContext('2d');
                if (charts.threat) charts.threat.destroy();
                
                const threatData = [
                    threatStatistics.malware,
                    threatStatistics.benign,
                    threatStatistics.spam,
                    threatStatistics.ham
                ];
                
                charts.threat = new Chart(ctx, {
                    type: 'pie',
                    data: {
                        labels: ['Malware', 'Benign', 'Spam', 'Ham'],
                        datasets: [{
                            data: threatData,
                            backgroundColor: ['#dc3545', '#28a745', '#ffc107', '#17a2b8'],
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false
                    }
                });
            }

            function updateHistoryChart() {
                const ctx = document.getElementById('historyChart').getContext('2d');
                if (charts.history) charts.history.destroy();
                
                // Group by analysis type
                const malwareAnalyses = analysisHistory.filter(h => h.type === 'malware').length;
                const spamAnalyses = analysisHistory.filter(h => h.type === 'spam').length;
                
                charts.history = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Malware Analyses', 'Spam Analyses'],
                        datasets: [{
                            data: [malwareAnalyses, spamAnalyses],
                            backgroundColor: ['#4b4efc', '#4be4fc'],
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false
                    }
                });
            }

            function updateTimelineChart() {
                const ctx = document.getElementById('timelineChart').getContext('2d');
                if (charts.timeline) charts.timeline.destroy();
                
                // Generate timeline data (last 10 analyses)
                const recentHistory = analysisHistory.slice(-10);
                const labels = recentHistory.map(h => 
                    h.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                );
                const data = recentHistory.map(h => h.confidence);
                
                charts.timeline = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Risk Level',
                            data: data,
                            borderColor: '#4b4efc',
                            backgroundColor: 'rgba(75, 78, 252, 0.1)',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: { 
                                beginAtZero: true, 
                                max: 1.0,
                                title: {
                                    display: true,
                                    text: 'Risk Level'
                                }
                            }
                        }
                    }
                });
            }

            // Initialize with malware tab
            showTab('malware');
        </script>
    </body>
    </html>
    """

if __name__ == '__main__':
    print("Starting Cyber Security AI Application at: http://localhost:5000")
    app.run(debug=True, port=5000)