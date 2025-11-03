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

const API_BASE = "http://127.0.0.1:8000";

function App() {
  const [activeTab, setActiveTab] = useState('malware');
  const [malwareFeatures, setMalwareFeatures] = useState('');
  const [spamText, setSpamText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [analysisCount, setAnalysisCount] = useState(0); // Track analysis count separately
  const [threatStatistics, setThreatStatistics] = useState({
    malware: 0,
    benign: 0,
    spam: 0,
    ham: 0
  });

  // Reset function to clear everything
  const resetAnalysis = () => {
    setAnalysisHistory([]);
    setAnalysisCount(0);
    setThreatStatistics({
      malware: 0,
      benign: 0,
      spam: 0,
      ham: 0
    });
    setResult(null);
  };

  const predictMalware = async () => {
    if (!malwareFeatures.trim()) {
      alert('Please enter some numerical values');
      return;
    }

    setLoading(true);
    try {
      const features = malwareFeatures.split(',').map(num => parseFloat(num.trim()));
      
      // Ensure exactly 5 features
      if (features.length !== 5) {
        alert('Please enter exactly 5 numbers separated by commas');
        setLoading(false);
        return;
      }

      const response = await axios.post(`${API_BASE}/api/predict/malware`, {
        features: features
      });
      
      const newAnalysisCount = analysisCount + 1;
      setAnalysisCount(newAnalysisCount);
      
      setResult(response.data);
      updateThreatStatistics(response.data, 'malware');
      setAnalysisHistory(prev => [...prev, {
        ...response.data,
        timestamp: new Date(),
        type: 'malware',
        label: `Analysis ${newAnalysisCount}`
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
      
      const newAnalysisCount = analysisCount + 1;
      setAnalysisCount(newAnalysisCount);
      
      setResult(response.data);
      updateThreatStatistics(response.data, 'spam');
      setAnalysisHistory(prev => [...prev, {
        ...response.data,
        timestamp: new Date(),
        type: 'spam',
        label: `Analysis ${newAnalysisCount}`
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
        label: 'Safe Content',
        data: analysisHistory.map(h => h.prediction.includes('malware') || h.prediction.includes('spam') ? 0 : h.confidence),
        backgroundColor: '#28a745',
        borderColor: '#1e7e34',
        borderWidth: 1,
      },
      {
        label: 'Threat Detected',
        data: analysisHistory.map(h => h.prediction.includes('malware') || h.prediction.includes('spam') ? h.confidence : 0),
        backgroundColor: '#dc3545',
        borderColor: '#c82333',
        borderWidth: 1,
      }
    ],
  };

  const confidenceChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        align: 'center',
        labels: {
          boxWidth: 12,
          padding: 15,
          usePointStyle: true,
        }
      }
    },
    scales: {
      y: { 
        beginAtZero: true, 
        max: 1.0,
        title: {
          display: true,
          text: 'Confidence Level'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Analysis Number'
        }
      }
    }
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

  const threatChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        align: 'center',
        labels: {
          boxWidth: 12,
          padding: 15,
          usePointStyle: true,
        }
      }
    }
  };

  // Performance chart - more relevant for cybersecurity
  const performanceChartData = {
    labels: ['Threats Detected', 'Safe Content', 'Total Analyses'],
    datasets: [
      {
        data: [
          threatStatistics.malware + threatStatistics.spam,
          threatStatistics.benign + threatStatistics.ham,
          analysisHistory.length
        ],
        backgroundColor: ['#dc3545', '#28a745', '#6c757d'],
        borderWidth: 1,
      },
    ],
  };

  const performanceChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        align: 'center',
        labels: {
          boxWidth: 12,
          padding: 15,
          usePointStyle: true,
        }
      }
    }
  };

  // Timeline chart with analysis numbers - FIXED
  const timelineChartData = {
    labels: analysisHistory.slice(-10).map((h, index) => {
      const startIndex = Math.max(analysisCount - 9, 1);
      return `Analysis ${startIndex + index}`;
    }),
    datasets: [
      {
        label: 'Threat Confidence',
        data: analysisHistory.slice(-10).map(h => 
          h.prediction.includes('malware') || h.prediction.includes('spam') ? h.confidence : 0
        ),
        borderColor: '#dc3545',
        backgroundColor: 'rgba(220, 53, 69, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Safe Confidence',
        data: analysisHistory.slice(-10).map(h => 
          !h.prediction.includes('malware') && !h.prediction.includes('spam') ? h.confidence : 0
        ),
        borderColor: '#28a745',
        backgroundColor: 'rgba(40, 167, 69, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
      }
    ],
  };

  const timelineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        align: 'center',
        labels: {
          boxWidth: 12,
          padding: 15,
          usePointStyle: true,
        }
      }
    },
    scales: {
      y: { 
        beginAtZero: true, 
        max: 1.0,
        min: 0,
        title: {
          display: true,
          text: 'Confidence Level'
        },
        ticks: {
          stepSize: 0.2
        }
      },
      x: {
        title: {
          display: true,
          text: 'Analysis Sequence'
        }
      }
    }
  };

  return (
    <div className="main-container">
      <h1>Cyber Security AI Dashboard</h1>
      <div className="subtitle">Advanced threat detection using machine learning</div>
      
      {/* Reset Button */}
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <button 
          className="analyse-button" 
          onClick={resetAnalysis}
          style={{ backgroundColor: '#6c757d', margin: '0 10px' }}
        >
          Reset Analysis
        </button>
      </div>
      
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
            <label htmlFor="malwareInput">Enter exactly 5 feature values (comma-separated):</label>
            <input
              type="text"
              id="malwareInput"
              value={malwareFeatures}
              onChange={(e) => setMalwareFeatures(e.target.value)}
              placeholder="Example: 0.1, 0.5, 0.3, 0.2, 0.8"
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
          <div className="chart-title">Detection Confidence Scores</div>
          <div className="chart-description">Shows confidence level for each analysis. Green bars indicate safe content, red bars indicate threats.</div>
          <div className="chart-wrapper">
            <Bar data={confidenceChartData} options={confidenceChartOptions} />
          </div>
        </div>
        
        <div className="chart-box">
          <div className="chart-title">Threat Distribution</div>
          <div className="chart-description">Overall breakdown of detected content types across all analyses.</div>
          <div className="chart-wrapper">
            <Pie data={threatChartData} options={threatChartOptions} />
          </div>
        </div>
        
        <div className="chart-box">
          <div className="chart-title">Detection Summary</div>
          <div className="chart-description">Overview of threat detection performance and analysis statistics.</div>
          <div className="chart-wrapper">
            <Doughnut data={performanceChartData} options={performanceChartOptions} />
          </div>
        </div>
        
        <div className="chart-box">
          <div className="chart-title">Risk Trend Analysis</div>
          <div className="chart-description">Shows how confidence levels change across recent analyses. Higher values indicate stronger threat detection.</div>
          <div className="chart-wrapper">
            <Line data={timelineChartData} options={timelineChartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;