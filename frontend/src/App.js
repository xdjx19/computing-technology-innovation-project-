import React, { useState } from 'react';
import axios from 'axios';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const API_BASE = "http://localhost:8000";

function App() {
  const [activeTab, setActiveTab] = useState('malware');
  const [malwareFeatures, setMalwareFeatures] = useState('');
  const [spamText, setSpamText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const predictMalware = async () => {
    setLoading(true);
    try {
      const features = malwareFeatures.split(',').map(Number);
      const response = await axios.post(`${API_BASE}/predict/malware`, {
        features: features
      });
      setResult(response.data);
      setHistory(prev => [...prev, { ...response.data, timestamp: new Date(), type: 'malware' }]);
    } catch (error) {
      alert('Error: ' + error.response?.data?.detail || error.message);
    }
    setLoading(false);
  };

  const predictSpam = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/predict/spam`, {
        text: spamText
      });
      setResult(response.data);
      setHistory(prev => [...prev, { ...response.data, timestamp: new Date(), type: 'spam' }]);
    } catch (error) {
      alert('Error: ' + error.response?.data?.detail || error.message);
    }
    setLoading(false);
  };

  // Chart data
  const predictionHistoryChart = {
    labels: history.map((_, i) => `Prediction ${i + 1}`),
    datasets: [
      {
        label: 'Confidence Score',
        data: history.map(h => h.confidence),
        backgroundColor: history.map(h => h.prediction === 'malware' || h.prediction === 'spam' ? '#F44336' : '#4CAF50'),
      }
    ]
  };

  const predictionDistributionChart = {
    labels: ['Benign/Ham', 'Malware/Spam'],
    datasets: [
      {
        data: [
          history.filter(h => h.prediction === 'benign' || h.prediction === 'ham').length,
          history.filter(h => h.prediction === 'malware' || h.prediction === 'spam').length
        ],
        backgroundColor: ['#4CAF50', '#F44336'],
      }
    ]
  };

  return (
    <div className="App" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Cybersecurity AI Dashboard</h1>
      
      {/* Tab Navigation */}
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => setActiveTab('malware')}
          style={{ marginRight: '10px', padding: '10px 20px' }}
        >
          Malware Detection
        </button>
        <button 
          onClick={() => setActiveTab('spam')}
          style={{ padding: '10px 20px' }}
        >
          Spam Detection
        </button>
      </div>

      {/* Input Forms */}
      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ccc' }}>
        {activeTab === 'malware' && (
          <div>
            <h3>Malware Detection</h3>
            <p>Enter feature values separated by commas:</p>
            <textarea
              value={malwareFeatures}
              onChange={(e) => setMalwareFeatures(e.target.value)}
              placeholder="0.1, 0.5, 0.3, ..."
              rows="3"
              style={{ width: '100%', marginBottom: '10px' }}
            />
            <button onClick={predictMalware} disabled={loading}>
              {loading ? 'Analyzing...' : 'Detect Malware'}
            </button>
          </div>
        )}

        {activeTab === 'spam' && (
          <div>
            <h3>Spam Detection</h3>
            <textarea
              value={spamText}
              onChange={(e) => setSpamText(e.target.value)}
              placeholder="Enter message text to analyze..."
              rows="5"
              style={{ width: '100%', marginBottom: '10px' }}
            />
            <button onClick={predictSpam} disabled={loading}>
              {loading ? 'Analyzing...' : 'Detect Spam'}
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      {result && (
        <div style={{ 
          padding: '20px', 
          backgroundColor: result.prediction.includes('malware') || result.prediction.includes('spam') ? '#ffebee' : '#e8f5e8',
          border: `2px solid ${result.prediction.includes('malware') || result.prediction.includes('spam') ? '#f44336' : '#4caf50'}`,
          marginBottom: '30px'
        }}>
          <h3>Analysis Result</h3>
          <p><strong>Prediction:</strong> {result.prediction}</p>
          <p><strong>Confidence:</strong> {(result.confidence * 100).toFixed(2)}%</p>
          <p><strong>Model:</strong> {result.model_used}</p>
        </div>
      )}

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <h3>Prediction Confidence</h3>
          <Bar 
            data={predictionHistoryChart}
            options={{ responsive: true }}
          />
        </div>
        <div>
          <h3>Prediction Distribution</h3>
          <Pie 
            data={predictionDistributionChart}
            options={{ responsive: true }}
          />
        </div>
      </div>

      {/* History Table */}
      {history.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <h3>Prediction History</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>Time</th>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>Type</th>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>Prediction</th>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>Confidence</th>
              </tr>
            </thead>
            <tbody>
              {history.slice().reverse().map((item, index) => (
                <tr key={index}>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    {item.timestamp.toLocaleTimeString()}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.type}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.prediction}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    {(item.confidence * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;