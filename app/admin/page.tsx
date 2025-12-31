"use client";

import { useRouter } from 'next/navigation';
import React, { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { CalendarDays, ShieldCheck, UserPlus, LogOut, Check, X, Mail, MapPin } from 'lucide-react';
import eventsData from './events.json';

gsap.registerPlugin(useGSAP);

type AdminTab = 'events' | 'auth' | 'registrations';

const NUM_ORANGE_DOTS = 108;


const { rolledEvents, authRequests, registeredClubs, registeredAdmins } = eventsData;

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>('events');
  const [registrationTab, setRegistrationTab] = useState<'clubs' | 'admins'>('clubs');
  const [orangeDots, setOrangeDots] = useState<{r: number, c: number}[]>([]);
  const [modalOpen, setModalOpen] = useState<{type: 'reject' | 'contact', eventId: number} | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Group events by date
  const groupedEvents = React.useMemo(() => {
    return rolledEvents.reduce((acc, event) => {
      if (!acc[event.date]) {
        acc[event.date] = [];
      }
      acc[event.date].push(event);
      return acc;
    }, {} as Record<string, typeof rolledEvents>);
  }, []);

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

  return (
    <div ref={containerRef} className="h-screen bg-white text-black font-sans flex overflow-hidden">
      
      {/* LEFT PANEL - Navigation (30%) */}
      <div className="w-[30%] h-full p-8 border-r border-gray-100 flex flex-col justify-center relative overflow-hidden">
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
            <h1 className="text-3xl font-bold tracking-tight mb-8">DASHBOARD</h1>
        
        {/* Bento Grid Navigation */}
        <div className="grid grid-cols-2 grid-rows-[1fr_1fr_auto] gap-4 h-[450px]">
             {/* Rolled Events - Big Vertical Block */}
             <button 
                onClick={() => setActiveTab('events')}
                className={`anim-bento row-span-2 rounded-3xl p-6 flex flex-col justify-between transition-colors duration-300 ${getTabStyle('events')}`}
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
                onClick={() => setActiveTab('auth')}
                className={`anim-bento rounded-3xl p-6 flex flex-col justify-between transition-colors duration-300 ${getTabStyle('auth')}`}
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
                onClick={() => setActiveTab('registrations')}
                className={`anim-bento rounded-3xl p-6 flex flex-col justify-between transition-colors duration-300 ${getTabStyle('registrations')}`}
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

      {/* RIGHT PANEL - Content (70%) */}
      <div className="w-[70%] h-full bg-white p-12 pt-12 overflow-y-auto">
         {/* Top Bar */}
         <div className="flex justify-end mb-12">
            <div className="flex items-center gap-6">
                <div className="px-6 py-2 bg-black rounded-full flex items-center justify-center text-white font-bold text-sm tracking-widest shadow-lg">
                    IMS22415
                </div>
            </div>
         </div>

         {/* Content Area */}
         <div className="anim-content">
             {activeTab === 'events' && (
                 <div>
                     <h2 className="anim-tab-item text-6xl font-bold tracking-tight mb-2">ROLLED EVENTS</h2>
                     <p className="anim-tab-item text-gray-500 text-xl font-light mb-8">Manage upcoming planned club events.</p>
                     {/* Rolled Events List (Grouped by Date) */}
                     <div className="space-y-8">
                        {Object.entries(groupedEvents).map(([date, events]) => (
                            <div key={date}>
                                <h3 className="text-2xl font-bold mb-4 ml-1">{date}</h3>
                                <div className={`space-y-4 ${events.length > 2 ? 'max-h-[500px] overflow-y-auto pr-2 custom-scrollbar' : ''}`}>
                                    {events.map((evt) => (
                                        <div key={evt.id} className="anim-tab-item p-6 border border-gray-200 rounded-2xl hover:border-black transition-all bg-white group hover:shadow-lg">
                                            {/* Header: Club & Event */}
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <span className="font-bold text-xl">{evt.club}</span>
                                                        <span className="w-1.5 h-1.5 bg-black rounded-full"></span>
                                                        <span className="text-sm font-bold text-orange-600 uppercase tracking-wide">{evt.event}</span>
                                                    </div>
                                                    <p className="text-gray-600 text-sm max-w-xl">{evt.desc}</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="block text-3xl font-bold">{evt.time}</span>
                                                </div>
                                            </div>

                                            {/* Details: Venue Only (Time moved to top right) */}
                                            <div className="flex gap-6 mb-6 text-sm font-medium text-gray-500 border-b border-gray-100 pb-4">
                                                <div className="flex items-center gap-2">
                                                    <MapPin size={16} />
                                                    <span>{evt.venue}</span>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-4">
                                                <button className="px-6 py-2 bg-black text-white text-sm font-bold rounded-full hover:bg-zinc-800 transition-colors flex items-center gap-2">
                                                    <Check size={16} /> ACCEPT
                                                </button>
                                                <button 
                                                    onClick={() => setModalOpen({type: 'reject', eventId: evt.id})}
                                                    className="px-6 py-2 border border-black text-black text-sm font-bold rounded-full hover:bg-gray-50 transition-colors flex items-center gap-2"
                                                >
                                                    <X size={16} /> REJECT
                                                </button>
                                                <button 
                                                    onClick={() => setModalOpen({type: 'contact', eventId: evt.id})}
                                                    className="px-6 py-2 text-gray-500 text-sm font-bold hover:text-black transition-colors flex items-center gap-2 ml-auto"
                                                >
                                                    <Mail size={16} /> CONTACT
                                                </button>
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
                     <h2 className="anim-tab-item text-6xl font-bold tracking-tight mb-2">AUTHENTICATIONS</h2>
                     <p className="anim-tab-item text-gray-500 text-xl font-light mb-8">Review pending admin access and club creation requests.</p>                      
                     <div className="space-y-12">
                        {/* Club Creation Requests */}
                        <div>
                            <h3 className="anim-tab-item text-2xl font-bold mb-4">Club Requests</h3>
                            <div className="space-y-4 ml-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                {authRequests.filter(req => req.type === 'club').map((req) => (
                                    <div key={req.id} className="anim-tab-item p-6 border border-gray-200 rounded-2xl bg-white hover:border-black transition-all flex items-center justify-between group">
                                        <div className="text-xl font-medium leading-relaxed max-w-3xl">
                                            Request to create <span className="text-orange-600 font-bold">{req.clubName}</span> network by <span className="text-orange-600 font-bold">{req.name}</span>, <span className="text-orange-600 font-bold">{req.rollNo}</span>
                                        </div>
                                        
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm text-gray-400 font-medium mr-4">{req.timestamp}</span>
                                            <button className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center hover:bg-zinc-800 transition-colors">
                                                <Check size={20} />
                                            </button>
                                            <button className="w-10 h-10 border border-black text-black rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors">
                                                <X size={20} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {authRequests.filter(req => req.type === 'club').length === 0 && (
                                    <p className="text-gray-400 italic ml-1">No pending club creation requests.</p>
                                )}
                            </div>
                        </div>

                        {/* Admin Access Requests */}
                        <div>
                            <h3 className="anim-tab-item text-2xl font-bold mb-4">Admin Requests</h3>
                            <div className="space-y-4 ml-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                {authRequests.filter(req => req.type === 'admin').map((req) => (
                                    <div key={req.id} className="anim-tab-item p-6 border border-gray-200 rounded-2xl bg-white hover:border-black transition-all flex items-center justify-between group">
                                        <div className="text-xl font-medium leading-relaxed max-w-3xl">
                                            <span className="text-orange-600 font-bold">{req.name}</span>, <span className="text-orange-600 font-bold">{req.rollNo}</span> has requested to access admin page
                                        </div>
                                        
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm text-gray-400 font-medium mr-4">{req.timestamp}</span>
                                            <button className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center hover:bg-zinc-800 transition-colors">
                                                <Check size={20} />
                                            </button>
                                            <button className="w-10 h-10 border border-black text-black rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors">
                                                <X size={20} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {authRequests.filter(req => req.type === 'admin').length === 0 && (
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
                             <div className="grid grid-cols-2 gap-6">
                                {registeredClubs.map((club) => (
                                     <div key={club.id} className="anim-tab-item p-8 border border-gray-200 rounded-3xl bg-white hover:border-black transition-all hover:shadow-lg flex flex-col justify-between h-40 group">
                                         <div>
                                             <h3 className="text-3xl font-bold tracking-tight mb-1 group-hover:text-orange-600 transition-colors">{club.name}</h3>
                                         </div>
                                         <div className="flex items-center gap-2">
                                             <div className="w-2 h-2 bg-black rounded-full"></div>
                                             <span className="font-bold text-lg">{club.members} Members</span>
                                         </div>
                                     </div>
                                ))}
                             </div>
                         ) : (
                             <div className="grid grid-cols-2 gap-6">
                                {registeredAdmins.map((admin) => (
                                     <div key={admin.id} className="anim-tab-item p-8 border border-gray-200 rounded-3xl bg-white hover:border-black transition-all hover:shadow-lg flex flex-col justify-between h-40 group">
                                         <div>
                                             <h3 className="text-2xl font-bold tracking-tight mb-1 group-hover:text-orange-600 transition-colors">{admin.name}</h3>
                                             <div className="flex items-center gap-2 text-gray-400 font-medium">
                                                 <span>{admin.rollNo}</span>
                                             </div>
                                         </div>
                                         <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-2">
                                             <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">LAST LOGIN</span>
                                             <span className="text-sm font-bold text-black">{admin.lastLogin}</span>
                                         </div>
                                     </div>
                                ))}
                             </div>
                         )}
                     </div>
                 </div>
             )}
         </div>
      </div>
       {/* Modal Overlay */}
       {modalOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
               <div className="bg-white rounded-3xl p-8 w-[500px] shadow-2xl transform transition-all scale-100 opacity-100">
                   <h3 className="text-2xl font-bold mb-6">
                       {modalOpen.type === 'reject' ? 'REJECTION REASON' : 'CONTACT MESSAGE'}
                   </h3>
                   <textarea 
                       className="w-full h-40 p-4 border border-gray-200 rounded-xl mb-6 focus:outline-none focus:border-black resize-none text-lg"
                       placeholder={modalOpen.type === 'reject' ? "Why is this event being rejected?" : "Enter your message here..."}
                   ></textarea>
                   <div className="flex justify-end gap-4">
                       <button 
                           onClick={() => setModalOpen(null)}
                           className="px-8 py-3 text-gray-400 font-bold hover:text-black transition-colors"
                       >
                           CANCEL
                       </button>
                       <button 
                           onClick={() => {
                               // Here you would handle the actual publish logic
                               setModalOpen(null);
                           }}
                           className="px-8 py-3 bg-black text-white font-bold rounded-full hover:bg-zinc-800 transition-colors shadow-lg"
                       >
                           PUBLISH
                       </button>
                   </div>
               </div>
           </div>
       )}
    </div>
  );
}