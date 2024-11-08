// src/components/AlertBox.jsx
import React, { useEffect, useState } from 'react';
import { FaBug, FaNetworkWired, FaTimesCircle } from 'react-icons/fa';
import './AlertBox.css'; 

function AlertBox({ log, onRemove }) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // 延迟一段时间以确保 CSS 动画能够触发
    const timer = setTimeout(() => {
      setAnimate(true);
    }, 100); // 可以根据需要调整延迟时间

    return () => clearTimeout(timer);
  }, []);

  if (!log) return null;

  // 判断是否为 ZeroDay
  const isZeroDay = log.tacticsName === 'ZeroDay';

  return (
    <div
      className={`alert-box ${animate ? 'slide-in' : ''} ${
        isZeroDay ? 'zero-day-alert' : ''
      }`}
    >
      <div className="alert-header">
        <div className="alert-header-content">
          <FaNetworkWired className="alert-icon" />
          <h3 className="alert-title">
            ATT&CK Tactic: {log.tacticsName || '未知'}
          </h3>
        </div>
        <div className="close-icon-wrapper">
          <FaTimesCircle
            className="close-icon"
            title="刪除日誌"
            onClick={() => onRemove(log)}
          />
        </div>
      </div>
      <p className="alert-technique">
        <FaBug /> Technique: {log.techniquesName || '未知'}
      </p>
      <p className="alert-content">{log.content || '未提供內容。'}</p>
    </div>
  );
}

export default AlertBox;
