'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

interface SocketMessage {
  kind: string;
  [key: string]: unknown;
}

interface SocketContextType {
  status: ConnectionStatus;
  lastMessage: SocketMessage | null;
  sendMessage: (message: SocketMessage) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

const WS_URL = 'ws://localhost:8080';

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [lastMessage, setLastMessage] = useState<SocketMessage | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const shouldConnect = useRef(true);

  useEffect(() => {
    const connect = () => {
      if (socketRef.current?.readyState === WebSocket.OPEN) return;

      setStatus('connecting');
      // console.log(`🔌 Connecting to ${WS_URL}...`);
      
      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        console.log('✅ Socket Connected');
        setStatus('connected');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // console.log('📥 Received:', data);
          setLastMessage(data);
        } catch {
          console.error('Failed to parse message:', event.data);
        }
      };

      ws.onclose = () => {
        console.log('❌ Socket Disconnected');
        setStatus('disconnected');
        socketRef.current = null;
        
        if (shouldConnect.current && !reconnectTimeoutRef.current) {
            reconnectTimeoutRef.current = setTimeout(() => {
                reconnectTimeoutRef.current = undefined;
                connect();
            }, 3000);
        }
      };

      ws.onerror = (err) => {
        console.error('⚠️ Socket Error:', err);
        ws.close();
      };

      socketRef.current = ws;
    };

    connect();

    return () => {
      shouldConnect.current = false;
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  const sendMessage = useCallback((message: SocketMessage) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.warn('⚠️ Cannot send: Socket not connected', message);
    }
  }, []);

  return (
    <SocketContext.Provider value={{ status, lastMessage, sendMessage }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocketContext() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketContext must be used within a SocketProvider');
  }
  return context;
}
