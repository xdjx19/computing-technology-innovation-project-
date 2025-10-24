import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
import { Bar, Pie, Doughnut, Line } from 'react-chartjs-2';

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
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [threatStatistics, setThreatStatistics] = useState({
    malware: 0,
    benign: 0,
    spam: 0,
    ham: 0
  });

  const predictMalware = async () => {
    if (!malwareFeatures.trim()) {
      alert('Please enter some numerical values');
      return;
    }

    setLoading(true);
    try {
      const features = malwareFeatures.split(',').map(num => parseFloat(num.trim()));
      const response = await axios.post(`${API_BASE}/api/predict/malware`, {
        features: features
      });
      
      setResult(response.data);
      updateThreatStatistics(response.data, 'malware');
      setAnalysisHistory(prev => [...prev, {
        ...response.data,
        timestamp: new Date(),
        type: 'malware',
        label: `Analysis ${prev.length + 1}`
      }]);
    } catch (error) {
      alert('Error: ' + (error.response?.data?.detail || error.message));
    }
    setLoading(false);
  };

  const predictSpam = async () => {
    if (!spamText.trim()) {
      alert('Please enter a message');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/api/predict/spam`, {
        text: spamText
      });
      
      setResult(response.data);
      updateThreatStatistics(response.data, 'spam');
      setAnalysisHistory(prev => [...prev, {
        ...response.data,
        timestamp: new Date(),
        type: 'spam',
        label: `Analysis ${prev.length + 1}`
      }]);
    } catch (error) {
      alert('Error: ' + (error.response?.data?.detail || error.message));
    }
    setLoading(false);
  };

  const updateThreatStatistics = (result, analysisType) => {
    setThreatStatistics(prev => {
      const newStats = { ...prev };
      if (analysisType === 'malware') {
        if (result.prediction === 'malware') {
          newStats.malware++;
        } else {
          newStats.benign++;
        }
      } else {
        if (result.prediction === 'spam') {
          newStats.spam++;
        } else {
          newStats.ham++;
        }
      }
      return newStats;
    });
  };

  // Chart data configurations
  const confidenceChartData = {
    labels: analysisHistory.map(h => h.label),
    datasets: [
      {
        label: 'Confidence Score',
        data: analysisHistory.map(h => h.confidence),
        backgroundColor: analysisHistory.map(h => 
          h.prediction.includes('malware') || h.prediction.includes('spam') ? '#dc3545' : '#28a745'
        ),
        borderColor: analysisHistory.map(h => 
          h.prediction.includes('malware') || h.prediction.includes('spam') ? '#c82333' : '#1e7e34'
        ),
        borderWidth: 1,
      },
    ],
  };

  const threatChartData = {
    labels: ['Malware', 'Benign', 'Spam', 'Ham'],
    datasets: [
      {
        data: [
          threatStatistics.malware,
          threatStatistics.benign,
          threatStatistics.spam,
          threatStatistics.ham,
        ],
        backgroundColor: ['#dc3545', '#28a745', '#ffc107', '#17a2b8'],
        borderWidth: 1,
      },
    ],
  };

  const historyChartData = {
    labels: ['Malware Analyses', 'Spam Analyses'],
    datasets: [
      {
        data: [
          analysisHistory.filter(h => h.type === 'malware').length,
          analysisHistory.filter(h => h.type === 'spam').length,
        ],
        backgroundColor: ['#4b4efc', '#4be4fc'],
        borderWidth: 1,
      },
    ],
  };

  const timelineChartData = {
    labels: analysisHistory.slice(-10).map(h => 
      h.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    ),
    datasets: [
      {
        label: 'Risk Level',
        data: analysisHistory.slice(-10).map(h => h.confidence),
        borderColor: '#4b4efc',
        backgroundColor: 'rgba(75, 78, 252, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
  };

  return (
    <div className="main-container">
      <h1>Cyber Security AI Dashboard</h1>
      <div className="subtitle">Advanced threat detection using machine learning</div>
      
      <div className="tab-buttons">
        <button 
          className={`tab-button ${activeTab === 'malware' ? 'active' : ''}`}
          onClick={() => setActiveTab('malware')}
        >
          Malware Detection
        </button>
        <button 
          className={`tab-button ${activeTab === 'spam' ? 'active' : ''}`}
          onClick={() => setActiveTab('spam')}
        >
          Spam Detection
        </button>
      </div>

      {/* Malware Tab */}
      {activeTab === 'malware' && (
        <div className="tab-content">
          <div className="input-group">
            <label htmlFor="malwareInput">Enter feature values (comma-separated):</label>
            <input
              type="text"
              id="malwareInput"
              value={malwareFeatures}
              onChange={(e) => setMalwareFeatures(e.target.value)}
              placeholder="For example: 0.1, 0.5, 0.3, 0.2, 0.8"
            />
          </div>
          <button 
            className="analyse-button" 
            onClick={predictMalware}
            disabled={loading}
          >
            {loading ? 'Analysing...' : 'Analyse for Malware'}
          </button>
        </div>
      )}

      {/* Spam Tab */}
      {activeTab === 'spam' && (
        <div className="tab-content">
          <div className="input-group">
            <label htmlFor="spamInput">Enter message to analyse:</label>
            <textarea
              id="spamInput"
              value={spamText}
              onChange={(e) => setSpamText(e.target.value)}
              placeholder="Type your message here..."
            />
          </div>
          <button 
            className="analyse-button" 
            onClick={predictSpam}
            disabled={loading}
          >
            {loading ? 'Analysing...' : 'Analyse for Spam'}
          </button>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className={`result ${result.prediction.includes('malware') || result.prediction.includes('spam') ? 'threat' : 'safe'}`}>
          <h3>{activeTab === 'malware' ? 'Malware Analysis' : 'Spam Analysis'}</h3>
          <p><strong>Result:</strong> {result.prediction.toUpperCase()}</p>
          <p><strong>Confidence Level:</strong> {(result.confidence * 100).toFixed(2)}%</p>
          <p><strong>Status:</strong> {result.prediction.includes('malware') || result.prediction.includes('spam') 
            ? 'THREAT DETECTED - Immediate action recommended' 
            : 'System secure - No threats identified'}</p>
        </div>
      )}

      {/* Charts Section */}
      <div className="charts-container">
        <div className="chart-box">
          <div className="chart-title">Confidence Analysis</div>
          <div className="chart-wrapper">
            <Bar data={confidenceChartData} options={chartOptions} />
          </div>
        </div>
        
        <div className="chart-box">
          <div className="chart-title">Threat Distribution</div>
          <div className="chart-wrapper">
            <Pie data={threatChartData} options={chartOptions} />
          </div>
        </div>
        
        <div className="chart-box">
          <div className="chart-title">Detection History</div>
          <div className="chart-wrapper">
            <Doughnut data={historyChartData} options={chartOptions} />
          </div>
        </div>
        
        <div className="chart-box">
          <div className="chart-title">Risk Level Timeline</div>
          <div className="chart-wrapper">
            <Line data={timelineChartData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;