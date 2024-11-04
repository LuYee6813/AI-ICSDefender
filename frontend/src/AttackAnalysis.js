// AttackAnalysis.js
import React from 'react';
import './AttackAnalysis.css'; // 引入分離的 CSS 文件
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AttackAnalysis = ({ attackCounts }) => {
  const chartData = {
    labels: [
      'Automated Collection',
      'Spoof Reporting Message',
      'Brute Force IO',
      'Denial of Service',
    ],
    datasets: [
      {
        label: 'Alert Count',
        data: Object.values(attackCounts),
        backgroundColor: ['#f39c12', '#c0392b', '#3498db', '#2ecc71'],
      },
    ],
  };

  return (
    <div className="chart-section">
      <h2>Attack Analysis</h2>
      {Object.values(attackCounts).some((count) => count > 0) ? (
        <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
      ) : (
        <p>No data available for chart</p>
      )}
    </div>
  );
};

export default AttackAnalysis;
