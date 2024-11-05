// src/components/AlertBox.jsx
import React, { useEffect, useState } from 'react';
import { FaBug, FaNetworkWired, FaTimesCircle } from 'react-icons/fa';

function AlertBox({ log, onRemove }) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // 延遲一點時間以確保 CSS 動畫能夠觸發
    const timer = setTimeout(() => {
      setAnimate(true);
    }, 100); // 可以根據需要調整延遲時間

    return () => clearTimeout(timer);
  }, []);

  if (!log) return null;

  return (
    <div className={`alert-box ${animate ? 'slide-in' : ''}`}>
      <div className="alert-header">
        <FaNetworkWired className="alert-icon" />
        <h3 className="alert-title">
          ATT&CK Tactic: {log.tacticsName || 'Unknown'}
        </h3>
        <FaTimesCircle
          className="close-icon"
          title="Remove Log"
          onClick={() => onRemove(log.filePath)}
        />
      </div>
      <p className="alert-technique">
        <FaBug /> Technique: {log.techniquesName || 'Unknown'}
      </p>
      <p className="alert-content">{log.content || 'No content provided.'}</p>
    </div>
  );
}

export default AlertBox;
