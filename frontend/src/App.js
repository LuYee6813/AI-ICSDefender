import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    // 建立 WebSocket 連線
    const ws = new WebSocket('ws://localhost:8080');

    ws.onopen = () => {
      console.log('Connected to WebSocket');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.eventType === 'update') {
        // 更新日誌內容，顯示最新行在最上方
        setLogs(data.logs);
      } else if (data.eventType === 'delete') {
        // 刪除對應文件的所有內容
        setLogs(prevLogs => prevLogs.filter(log => log.filePath !== data.filePath));
      }
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <div className="dashboard">
      <div className="header">
        <h1>AI ICS Defender - Alerts Dashboard</h1>
      </div>
      <div className="content">
        <div className="alerts-panel">
          <h2>Real-time Alerts</h2>
          <div className="alerts-container">
            {logs.length > 0 ? (
              logs.map((log, index) => (
                <div key={index} className="alert-box">    
                  <div className="alert-header">
                    <span className="alert-tactics">ATT&CK Tactics: {log.tacticsName}</span>
                    <span className="alert-techniques">{log.techniquesName}</span>
                  </div>
                  <div className="alert-content">{log.content}</div>
                </div>
              ))
            ) : (
              <p className="no-logs">No log files found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
