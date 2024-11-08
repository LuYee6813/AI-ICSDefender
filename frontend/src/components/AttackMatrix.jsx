// AttackMatrix.js
import React from 'react';
import { tactics } from './AttackData';
import './AttackMatrix.css';

function AttackMatrix({ highlightedTechniques }) {
  return (
    <div className="matrix-section">
      <h2>ATT&CK for ICS Matrix</h2>
      <div className="matrix-container">
        {tactics.map((tactic, index) => (
          <div key={index} className="tactic-column">
            <h3>{tactic.name}</h3>
            <p>{tactic.techniques.length} techniques</p>
            <ul>
              {tactic.techniques.map((technique, idx) => (
                <li
                  key={idx}
                  className={`technique-item ${
                    highlightedTechniques.includes(technique)
                      ? 'highlighted'
                      : ''
                  }`}
                >
                  {technique}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AttackMatrix;
