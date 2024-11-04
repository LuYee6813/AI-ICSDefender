// App.js
import React, { useState, useEffect } from 'react';
import './App.css';
import './AttackMatrix.css';
import {
  FaBug,
  FaNetworkWired,
  FaTimesCircle,
  FaMoon,
  FaSun,
} from 'react-icons/fa';
import AttackMatrix from './AttackMatrix';
import AttackAnalysis from './AttackAnalysis'; // 引入 AttackAnalysis 組件
import { tactics } from './AttackData';

function App() {
  const [logs, setLogs] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [attackCounts, setAttackCounts] = useState({
    'Automated Collection': 0,
    'Spoof Reporting Message': 0,
    'Brute Force IO': 0,
    'Denial of Service': 0,
  });
  const [highlightedTechniques, setHighlightedTechniques] = useState([]);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080');

    ws.onopen = () => {
      console.log('Connected to WebSocket');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.eventType === 'update') {
        setLogs(data.logs);
        updateAttackCounts(data.logs);
        updateHighlightedTechniques(data.logs);
      } else if (data.eventType === 'delete') {
        setLogs((prevLogs) =>
          prevLogs.filter((log) => log.filePath !== data.filePath)
        );
      }
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      ws.close();
    };
  }, []);

  // 切換主題
  const toggleTheme = () => {
    setIsDarkMode((prevMode) => !prevMode);
  };

  // 更新攻擊計數
  const updateAttackCounts = (logData) => {
    const newCounts = {
      'Automated Collection': 0,
      'Spoof Reporting Message': 0,
      'Brute Force IO': 0,
      'Denial of Service': 0,
    };

    logData.forEach((log) => {
      if (log.content.includes('Automated Collection'))
        newCounts['Automated Collection']++;
      if (log.content.includes('Spoof Reporting Message'))
        newCounts['Spoof Reporting Message']++;
      if (log.content.includes('Brute Force IO')) newCounts['Brute Force IO']++;
      if (log.content.includes('Denial of Service'))
        newCounts['Denial of Service']++;
    });

    setAttackCounts(newCounts);
  };

  // 更新高亮技術
  const updateHighlightedTechniques = (logData) => {
    const triggeredTechniques = [];

    logData.forEach((log) => {
      tactics.forEach((tactic) => {
        tactic.techniques.forEach((technique) => {
          if (log.content.includes(technique)) {
            triggeredTechniques.push(technique);
          }
        });
      });
    });

    const uniqueTechniques = [...new Set(triggeredTechniques)];
    setHighlightedTechniques(uniqueTechniques);
  };

  return (
    <div className={`dashboard ${isDarkMode ? 'dark' : 'light'}`}>
      <nav className="navbar">
        <h1>ICS Defender</h1>
        <button className="theme-toggle" onClick={toggleTheme}>
          {isDarkMode ? <FaSun /> : <FaMoon />}
        </button>
      </nav>

      <div className="content">
        <div className="sidebar">
          <h2>Real-time Alerts</h2>
          {logs.length > 0 ? (
            logs.map((log, index) => (
              <div
                key={index}
                className="alert-box"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="alert-header">
                  <FaNetworkWired className="alert-icon" />
                  <h3 className="alert-title">
                    ATT&CK Tactic: {log.tacticsName}
                  </h3>
                  <FaTimesCircle className="close-icon" title="Remove Log" />
                </div>
                <p className="alert-technique">
                  <FaBug /> Technique: {log.techniquesName}
                </p>
                <p className="alert-content">{log.content}</p>
              </div>
            ))
          ) : (
            <p className="no-log">No log files found.</p>
          )}
        </div>

        <div className="chart-matrix-section">
          <AttackMatrix highlightedTechniques={highlightedTechniques} />
          {/* <AttackAnalysis attackCounts={attackCounts} /> */}
        </div>
      </div>
    </div>
  );
}

export default App;
