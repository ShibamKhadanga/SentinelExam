import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Hook to manage WebSocket connection for real-time dashboard updates.
 */
export function useWebSocket(examId = null) {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);

  const connect = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const path = examId ? `/ws/dashboard/${examId}` : '/ws/dashboard';
    const url = `${protocol}//${host}${path}`;

    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        setIsConnected(true);
        // Start heartbeat
        const heartbeat = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send('ping');
          }
        }, 30000);
        ws._heartbeat = heartbeat;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'pong') return;
          setMessages((prev) => [...prev.slice(-100), data]); // Keep last 100
        } catch {
          /* ignore parse errors */
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        clearInterval(ws._heartbeat);
        // Reconnect after 3 seconds
        reconnectTimer.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };

      wsRef.current = ws;
    } catch {
      // Retry connection
      reconnectTimer.current = setTimeout(connect, 5000);
    }
  }, [examId]);

  const disconnect = useCallback(() => {
    clearTimeout(reconnectTimer.current);
    if (wsRef.current) {
      clearInterval(wsRef.current._heartbeat);
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    messages,
    isConnected,
    clearMessages,
    lastMessage: messages[messages.length - 1] || null,
  };
}
