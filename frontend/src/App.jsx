// src/App.jsx
import React, { useState, useEffect } from 'react';
import './App.css';
import { FaMoon, FaSun } from 'react-icons/fa';
import AttackMatrix from './components/AttackMatrix';
import AttackAnalysis from './components/AttackAnalysis'; // 引入 AttackAnalysis 組件
import { tactics } from './components/AttackData';
import AlertBox from './components/AlertBox'; // 引入 AlertBox 組件

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
      console.log('Received data:', data);

      if (data.eventType === 'update') {
        if (data.log && data.log.content && data.log.filePath) {
          // 單個警報，檢查是否已存在，若不存在則添加
          setLogs((prevLogs) => {
            const exists = prevLogs.some(
              (log) =>
                log.filePath === data.log.filePath &&
                log.content === data.log.content
            );
            if (!exists) {
              updateAttackCounts([data.log]);
              updateHighlightedTechniques([data.log]);
              return [data.log, ...prevLogs];
            }
            return prevLogs;
          });
        } else if (Array.isArray(data.logs)) {
          // 多個警報，僅添加不存在的警報
          const validLogs = data.logs.filter(
            (log) => log && log.content && log.filePath
          );

          setLogs((prevLogs) => {
            const existingLogKeys = new Set(
              prevLogs.map((log) => `${log.filePath}-${log.content}`)
            );

            const newUniqueLogs = validLogs.filter(
              (log) => !existingLogKeys.has(`${log.filePath}-${log.content}`)
            );

            if (newUniqueLogs.length > 0) {
              updateAttackCounts(newUniqueLogs);
              updateHighlightedTechniques(newUniqueLogs);

              // 根據時間戳排序，確保最新的在前
              newUniqueLogs.sort((a, b) => {
                const timeA = new Date(
                  a.content.split('] ')[0].replace('[', '')
                );
                const timeB = new Date(
                  b.content.split('] ')[0].replace('[', '')
                );
                return timeB - timeA;
              });

              return [...newUniqueLogs, ...prevLogs];
            }

            return prevLogs;
          });
        } else {
          console.error('Invalid update data:', data);
        }
      } else if (data.eventType === 'delete') {
        if (data.filePath) {
          setLogs((prevLogs) =>
            prevLogs.filter((log) => log.filePath !== data.filePath)
          );
          // 可選：根據需要更新攻擊計數和高亮技術
        } else {
          console.error('Invalid delete data:', data);
        }
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
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
      if (log.content.includes('Brute Force IO'))
        newCounts['Brute Force IO']++;
      if (log.content.includes('Denial of Service'))
        newCounts['Denial of Service']++;
    });

    setAttackCounts((prevCounts) => ({
      'Automated Collection':
        prevCounts['Automated Collection'] +
        newCounts['Automated Collection'],
      'Spoof Reporting Message':
        prevCounts['Spoof Reporting Message'] +
        newCounts['Spoof Reporting Message'],
      'Brute Force IO':
        prevCounts['Brute Force IO'] + newCounts['Brute Force IO'],
      'Denial of Service':
        prevCounts['Denial of Service'] + newCounts['Denial of Service'],
    }));
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

  // 移除特定的 log
  const removeLog = (filePath) => {
    setLogs((prevLogs) => prevLogs.filter((log) => log.filePath !== filePath));
    // 可選：根據需要更新攻擊計數和高亮技術
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
            logs.map((log) => (
              <AlertBox
                key={`${log.filePath}-${log.content}`}
                log={log}
                onRemove={removeLog}
              />
            ))
          ) : (
            <p className="no-log">No log files found.</p>
          )}
        </div>

        <div className="chart-section">
          <AttackMatrix highlightedTechniques={highlightedTechniques} />
          {/* <AttackAnalysis attackCounts={attackCounts} /> */}
        </div>
      </div>
    </div>
  );
}

export default App;
