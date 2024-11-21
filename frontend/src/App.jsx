// src/App.jsx
import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { FaMoon, FaSun } from 'react-icons/fa';
import AttackMatrix from './components/AttackMatrix';
import AttackAnalysis from './components/AttackAnalysis';
import { tactics } from './components/AttackData';
import AlertBox from './components/AlertBox';

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

  const wsRef = useRef(null);

  useEffect(() => {
    // 從伺服器獲取現有的日誌
    fetch('http://localhost:5001/api/logs')
      .then((response) => response.json())
      .then((data) => {
        setLogs(data);
      })
      .catch((error) => {
        console.error('獲取日誌時出錯：', error);
      });

    // WebSocket 連接
    wsRef.current = new WebSocket('ws://localhost:8080');
    const ws = wsRef.current;

    ws.onopen = () => {
      console.log('已連接到 WebSocket');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('收到資料：', data);

      if (data.eventType === 'update') {
        if (Array.isArray(data.logs)) {
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
        }
      } else if (data.eventType === 'delete') {
        if (data.filePath && data.content) {
          setLogs((prevLogs) =>
            prevLogs.filter(
              (log) =>
                log.filePath !== data.filePath || log.content !== data.content
            )
          );
        } else {
          console.error('無效的刪除資料：', data);
        }
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket 錯誤：', error);
    };

    ws.onclose = () => {
      console.log('WebSocket 連線已關閉');
    };

    return () => {
      ws.close();
    };
  }, []);

  // 使用 useEffect 監聽 logs 狀態的變化，更新攻擊計數和高亮技術
  useEffect(() => {
    updateAttackCounts(logs);
    updateHighlightedTechniques(logs);
  }, [logs]);

  // 切換主題
  const toggleTheme = () => {
    setIsDarkMode((prevMode) => !prevMode);
  };

  // 更新攻擊計數
  const updateAttackCounts = (allLogs) => {
    const newCounts = {
      'Automated Collection': 0,
      'Spoof Reporting Message': 0,
      'Brute Force IO': 0,
      'Denial of Service': 0,
    };

    allLogs.forEach((log) => {
      if (log.content.includes('Automated Collection'))
        newCounts['Automated Collection']++;
      if (log.content.includes('Spoof Reporting Message'))
        newCounts['Spoof Reporting Message']++;
      if (log.content.includes('Brute Force IO'))
        newCounts['Brute Force IO']++;
      if (log.content.includes('Denial of Service'))
        newCounts['Denial of Service']++;
    });

    setAttackCounts(newCounts);
  };

  // 更新高亮技術
  const updateHighlightedTechniques = (allLogs) => {
    const triggeredTechniques = [];

    allLogs.forEach((log) => {
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

  // 移除特定的日誌
  const removeLog = (log) => {
    setLogs((prevLogs) =>
      prevLogs.filter(
        (l) => l.filePath !== log.filePath || l.content !== log.content
      )
    );

    // 向後端發送刪除請求
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          eventType: 'deleteLogLine',
          filePath: log.filePath,
          content: log.content,
        })
      );
    }
  };

  return (
    <div className={`dashboard ${isDarkMode ? 'dark' : 'light'}`}>
      <nav className="navbar">
        <h1>工控場域AI攻擊偵測系統</h1>
        <button className="theme-toggle" onClick={toggleTheme}>
          {isDarkMode ? <FaSun /> : <FaMoon />}
        </button>
      </nav>

      <div className="content">
        <div className="sidebar">
          <h2>即時警報</h2>
          {logs.length > 0 ? (
            logs.map((log) => (
              <AlertBox
                key={`${log.filePath}-${log.content}`}
                log={log}
                onRemove={removeLog}
              />
            ))
          ) : (
            <p className="no-log">尚未偵測到警告。</p>
          )}
        </div>

        <div className="chart-section">
          <AttackMatrix highlightedTechniques={highlightedTechniques} />
          {/* 如果需要顯示攻擊分析，可以取消註解以下組件 */}
          {/* <AttackAnalysis attackCounts={attackCounts} /> */}
        </div>
      </div>
    </div>
  );
}

export default App;
