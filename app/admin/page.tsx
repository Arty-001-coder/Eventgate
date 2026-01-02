"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import React, { useRef, useState, useEffect, Suspense } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { CalendarDays, ShieldCheck, UserPlus, LogOut, Check, X, Mail, MapPin, ArrowRight, ChevronLeft } from 'lucide-react';
import { useSocket } from '../../hooks/useSocket';

gsap.registerPlugin(useGSAP);

type AdminTab = 'events' | 'auth' | 'registrations';

const NUM_ORANGE_DOTS = 108;

// Keep other static data for now, but events will come from server
// const { registeredClubs, registeredAdmins } = eventsData; // fully removed usage

interface AdminEvent {
    id: string;
    clubId: string; // Added clubId
    club: string;
    event: string;
    date: string;
    time: string;
    endTime: string;
    venue: string;
    desc: string;
    status: string;
}

interface ServerEventPayload {
  event_id: string;
  club_id: string; // Added club_id
  club_name: string;
  event_name: string;
  event_date?: string;
  event_timestamp: number;
  event_start_time?: string;
  event_end_time?: string;
  event_venue?: string;
  event_description?: string;
  status: string;
}

interface AuthRequestRaw {
    id: string;
    type: 'club' | 'admin';
    name: string;
    rollNo: string;
    clubName?: string;
    timestamp: number;
    status: string;
}

function AdminDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lastMessage, sendMessage } = useSocket(); // Destructure sendMessage
  const [activeTab, setActiveTab] = useState<AdminTab>('events');
  const [registrationTab, setRegistrationTab] = useState<'clubs' | 'admins'>('clubs');
  const [orangeDots, setOrangeDots] = useState<{r: number, c: number}[]>([]);
  const [modalOpen, setModalOpen] = useState<{type: 'reject' | 'contact', eventId: string, clubId: string} | null>(null); // Added clubId to state
  const [mobileView, setMobileView] = useState<'menu' | 'content'>('menu');
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Get roll number from URL params or localStorage, default to "XXXXXXXX"
  const [adminRollNo, setAdminRollNo] = useState<string>('XXXXXXXX');
  
  useEffect(() => {
    const rollNoFromUrl = searchParams.get('roll_no');
    const rollNoFromStorage = localStorage.getItem('admin_roll_no');
    
    if (rollNoFromUrl) {
      setAdminRollNo(rollNoFromUrl);
      // Also store in localStorage for persistence
      localStorage.setItem('admin_roll_no', rollNoFromUrl);
    } else if (rollNoFromStorage) {
      setAdminRollNo(rollNoFromStorage);
    } else {
      setAdminRollNo('XXXXXXXX');
    }
  }, [searchParams]);

  // State for Real Events
  // State for Persistent Data
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [rawAuthRequests, setRawAuthRequests] = useState<AuthRequestRaw[]>([]);
  const [registrationsRaw, setRegistrationsRaw] = useState<{
        clubs: { id: string, name: string, members: number }[],
        admins: { id: string, name: string, rollNo: string, lastLogin: number }[]
  }>({ clubs: [], admins: [] });

  React.useEffect(() => {
      if (lastMessage && lastMessage.kind === 'full_state') {
          console.log("📥 Admin received full state update");
          
          // 1. Update Events
          if (Array.isArray(lastMessage.events)) {
              const serverEvents = lastMessage.events as unknown as ServerEventPayload[];
              setEvents(serverEvents.map((e) => ({
                   id: e.event_id,
                   clubId: e.club_id,
                   club: e.club_name,
                   event: e.event_name,
                   date: e.event_date 
                      ? new Date(e.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                      : new Date(e.event_timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
                   time: e.event_start_time || "00:00",
                   endTime: e.event_end_time || "00:00",
                   venue: e.event_venue || "TBD",
                   desc: e.event_description || "",
                   status: e.status
              })));
          }
          // 2. Update Auth Requests
          if ('authRequests' in lastMessage && Array.isArray(lastMessage.authRequests)) {
              setRawAuthRequests(lastMessage.authRequests as AuthRequestRaw[]);
          }
           // 3. Update Registrations
          if ('registrations' in lastMessage) {
               setRegistrationsRaw(lastMessage.registrations as {
                   clubs: { id: string, name: string, members: number }[],
                   admins: { id: string, name: string, rollNo: string, lastLogin: number }[]
               });
          }
      }
  }, [lastMessage]);

  // Group events by date
  const groupedEvents = React.useMemo(() => {
    return events.reduce((acc, event) => {
      const dateKey = event.date;
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(event);
      return acc;
    }, {} as Record<string, AdminEvent[]>);
  }, [events]);

  React.useEffect(() => {
    // Generate random positions for orange dots on client-side
    const dots = [];
    for (let i = 0; i < NUM_ORANGE_DOTS; i++) {
        dots.push({
            r: Math.floor(Math.random() * 40), // Adjust based on height
            c: Math.floor(Math.random() * 20)  // Adjust based on width
        });
    }
    setOrangeDots(dots);
  }, []);

  useGSAP(() => {
    // Bento Grid Animation
    gsap.from(".anim-bento", {
      scale: 0.9,
      opacity: 0,
      duration: 0.8,
      stagger: 0.1,
      ease: "power2.out",
      delay: 0.2
    });
  }, { scope: containerRef });

  useGSAP(() => {
    gsap.fromTo(".anim-tab-item", 
      { y: 20, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.4,
        stagger: 0.05,
        ease: "power2.out",
        clearProps: "transform,opacity" // Ensure clean state after animation
      }
    );
  }, { scope: containerRef, dependencies: [activeTab, registrationTab] });

  const getTabStyle = (tab: AdminTab) => {
    return activeTab === tab 
      ? 'bg-orange-600 text-black' 
      : 'bg-black text-white hover:bg-zinc-900';
  };

  // State for current time to ensure purity and update relative times
  const [now, setNow] = useState(0);

  React.useEffect(() => {
    setNow(Date.now()); // Initial update on client mount
    const interval = setInterval(() => setNow(Date.now()), 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Helper for relative time - wrapped in useCallback to be stable for useMemo
  const timeAgo = React.useCallback((timestamp: number) => {
    if (now === 0) return ""; // Avoid flash of wrong time during hydration/initial mount
    
    // timestamp is in ms
    const seconds = Math.floor((now - timestamp) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hrs ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " mins ago";
    return Math.floor(seconds) + " seconds ago";
  }, [now]);

  // Derived Auth Requests
  const authRequestsList = React.useMemo(() => {
       return rawAuthRequests.map((req) => ({
           id: req.id,
           type: req.type,
           name: req.name,
           rollNo: req.rollNo,
           clubName: req.clubName,
           timestamp: timeAgo(req.timestamp),
           rawTimestamp: req.timestamp,
           status: req.status
       }));
  }, [rawAuthRequests, timeAgo]);

  // Derived Registrations Data
  const registrationsData = React.useMemo(() => {
        return {
            clubs: registrationsRaw.clubs,
            admins: registrationsRaw.admins.map(a => ({
                ...a,
                lastLogin: timeAgo(a.lastLogin)
            }))
        };
  }, [registrationsRaw, timeAgo]);

  return (
    <div ref={containerRef} className="h-screen bg-white text-black font-sans flex overflow-hidden">
      
      {/* LEFT PANEL - Navigation (30% on desktop, 100% on mobile menu view) */}
      <div className={`${mobileView === 'content' ? 'hidden md:flex' : 'flex'} w-full md:w-[30%] h-full p-8 border-r border-gray-100 flex-col justify-center relative overflow-hidden transition-all duration-300`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 z-0 opacity-20" 
             style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
        </div>
        
        {/* Accent Orange Dots (Randomized) */}
        {orangeDots.map((pos, i) => (
            <div 
                key={i}
                className="absolute w-[2px] h-[2px] bg-orange-600 rounded-full z-0"
                style={{ 
                    top: `${pos.r * 24 + 11}px`, 
                    left: `${pos.c * 24 + 11}px` 
                }}
            ></div>
        ))}

        <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold tracking-tight">DASHBOARD</h1>
                <div className="px-4 py-1.5 bg-black rounded-full flex items-center justify-center text-white font-bold text-xs tracking-widest shadow-lg">
                    {adminRollNo}
                </div>
            </div>
        
        {/* Bento Grid Navigation */}
        <div className="grid grid-cols-2 grid-rows-[1.5fr_1fr_auto] gap-4 h-[450px]">
             {/* Rolled Events - Big Vertical Block */}
             <button 
                onClick={() => { if (adminRollNo !== 'XXXXXXXX') { setActiveTab('events'); setMobileView('content'); } }}
                disabled={adminRollNo === 'XXXXXXXX'}
                className={`anim-bento row-span-2 rounded-3xl p-6 flex flex-col justify-between transition-colors duration-300 ${getTabStyle('events')} ${adminRollNo === 'XXXXXXXX' ? 'opacity-50 cursor-not-allowed' : ''}`}
             >
                <div className="self-end">
                    <CalendarDays size={32} strokeWidth={1.5} />
                </div>
                <div className="text-left">
                    <span className="block text-2xl font-bold leading-none">ROLLED</span>
                    <span className="block text-2xl font-bold leading-none">EVENTS</span>
                </div>
             </button>

             {/* Authentications - Top Right Block */}
             <button 
                onClick={() => { if (adminRollNo !== 'XXXXXXXX') { setActiveTab('auth'); setMobileView('content'); } }}
                disabled={adminRollNo === 'XXXXXXXX'}
                className={`anim-bento rounded-3xl p-6 flex flex-col justify-between transition-colors duration-300 ${getTabStyle('auth')} ${adminRollNo === 'XXXXXXXX' ? 'opacity-50 cursor-not-allowed' : ''}`}
             >
                <div className="self-end">
                    <ShieldCheck size={28} strokeWidth={1.5} />
                </div>
                <div className="text-left">
                    <span className="block text-sm font-bold">AUTHENTICATIONS</span>
                </div>
             </button>

             {/* Registrations - Bottom Right Block */}
             <button 
                onClick={() => { if (adminRollNo !== 'XXXXXXXX') { setActiveTab('registrations'); setMobileView('content'); } }}
                disabled={adminRollNo === 'XXXXXXXX'}
                className={`anim-bento rounded-3xl p-6 flex flex-col justify-between transition-colors duration-300 ${getTabStyle('registrations')} ${adminRollNo === 'XXXXXXXX' ? 'opacity-50 cursor-not-allowed' : ''}`}
             >
                <div className="self-end">
                    <UserPlus size={28} strokeWidth={1.5} />
                </div>
                <div className="text-left">
                    <span className="block text-sm font-bold">REGISTRATIONS</span>
                </div>
             </button>

             {/* Logout - Bottom Full Width Block */}
             <button 
                onClick={() => router.push('/')}
                className="anim-bento col-span-2 rounded-3xl p-5 flex items-center justify-between transition-colors duration-300 bg-white border border-black border-2 text-black hover:border-orange-600"
             >
                <div className="text-left">
                    <span className="block text-xl font-bold">LOGOUT</span>
                </div>
                <div>
                    <LogOut size={28} strokeWidth={1.5} />
                </div>
             </button>
        </div>
        </div>
      </div>

      {/* RIGHT PANEL - Content */}
      <div className={`${mobileView === 'menu' ? 'hidden md:block' : 'block'} w-full md:w-[70%] h-full bg-white p-8 md:p-12 pt-8 md:pt-12 overflow-y-auto`}>
         {/* Top Bar with Mobile Back Button */}
         <div className="flex justify-between items-center mb-12">
            <button 
                onClick={() => setMobileView('menu')}
                className="md:hidden p-2 -ml-2 hover:bg-gray-100 rounded-full text-black transition-colors"
            >
                <ChevronLeft size={28} />
            </button>
            <div className="flex-1 flex justify-end">
            <div className="flex items-center gap-6">
                <div className="px-6 py-2 bg-black rounded-full flex items-center justify-center text-white font-bold text-sm tracking-widest shadow-lg">
                    {adminRollNo}
                </div>
            </div>
            </div>
         </div>
         
         {/* Content Area */}
         <div className="anim-content">
             {adminRollNo === 'XXXXXXXX' ? (
                 <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
                     <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 text-gray-400">ACCESS RESTRICTED</h2>
                     <p className="text-gray-500 text-xl font-light mb-8 max-w-md">
                         Please authenticate through the admin portal to access this dashboard.
                     </p>
                     <button 
                         onClick={() => router.push('/')}
                         className="px-8 py-3 bg-black text-white font-bold rounded-full hover:bg-zinc-800 transition-colors shadow-lg"
                     >
                         GO TO ADMIN PORTAL
                     </button>
                 </div>
             ) : (
                 <>
             {activeTab === 'events' && (
                 <div>

                     <h2 className="anim-tab-item text-6xl font-bold tracking-tight mb-2">ROLLED EVENTS</h2>
                     <p className="anim-tab-item text-gray-500 text-xl font-light mb-8">Manage upcoming planned club events.</p>
                     <div className="space-y-8">
                        {Object.entries(groupedEvents).map(([date, events]) => (
                            <div key={date}>
                                <h3 className="text-2xl font-bold mb-4 ml-1">{date}</h3>
                                <div className={`space-y-4 ${events.length > 2 ? 'max-h-[500px] overflow-y-auto pr-2 custom-scrollbar' : ''}`}>
                                    {events.map((evt) => (
                                        <div key={evt.id} className={`anim-tab-item p-6 border rounded-2xl transition-all bg-white group hover:shadow-lg ${evt.status === 'accepted' ? 'border-black' : 'border-gray-200 hover:border-black'}`}>
                                            <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4 gap-4 md:gap-0">
                                                <div>
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <span className="font-bold text-xl md:text-2xl">{evt.club}</span>
                                                        <span className="w-1.5 h-1.5 bg-black rounded-full"></span>
                                                        <span className="text-sm font-bold text-orange-600 uppercase tracking-wide">{evt.event}</span>
                                                    </div>
                                                    <p className="text-gray-600 text-sm max-w-xl">{evt.desc}</p>
                                                </div>
                                                <div className="text-left md:text-right">
                                                    <span className="flex items-center gap-2 text-xl md:text-3xl font-bold">
                                                        {evt.time} <ArrowRight className="text-orange-600" size={24} strokeWidth={3} /> {evt.endTime}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex gap-6 mb-6 text-sm font-medium text-gray-500 border-b border-gray-100 pb-4">
                                                <div className="flex items-center gap-2">
                                                    <MapPin size={16} />
                                                    <span>{evt.venue}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-row items-center gap-2 md:gap-4 overflow-x-auto no-scrollbar">
                                                <div className="flex w-full md:w-auto mt-4 md:mt-0 gap-2 md:gap-3">
                                                    {evt.status !== 'accepted' && (
                                                        <>
                                                            <button 
                                                                onClick={() => {
                                                                    if(confirm("Are you sure you want to ACCEPT this event?")) {
                                                                        sendMessage({ kind: 'Event_Accepted', club_id: evt.clubId, event_id: evt.id });
                                                                    }
                                                                }}
                                                                className="flex-1 md:flex-none justify-center px-4 md:px-6 py-2 bg-black text-white text-xs md:text-sm font-bold rounded-full hover:bg-zinc-800 transition-colors flex items-center gap-2 shadow-lg"
                                                            >
                                                                <Check size={14} className="md:w-4 md:h-4" /> ACCEPT
                                                            </button>
                                                            <button 
                                                                onClick={() => setModalOpen({type: 'reject', clubId: evt.clubId, eventId: evt.id})}
                                                                className="flex-1 md:flex-none justify-center px-4 md:px-6 py-2 border border-black text-black text-xs md:text-sm font-bold rounded-full hover:bg-gray-50 transition-colors flex items-center gap-2"
                                                            >
                                                                <X size={14} className="md:w-4 md:h-4" /> REJECT
                                                            </button>
                                                        </>
                                                    )}
                                                    <button 
                                                        onClick={() => setModalOpen({type: 'contact', eventId: evt.id, clubId: evt.clubId})}
                                                        className={`flex-1 md:flex-none justify-center px-4 md:px-6 py-2 text-xs md:text-sm font-bold transition-colors flex items-center gap-2 whitespace-nowrap ${
                                                            evt.status === 'accepted' 
                                                            ? 'bg-orange-500 text-black rounded-full hover:bg-transparent border border-orange-500 shadow-lg' 
                                                            : 'text-gray-500 hover:text-black'
                                                        }`}
                                                    >
                                                        <Mail size={14} className="md:w-4 md:h-4" /> CONTACT
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                     </div>
                 </div>
             )}

             {activeTab === 'auth' && (
                 <div>
                     <h2 className="anim-tab-item text-4xl md:text-6xl font-bold tracking-tight mb-2">AUTHENTICATIONS</h2>
                     <p className="anim-tab-item text-gray-500 text-xl font-light mb-8">Review pending admin access and club creation requests.</p>                      
                     <div className="space-y-12">
                        {/* Club Creation Requests */}
                        <div>
                            <h3 className="anim-tab-item text-2xl font-bold mb-4">Club Requests</h3>
                            <div className="space-y-4 ml-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                {authRequestsList.filter(req => req.type === 'club').map((req) => (
                                    <div key={req.id} className="anim-tab-item p-6 border border-gray-200 rounded-2xl bg-white hover:border-black transition-all flex items-center justify-between group">
                                        <div className="flex-1 mr-4">
                                            <div className="text-xl font-medium leading-relaxed max-w-3xl">
                                                Request to create <span className="text-orange-600 font-bold">{req.clubName}</span> network by <span className="text-orange-600 font-bold">{req.name}</span>, <span className="text-orange-600 font-bold">{req.rollNo}</span>
                                            </div>
                                            <div className="md:hidden mt-3 pt-3 border-t border-gray-100">
                                                <span className="text-sm text-gray-400 font-medium">{req.timestamp}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-2 md:gap-3">
                                            <span className="hidden md:block text-sm text-gray-400 font-medium mr-4">{req.timestamp}</span>
                                            {req.status !== 'accepted' && (
                                                <div className="flex flex-col gap-2 md:gap-3">
                                                    <button 
                                                        onClick={() => {
                                                            if(confirm(`Accept request to create "${req.clubName}"?`)) {
                                                                sendMessage({ kind: 'Club_Creation_Accepted', request_id: req.id });
                                                            }
                                                        }}
                                                        className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center hover:bg-zinc-800 transition-colors"
                                                    >
                                                        <Check size={20} />
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            if(confirm(`Reject request to create "${req.clubName}"?`)) {
                                                                sendMessage({ kind: 'Club_Creation_Rejected', request_id: req.id });
                                                            }
                                                        }}
                                                        className="w-10 h-10 border border-black text-black rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
                                                    >
                                                        <X size={20} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {authRequestsList.filter(req => req.type === 'club').length === 0 && (
                                    <p className="text-gray-400 italic ml-1">No pending club creation requests.</p>
                                )}
                            </div>
                        </div>

                        {/* Admin Access Requests */}
                        <div>
                            <h3 className="anim-tab-item text-2xl font-bold mb-4">Admin Requests</h3>
                            <div className="space-y-4 ml-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                {authRequestsList.filter(req => req.type === 'admin').map((req) => (
                                    <div key={req.id} className="anim-tab-item p-6 border border-gray-200 rounded-2xl bg-white hover:border-black transition-all flex items-center justify-between group">
                                        <div className="flex-1 mr-4">
                                            <div className="text-xl font-medium leading-relaxed max-w-3xl">
                                                <span className="text-orange-600 font-bold">{req.name}</span>, <span className="text-orange-600 font-bold">{req.rollNo}</span> has requested to access admin page
                                            </div>
                                            <div className="md:hidden mt-3 pt-3 border-t border-gray-100">
                                                <span className="text-sm text-gray-400 font-medium">{req.timestamp}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-2 md:gap-3">
                                            <span className="hidden md:block text-sm text-gray-400 font-medium mr-4">{req.timestamp}</span>
                                            {req.status !== 'accepted' && (
                                                <div className="flex flex-col gap-2 md:gap-3">
                                                    <button 
                                                        onClick={() => {
                                                            if(confirm(`Grant admin access to ${req.name}?`)) {
                                                                sendMessage({ kind: 'Admin_Access_Accepted', request_id: req.id });
                                                            }
                                                        }}
                                                        className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center hover:bg-zinc-800 transition-colors"
                                                    >
                                                        <Check size={20} />
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            if(confirm(`Reject admin access for ${req.name}?`)) {
                                                                sendMessage({ kind: 'Admin_Access_Rejected', request_id: req.id });
                                                            }
                                                        }}
                                                        className="w-10 h-10 border border-black text-black rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
                                                    >
                                                        <X size={20} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {authRequestsList.filter(req => req.type === 'admin').length === 0 && (
                                    <p className="text-gray-400 italic ml-1">No pending admin access requests.</p>
                                )}
                            </div>
                        </div>
                     </div>
                 </div>
             )}

             {activeTab === 'registrations' && (
                 <div>
                     <h2 className="anim-tab-item text-6xl font-bold tracking-tight mb-8">REGISTRATIONS</h2>
                     <p className="anim-tab-item text-gray-500 text-xl font-light mb-8">Monitor new student and club registrations.</p>
                     
                     {/* Sub-Tabs */}
                     <div className="anim-tab-item flex gap-8 mb-8 border-b border-gray-100 pb-1">
                         <button 
                            onClick={() => setRegistrationTab('clubs')}
                            className={`text-2xl font-bold pb-2 transition-colors ${registrationTab === 'clubs' ? 'text-orange-600 border-b-4 border-orange-600' : 'text-gray-300 hover:text-gray-500'}`}
                         >
                             CLUBS
                         </button>
                         <button 
                            onClick={() => setRegistrationTab('admins')}
                            className={`text-2xl font-bold pb-2 transition-colors ${registrationTab === 'admins' ? 'text-orange-600 border-b-4 border-orange-600' : 'text-gray-300 hover:text-gray-500'}`}
                         >
                             ADMINS
                         </button>
                     </div>

                     <div className="mt-8">
                         {registrationTab === 'clubs' ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {registrationsData.clubs.map((club) => (
                                     <div key={club.id} className="anim-tab-item p-8 border border-gray-200 rounded-3xl bg-white hover:border-black transition-all hover:shadow-lg flex flex-col justify-between h-auto min-h-[160px] group">
                                         <div className="mb-4">
                                             <h3 className="text-3xl font-bold tracking-tight mb-1 group-hover:text-orange-600 transition-colors break-words">{club.name}</h3>
                                         </div>
                                         <div className="flex items-center gap-2">
                                             <div className="w-2 h-2 bg-black rounded-full"></div>
                                             <span className="font-bold text-lg">{club.members} Members</span>
                                         </div>
                                     </div>
                                ))}
                                {registrationsData.clubs.length === 0 && (
                                    <p className="text-gray-400 italic col-span-2">No registered clubs found.</p>
                                )}
                             </div>
                         ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {registrationsData.admins.map((admin) => (
                                     <div key={admin.id} className="anim-tab-item p-8 border border-gray-200 rounded-3xl bg-white hover:border-black transition-all hover:shadow-lg flex flex-col justify-between h-auto min-h-[160px] group">
                                         <div className="mb-4">
                                             <h3 className="text-2xl font-bold tracking-tight mb-1 group-hover:text-orange-600 transition-colors break-words">{admin.name}</h3>
                                             <div className="flex items-center gap-2 text-gray-400 font-medium">
                                                 <span className="truncate">{admin.rollNo}</span>
                                             </div>
                                         </div>
                                         <div className="flex flex-col md:flex-row md:items-center justify-between border-t border-gray-100 pt-4 mt-2 gap-2 md:gap-0">
                                             <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">LAST LOGIN</span>
                                             <span className="text-sm font-bold text-black">{admin.lastLogin}</span>
                                         </div>
                                     </div>
                                ))}
                                {registrationsData.admins.length === 0 && (
                                    <p className="text-gray-400 italic col-span-2">No registered admins found.</p>
                                )}
                             </div>
                         )}
                     </div>
                 </div>
             )}
                 </>
             )}
         </div>
      </div>
       {/* Modal Overlay */}
       {modalOpen && (
           <ModalContent 
               type={modalOpen.type} 
               clubId={modalOpen.clubId}
               eventId={modalOpen.eventId} 
               onClose={() => setModalOpen(null)} 
               onPublish={(message) => {
                   if (modalOpen.type === 'reject') {
                       sendMessage({
                           kind: 'Event_Rejected',
                           club_id: modalOpen.clubId,
                           event_id: modalOpen.eventId,
                           message
                       });
                   } else {
                       sendMessage({
                           kind: 'Event_Notification',
                           club_id: modalOpen.clubId,
                           event_id: modalOpen.eventId,
                           message
                       });
                   }
                   setModalOpen(null);
               }} 
           />
       )}
    </div>
  );
}

// Extracted Modal Component to handle textarea state easily
function ModalContent({ type, onClose, onPublish }: { type: 'reject' | 'contact', clubId: string, eventId: string, onClose: () => void, onPublish: (msg: string) => void }) {
    const [message, setMessage] = useState("");

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-8 w-[500px] shadow-2xl transform transition-all scale-100 opacity-100">
                <h3 className="text-2xl font-bold mb-6">
                    {type === 'reject' ? 'REJECTION REASON' : 'CONTACT MESSAGE'}
                </h3>
                <textarea 
                    className="w-full h-40 p-4 border border-gray-200 rounded-xl mb-6 focus:outline-none focus:border-black resize-none text-lg"
                    placeholder={type === 'reject' ? "Why is this event being rejected?" : "Enter your message here..."}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                ></textarea>
                <div className="flex justify-end gap-4">
                    <button 
                        onClick={onClose}
                        className="px-8 py-3 text-gray-400 font-bold hover:text-black transition-colors"
                    >
                        CANCEL
                    </button>
                    <button 
                        onClick={() => onPublish(message)}
                        className="px-8 py-3 bg-black text-white font-bold rounded-full hover:bg-zinc-800 transition-colors shadow-lg"
                    >
                        PUBLISH
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function AdminDashboard() {
  return (
    <Suspense fallback={
      <div className="h-screen bg-white flex items-center justify-center">
        <div className="text-black text-xl">Loading...</div>
      </div>
    }>
      <AdminDashboardContent />
    </Suspense>
  );
}