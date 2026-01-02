"use client";
import { useSocket } from '../../hooks/useSocket';
import { useState } from 'react';

export default function SocketTestPage() {
    const { status, lastMessage, sendMessage } = useSocket();
    const [payload, setPayload] = useState('{"kind": "ping"}');

    return (
        <div className="p-8 space-y-4">
            <h1 className="text-2xl font-bold">Socket Test</h1>
            
            <div className="flex gap-2 items-center">
                <span>Status:</span>
                <span className={`px-2 py-1 rounded font-bold ${
                    status === 'connected' ? 'bg-green-500 text-white' : 
                    status === 'connecting' ? 'bg-yellow-500 text-black' : 'bg-red-500 text-white'
                }`}>
                    {status.toUpperCase()}
                </span>
            </div>

            <div className="border p-4 rounded bg-gray-100">
                <h2 className="font-bold mb-2">Last Message Received:</h2>
                <pre className="text-sm overflow-auto max-h-40">
                    {lastMessage ? JSON.stringify(lastMessage, null, 2) : 'No messages yet'}
                </pre>
            </div>

            <div className="space-y-2">
                <textarea 
                    className="w-full border p-2 font-mono text-sm"
                    rows={4}
                    value={payload}
                    onChange={e => setPayload(e.target.value)}
                />
                <button 
                    onClick={() => {
                        try {
                            sendMessage(JSON.parse(payload));
                        } catch {
                            alert("Invalid JSON");
                        }
                    }}
                    disabled={status !== 'connected'}
                    className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                    Send Message
                </button>
            </div>
        </div>
    );
}
