import React, { useState, useEffect, useRef } from 'react';
import { VideoFeed } from './components/VideoFeed';
import { Dashboard } from './components/Dashboard';
import { AlertPanel } from './components/AlertPanel';
import { StatusIndicator } from './components/StatusIndicator';
import { useWebSocket } from './hooks/useWebSocket';
import { Camera, AlertTriangle, Activity, Clock } from 'lucide-react';

function App() {
  const [isDetectionActive, setIsDetectionActive] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({
    totalDetections: 0,
    highConfidenceDetections: 0,
    uptime: 0
  });
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  
  const { 
    isConnected, 
    lastDetection, 
    connect, 
    disconnect, 
    sendFrame,
    startDetection,
    stopDetection 
  } = useWebSocket('ws://localhost:8000/ws');

  useEffect(() => {
    if (isConnected) {
      setConnectionStatus('connected');
    } else {
      setConnectionStatus('disconnected');
    }
  }, [isConnected]);

  useEffect(() => {
    if (lastDetection && lastDetection.accident_detected) {
      const newAlert = {
        id: Date.now(),
        timestamp: lastDetection.timestamp,
        confidence: lastDetection.confidence,
        regions: lastDetection.regions
      };
      setAlerts(prev => [newAlert, ...prev].slice(0, 10));
      
      setStats(prev => ({
        ...prev,
        totalDetections: prev.totalDetections + 1,
        highConfidenceDetections: prev.highConfidenceDetections + (lastDetection.confidence > 0.7 ? 1 : 0)
      }));
    }
  }, [lastDetection]);

  const handleStartDetection = () => {
    setIsDetectionActive(true);
    startDetection();
  };

  const handleStopDetection = () => {
    setIsDetectionActive(false);
    stopDetection();
  };

  const handleConnect = () => {
    connect();
  };

  const handleDisconnect = () => {
    disconnect();
    setIsDetectionActive(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Camera className="w-8 h-8 text-blue-500" />
            <h1 className="text-2xl font-bold">Accident Detection System</h1>
          </div>
          <StatusIndicator status={connectionStatus} />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Feed Section */}
          <div className="lg:col-span-2 space-y-6">
            <VideoFeed 
              isActive={isDetectionActive}
              onFrameCapture={sendFrame}
            />
            
            {/* Control Panel */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Control Panel
              </h2>
              <div className="flex flex-wrap gap-4">
                {!isConnected ? (
                  <button
                    onClick={handleConnect}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
                  >
                    Connect to Server
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleDisconnect}
                      className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors"
                    >
                      Disconnect
                    </button>
                    {!isDetectionActive ? (
                      <button
                        onClick={handleStartDetection}
                        className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors"
                      >
                        Start Detection
                      </button>
                    ) : (
                      <button
                        onClick={handleStopDetection}
                        className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-semibold transition-colors"
                      >
                        Stop Detection
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Alerts Panel */}
            <AlertPanel alerts={alerts} />
            
            {/* Dashboard Stats */}
            <Dashboard stats={stats} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
