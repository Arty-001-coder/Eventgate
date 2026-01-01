"use client";

import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Shield, Users, UserPlus, Check, X, Lock, ChevronLeft } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import eventsData from '../../../admin/events.json';

const NUM_ORANGE_DOTS = 27;

gsap.registerPlugin(useGSAP);

export default function ClubMonitorPage() {
  const router = useRouter();
  const params = useParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dots, setDots] = React.useState<{id: number, isOrange: boolean}[]>([]);
  
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState(false);
  const correctPassword = "OneEclipse01"; // Hardcoded for simplified demo as requested

  // Background Dots Effect
  React.useEffect(() => {
    const TOTAL_DOTS = 400;
    const orangeIndices = new Set<number>();
    while(orangeIndices.size < NUM_ORANGE_DOTS) {
        orangeIndices.add(Math.floor(Math.random() * TOTAL_DOTS));
    }
    const newDots = Array.from({ length: TOTAL_DOTS }).map((_, i) => ({
        id: i,
        isOrange: orangeIndices.has(i)
    }));
    setDots(newDots);
  }, []);

  // Auth Animation
  useGSAP(() => {
      if(!isAuthenticated) {
         gsap.fromTo(".anim-auth", 
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "power2.out" }
         );
      } else {
          // Dashboard entrance
          gsap.fromTo(".anim-dashboard", 
              { y: 20, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "power2.out", delay: 0.2 }
          );
      }
  }, { dependencies: [isAuthenticated], scope: containerRef });

  const handleLogin = (e: React.FormEvent) => {
      e.preventDefault();
      if(password === correctPassword) {
          setIsAuthenticated(true);
          setError(false);
      } else {
          setError(true);
          gsap.fromTo(".anim-shake", { x: -5 }, { x: 5, duration: 0.1, repeat: 5, yoyo: true, clearProps: "x" });
      }
  };

  const onlineCount = eventsData.clubUsers ? eventsData.clubUsers.filter(u => u.online).length : 0;

  return (
    <div ref={containerRef} className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden font-sans">
      
       {/* Background Dots */}
       <div className="absolute inset-0 z-0 grid grid-cols-[repeat(auto-fill,minmax(40px,1fr))] gap-4 p-8 pointer-events-none opacity-40">
          {dots.map(dot => (
              <div 
                  key={dot.id} 
                  className={`w-1 h-1 rounded-full transition-colors duration-1000 ${
                      dot.isOrange 
                          ? 'bg-orange-600 shadow-[0_0_8px_rgba(234,88,12,0.8)] opacity-100' 
                          : 'bg-white opacity-20'
                  }`}
              ></div>
          ))}
      </div>

      {!isAuthenticated ? (
          // LOGIN OVERLAY
          <div className="flex-1 flex flex-col items-center justify-center relative z-10 p-4">
              <div className="max-w-md w-full bg-black border border-white/20 p-6 md:p-12 rounded-2xl anim-auth">
                  <div className="flex justify-center mb-6">
                      <div className="p-4 bg-orange-600/10 rounded-full text-orange-600">
                          <Lock size={32} />
                      </div>
                  </div>
                  <h1 className="text-3xl font-bold text-center mb-2 uppercase tracking-tight">Restricted Access</h1>
                  <p className="text-gray-400 text-center mb-8 text-sm">Enter admin credentials to access monitor.</p>
                  
                  <form onSubmit={handleLogin} className="space-y-4 anim-shake">
                      <input 
                        type="password" 
                        placeholder="Enter Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`w-full bg-transparent border ${error ? 'border-red-500' : 'border-white/30'} rounded-xl px-4 py-3 text-center text-lg focus:border-orange-600 outline-none transition-colors placeholder:text-gray-600`}
                        autoFocus
                      />
                      <button 
                        type="submit"
                        className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors uppercase tracking-widest text-sm"
                      >
                          Unlock Monitor
                      </button>
                  </form>
              </div>
          </div>
      ) : (
          // DASHBOARD
          <div className="flex-1 flex flex-col relative z-10">
              {/* Header */}
              <header className="anim-dashboard w-full px-4 py-4 md:px-8 md:py-6 border-b border-white/10">
                  <div className="flex items-center gap-4">
                      <button 
                          onClick={() => router.push(`/club/${params.id}`)}
                          className="p-2 mr-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white relative z-20"
                      >
                          <ChevronLeft size={24} />
                      </button>
                      <Shield className="text-orange-600" />
                      <h1 className="text-xl font-bold tracking-widest uppercase">Admin Monitor</h1>
                  </div>
              </header>

              <main className="flex-1 grid grid-cols-1 lg:grid-cols-2">
                  
                  {/* LEFT: Authorized Users */}
                  <div className="p-4 md:p-12 border-b md:border-b-0 md:border-r border-white/10 overflow-y-auto">
                      <div className="anim-dashboard mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <h2 className="text-xl md:text-2xl font-bold flex flex-wrap items-center gap-3">
                              <Users className="text-gray-400" size={24} />
                              AUTHORIZED USERS
                              
                              {/* Online Indicator */}
                              <div className="flex items-center gap-2 bg-white/5 px-4 py-2 md:px-5 md:py-3 ml-0 md:ml-4 rounded-full border border-white/10 mt-2 sm:mt-0">
                                  <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-600 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-600"></span>
                                  </span>
                                  <span className="text-[13px] font-bold tracking-widest text-gray-300">{onlineCount} ONLINE</span>
                              </div>
                          </h2>
                          <span className="text-xs font-mono text-gray-500 px-2 py-1 bg-white/5 rounded">
                              {eventsData.clubUsers?.length || 0} TOTAL
                          </span>
                      </div>

                      <div className="space-y-4">
                          {eventsData.clubUsers?.map((user) => (
                              <div key={user.id} className="anim-dashboard flex items-center justify-between p-4 bg-black border border-white/20 rounded-xl hover:border-white/40 transition-colors group">
                                  <div className="flex items-center gap-4">
                                      <div className={`w-2 h-2 rounded-full ${user.online ? 'bg-orange-600 shadow-[0_0_8px_rgba(234,88,12,0.6)]' : 'bg-gray-600'}`}></div>
                                      <div>
                                          <h3 className="font-bold text-lg group-hover:text-orange-500 transition-colors">{user.name}</h3>
                                          <p className="text-xs text-gray-400 uppercase tracking-wider">{user.lastLogin}</p>
                                      </div>
                                  </div>
                                  {user.online && (
                                      <span className="text-[10px] font-bold bg-orange-600 text-white px-2 py-1 rounded">
                                          ONLINE
                                      </span>
                                  )}
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* RIGHT: Join Requests */}
                  <div className="p-4 md:p-12 bg-white/5 h-full overflow-y-auto">
                      <div className="anim-dashboard mb-6 md:mb-8 flex items-center justify-between">
                          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-3">
                              <UserPlus className="text-gray-400" size={24} />
                              PENDING REQUESTS
                          </h2>
                          <span className="text-xs font-mono text-orange-500 px-2 py-1 bg-orange-500/10 rounded border border-orange-500/20">
                              {eventsData.joinRequests?.length || 0} PENDING
                          </span>
                      </div>

                      <div className="space-y-4">
                          {eventsData.joinRequests?.length > 0 ? (
                              eventsData.joinRequests.map((req) => (
                                  <div key={req.id} className="anim-dashboard p-6 bg-black border border-white/20 rounded-xl hover:border-orange-500/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                      <div>
                                          <h3 className="font-bold text-xl mb-1">{req.name}</h3>
                                          <div className="flex items-center gap-4 text-xs text-gray-400 font-mono">
                                              <span>{req.roll}</span>
                                              <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                                              <span>{req.timestamp}</span>
                                          </div>
                                      </div>
                                      
                                      <div className="flex items-center gap-3">
                                          <button className="flex-1 sm:flex-none p-3 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2">
                                              <Check size={16} /> Approve
                                          </button>
                                          <button className="flex-1 sm:flex-none p-3 bg-black border border-white/30 text-white rounded-lg hover:bg-red-900/20 hover:border-red-500 hover:text-red-500 transition-colors font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2">
                                              <X size={16} /> Reject
                                          </button>
                                      </div>
                                  </div>
                              ))
                          ) : (
                              <div className="p-8 border border-dashed border-white/10 rounded-xl text-center text-gray-500 anim-dashboard">
                                  No pending requests
                              </div>
                          )}
                      </div>
                  </div>

              </main>
          </div>
      )}

    </div>
  );
}
