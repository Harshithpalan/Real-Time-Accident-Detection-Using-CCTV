import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export function AlertPanel({ alerts }) {
  const getConfidenceColor = (confidence) => {
    if (confidence > 0.8) return 'text-red-400';
    if (confidence > 0.6) return 'text-yellow-400';
    return 'text-green-400';
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <AlertTriangle className="w-5 h-5 mr-2 text-yellow-500" />
        Recent Alerts
      </h2>

      {alerts.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No alerts yet</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-gray-700 rounded-lg p-4 border-l-4 border-yellow-500"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-500 mr-2" />
                    <span className="font-semibold text-white">Accident Detected</span>
                  </div>
                  <div className="text-sm text-gray-400 mb-2">
                    {formatTime(alert.timestamp)}
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-400 mr-2">Confidence:</span>
                    <span className={`font-semibold ${getConfidenceColor(alert.confidence)}`}>
                      {(alert.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  {alert.regions && alert.regions.length > 0 && (
                    <div className="mt-2 text-sm text-gray-400">
                      Detected: {alert.regions.map(r => r.class).join(', ')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
