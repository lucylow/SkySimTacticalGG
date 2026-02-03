import React from 'react';
import { ObjectiveDecision } from '../types/objectives';

interface Props {
  decision: ObjectiveDecision;
}

const ObjectiveDecisionCard: React.FC<Props> = ({ decision }) => {
  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'SECURE': return 'text-green-600 bg-green-100';
      case 'CONTEST': return 'text-yellow-600 bg-yellow-100';
      case 'AVOID': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md space-y-4 border border-gray-200">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Objective Decision</h2>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getRecommendationColor(decision.recommendation)}`}>
          {decision.recommendation}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Confidence:</span>
          <span className="font-medium">{(decision.confidence * 100).toFixed(1)}%</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Expected Value:</span>
          <span className="font-medium">{decision.expectedValue.toFixed(3)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Win Prob Delta:</span>
          <span className="font-medium text-blue-600">+{decision.winProbDelta.toFixed(1)}%</span>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Rationale:</h3>
        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
          {decision.rationale.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg text-center">
        <p className="text-blue-800 font-bold text-lg uppercase tracking-wider">
          "{decision.coachCall}"
        </p>
      </div>
    </div>
  );
};

export default ObjectiveDecisionCard;
