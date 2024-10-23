import React, { useState, useEffect } from 'react';
import './App.css';
import { FaBug, FaNetworkWired, FaTimesCircle } from 'react-icons/fa'; // 使用 FontAwesome 圖標
import { PiShieldWarningFill } from 'react-icons/pi'; // 使用 Pi 圖標

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
        // 將排序後的日誌內容顯示在最上方
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
      <div className="sidebar">
        <h1>ICS Defender Dashboard</h1>
        <h2>Real-time Alerts</h2>
        {logs.length > 0 ? (
          logs.map((log, index) => (
            <div key={index} className="alert-box">    
              <div className="alert-header">
                <FaNetworkWired className="alert-icon" />
                <h3 className="alert-title">ATT&CK Tactic: {log.tacticsName}</h3>
                <PiShieldWarningFill className="close-icon" title="Remove Log" />
              </div>
              <p className="alert-technique"><FaBug />Technique: {log.techniquesName}</p>
              <p className="alert-content">{log.content}</p>
            </div>
          ))
        ) : (
          <p className="no-log">No log files found.</p>
        )}
      </div>
    </div>
  );
}

export default App;
