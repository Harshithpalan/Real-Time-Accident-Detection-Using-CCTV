import { useState, useEffect, useRef, useCallback } from 'react';

export function useWebSocket(url) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastDetection, setLastDetection] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      wsRef.current = new WebSocket(url);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
        console.log('WebSocket connected');
      };

      wsRef.current.onclose = (event) => {
        setIsConnected(false);
        console.log('WebSocket disconnected:', event.code, event.reason);

        // Attempt reconnection if not manually closed
        if (event.code !== 1000 && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`Reconnection attempt ${reconnectAttemptsRef.current}`);
            connect();
          }, delay);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === 'detection_result') {
            setLastDetection(message);
          } else if (message.type === 'status') {
            console.log('Status update:', message);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
    }
  }, [url]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }
    
    setIsConnected(false);
  }, []);

  const sendFrame = useCallback((frameData) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message = {
        type: 'video_frame',
        data: frameData
      };
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const startDetection = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message = {
        type: 'start_detection'
      };
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const stopDetection = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message = {
        type: 'stop_detection'
      };
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    lastDetection,
    connect,
    disconnect,
    sendFrame,
    startDetection,
    stopDetection
  };
}
