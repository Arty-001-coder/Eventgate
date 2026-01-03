"use client";

import { useEffect, useState } from 'react';

// Change this to your Render backend URL
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

export default function KeepAlivePage() {
  const [status, setStatus] = useState<'idle' | 'pinging' | 'success' | 'error'>('idle');
  const [lastPing, setLastPing] = useState<Date | null>(null);
  const [pingCount, setPingCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const pingServer = async () => {
    setStatus('pinging');
    setErrorMessage(null);
    
    const healthUrl = `${BACKEND_URL}/health`;
    console.log(`🔄 Attempting to ping: ${healthUrl}`);
    
    try {
      const response = await fetch(healthUrl, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStatus('success');
        setLastPing(new Date());
        setPingCount(prev => prev + 1);
        console.log(`✅ Ping successful at ${new Date().toLocaleTimeString()}:`, data);
      } else {
        throw new Error(`Server returned ${response.status}`);
      }
    } catch (error) {
      setStatus('error');
      const errorMsg = error instanceof Error ? error.message : 'Failed to ping server';
      setErrorMessage(`${errorMsg} (URL: ${healthUrl})`);
      console.error('❌ Ping failed:', error);
      console.error('❌ Backend URL being used:', BACKEND_URL);
    }
  };

  useEffect(() => {
    // Ping immediately on mount
    pingServer();

    // Then ping every 12 minutes (720000 ms)
    const interval = setInterval(() => {
      pingServer();
    }, 12 * 60 * 1000); // 12 minutes

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Keep-Alive Monitor</h1>
          <p className="text-gray-400 text-sm">Pinging backend every 12 minutes</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Status:</span>
            <span className={`font-bold ${
              status === 'success' ? 'text-green-500' :
              status === 'error' ? 'text-red-500' :
              status === 'pinging' ? 'text-orange-500' :
              'text-gray-400'
            }`}>
              {status === 'success' ? '✅ Online' :
               status === 'error' ? '❌ Error' :
               status === 'pinging' ? '⏳ Pinging...' :
               '⏸️ Idle'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-400">Backend URL:</span>
            <span className="text-sm font-mono text-orange-500 break-all text-right">
              {BACKEND_URL}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-400">Ping Count:</span>
            <span className="font-bold text-white">{pingCount}</span>
          </div>

          {lastPing && (
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Last Ping:</span>
              <span className="text-sm text-white">
                {lastPing.toLocaleTimeString()}
              </span>
            </div>
          )}

          {errorMessage && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-red-400 text-sm">{errorMessage}</p>
            </div>
          )}

          <button
            onClick={pingServer}
            disabled={status === 'pinging'}
            className="w-full py-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold transition-colors"
          >
            {status === 'pinging' ? 'Pinging...' : 'Ping Now'}
          </button>
        </div>

        <div className="text-center text-xs text-gray-500">
          <p>This page keeps your Render backend alive</p>
          <p>Keep this tab open in your browser</p>
        </div>
      </div>
    </div>
  );
}

