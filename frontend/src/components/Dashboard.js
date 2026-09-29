import React from 'react';
import { Activity, AlertTriangle, Clock, TrendingUp } from 'lucide-react';

export function Dashboard({ stats }) {
  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <Activity className="w-5 h-5 mr-2" />
        Statistics
      </h2>
      
      <div className="space-y-4">
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2" />
              <span className="text-gray-300">Total Detections</span>
            </div>
            <span className="text-2xl font-bold text-white">{stats.totalDetections}</span>
          </div>
        </div>

        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <TrendingUp className="w-5 h-5 text-green-500 mr-2" />
              <span className="text-gray-300">High Confidence</span>
            </div>
            <span className="text-2xl font-bold text-white">{stats.highConfidenceDetections}</span>
          </div>
        </div>

        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-blue-500 mr-2" />
              <span className="text-gray-300">Session Time</span>
            </div>
            <span className="text-2xl font-bold text-white">{Math.floor(stats.uptime / 60)}m {stats.uptime % 60}s</span>
          </div>
        </div>
      </div>
    </div>
  );
}
