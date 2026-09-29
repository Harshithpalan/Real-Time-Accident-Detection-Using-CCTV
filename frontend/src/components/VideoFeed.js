import React, { useRef, useEffect, useState } from 'react';
import { Camera, VideoOff } from 'lucide-react';

export function VideoFeed({ isActive, onFrameCapture }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment'
        }
      });
      
      setStream(mediaStream);
      setIsCameraActive(true);
      setError(null);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError('Unable to access camera. Please ensure camera permissions are granted.');
      console.error('Camera error:', err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCameraActive(false);
    }
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const frameData = canvas.toDataURL('image/jpeg', 0.8);
    return frameData;
  };

  useEffect(() => {
    let intervalId;

    if (isActive && isCameraActive) {
      intervalId = setInterval(() => {
        const frameData = captureFrame();
        if (frameData && onFrameCapture) {
          onFrameCapture(frameData);
        }
      }, 100); // Capture frame every 100ms
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isActive, isCameraActive, onFrameCapture]);

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center">
          <Camera className="w-5 h-5 mr-2" />
          Video Feed
        </h2>
        <div className="flex gap-2">
          {!isCameraActive ? (
            <button
              onClick={startCamera}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
            >
              Start Camera
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors"
            >
              Stop Camera
            </button>
          )}
        </div>
      </div>

      <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center text-red-400">
            <div className="text-center">
              <VideoOff className="w-12 h-12 mx-auto mb-2" />
              <p>{error}</p>
            </div>
          </div>
        ) : !isCameraActive ? (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Camera className="w-12 h-12 mx-auto mb-2" />
              <p>Camera not active</p>
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            {isActive && (
              <div className="absolute top-4 right-4 bg-red-600 px-3 py-1 rounded-full text-sm font-semibold animate-pulse">
                ● LIVE DETECTION
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
        <span>Status: {isCameraActive ? 'Active' : 'Inactive'}</span>
        <span>Detection: {isActive ? 'Running' : 'Stopped'}</span>
      </div>
    </div>
  );
}
