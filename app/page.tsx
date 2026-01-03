"use client";
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useSocket } from '../hooks/useSocket';
import { Eye, EyeOff, ChevronRight, ArrowLeft, Grip, X } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

gsap.registerPlugin(useGSAP);

export default function Page() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'clubs' | 'admin'>('clubs');
  /* State for Navigation */
  const [clubView, setClubView] = useState<'menu' | 'join' | 'create' | 'status'>('menu');
  const [adminView, setAdminView] = useState<'intro' | 'select-club' | 'auth-method' | 'existing-admin' | 'new-admin'>('intro');
  const [showSecret, setShowSecret] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  /* State for Join Logic */
  const [joinData, setJoinData] = useState({ name: '', ims: '', secret: '' });
  const [joinStatus, setJoinStatus] = useState<'idle' | 'checking' | 'ask_join' | 'requested' | 'joining'>('idle');
  const containerRef = useRef<HTMLDivElement>(null);

  /* State for Status Toggle */
  const [statusMode, setStatusMode] = useState<'creation' | 'joining'>('creation');
  const [statusCreationSecret, setStatusCreationSecret] = useState('');
  const [statusJoinIMS, setStatusJoinIMS] = useState('');
  const [creationRequestStatus, setCreationRequestStatus] = useState<{found: boolean, request_id?: string, status?: string, club_name?: string} | null>(null);
  const [joinRequestStatus, setJoinRequestStatus] = useState<{request_id: string, club_id: string, club_name?: string, name: string, roll_no: string, status: string, timestamp: number}[] | null>(null);

  /* State for Create Network Multi-step Form */
  const [createStep, setCreateStep] = useState(1);
  const [createData, setCreateData] = useState({
    creatorName: '',
    creatorIMS: '',
    councilId: '',
    clubName: '',
    clubSecret: '',
    confirmSecret: ''
  });
  const [showConfirmSecret, setShowConfirmSecret] = useState(false);

  const handleCreateNext = () => {
    if (createStep < 3) {
      setCreateStep(prev => prev + 1);
    }
  };

  // Socket Logic & Admin State
  const { status, sendMessage, lastMessage } = useSocket();
  
  const [councils, setCouncils] = useState<{council_id: string, council_name: string}[]>([]);
  const [selectedCouncilId, setSelectedCouncilId] = useState<string>("");
  
  const [newAdminData, setNewAdminData] = useState({ name: '', roll: '' });
  const [existingAdminData, setExistingAdminData] = useState({ roll: '', password: '' });

  // 1. Fetch Councils when Admin Tab active or Create Network view active
  useGSAP(() => {
    if (status === 'connected') {
      if (activeTab === 'admin' || (activeTab === 'clubs' && clubView === 'create')) {
        sendMessage({ kind: 'Get_Councils' });
      }
    }
  }, { dependencies: [activeTab, status, clubView] });

  // 2. Listen for Messages
  
  const lastProcessedMessage = useRef<unknown>(null);

  useEffect(() => {
      if (lastMessage && lastMessage !== lastProcessedMessage.current) {
          lastProcessedMessage.current = lastMessage;

          if (lastMessage.kind === 'Councils_List') {
              const list = (lastMessage as unknown as { councils: {council_id: string, council_name: string}[] }).councils;
              setCouncils(list);
              setSelectedCouncilId(prev => prev || (list[0]?.council_id || ""));
          }
          if (lastMessage.kind === 'access_granted') {
              const accessData = lastMessage as unknown as { roll_no?: string };
              toast.success("Access Granted! Redirecting...");
              // Store roll number in localStorage and pass via URL
              if (accessData.roll_no) {
                  localStorage.setItem('admin_roll_no', accessData.roll_no);
                  setTimeout(() => router.push(`/admin?roll_no=${accessData.roll_no}`), 1000);
              } else {
                  setTimeout(() => router.push('/admin'), 1000);
              }
          }
          if (lastMessage.kind === 'access_denied') {
              toast.error("Access Denied. Check credentials.");
          }
          // Club Join Responses
          if (lastMessage.kind === 'Access_Granted') {
               const accessData = lastMessage as unknown as { name?: string, club_id?: string, roll_no?: string, member_id?: string };
               toast.success(`Welcome, ${accessData.name}!`);
               // Store roll number in localStorage and pass via URL
                if (accessData.roll_no) {
                    localStorage.setItem('club_roll_no', accessData.roll_no);
                    if (accessData.member_id) {
                        localStorage.setItem('member_id', accessData.member_id);
                    }
                    setTimeout(() => router.push(`/club/${accessData.club_id}?roll_no=${accessData.roll_no}`), 500);
                } else {
                   setTimeout(() => router.push(`/club/${accessData.club_id}`), 500);
               }
          }
          if (lastMessage.kind === 'record_doesnt_exist') {
               setJoinStatus('ask_join');
               toast("You are not a member yet.", { icon: 'i' });
          }
          if (lastMessage.kind === 'join_request_sent') {
               setJoinStatus('requested');
               toast.success("Join Request Sent!");
          }
          if (lastMessage.kind === 'error') {
               const errorMsg = (lastMessage as { error?: string }).error;
               toast.error(errorMsg || "An error occurred");
               if (joinStatus === 'checking') setJoinStatus('idle');
          }
          // Club Creation Responses
          if (lastMessage.kind === 'creation_request_sent') {
               toast.success("Club creation request sent successfully!");
               setTimeout(() => {
                 setClubView('menu');
                 setCreateStep(1);
                 setCreateData({
                   creatorName: '',
                   creatorIMS: '',
                   councilId: '',
                   clubName: '',
                   clubSecret: '',
                   confirmSecret: ''
                 });
               }, 1500);
          }
          // Status Check Responses
          if (lastMessage.kind === 'creation_request_status') {
               const statusData = lastMessage as unknown as { found: boolean, request_id?: string, status?: string, club_name?: string };
               setCreationRequestStatus(statusData);
               if (statusData.found) {
                   const statusText = statusData.status === 'accepted' ? 'Accepted ✅' : 
                                    statusData.status === 'rejected' ? 'Rejected ❌' : 
                                    'Pending ⏳';
                   toast(`Request Status: ${statusText}`, { 
                     icon: statusData.status === 'accepted' ? '✅' : statusData.status === 'rejected' ? '❌' : '⏳' 
                   });
               } else {
                   toast("No request found with this club secret.", { icon: 'ℹ️' });
               }
          }
          if (lastMessage.kind === 'join_request_status') {
               const joinData = lastMessage as unknown as { requests: {request_id: string, club_id: string, club_name?: string, name: string, roll_no: string, status: string, timestamp: number}[] };
               setJoinRequestStatus(joinData.requests);
               if (joinData.requests.length > 0) {
                   toast(`Found ${joinData.requests.length} join request(s)`, { icon: 'ℹ️' });
               } else {
                   toast("No join requests found for this IMS.", { icon: 'ℹ️' });
               }
          }
      }
  }, [lastMessage, router, joinStatus]);

  const handleCreateClubNetwork = () => {
    if (!createData.creatorName || !createData.creatorIMS || !createData.councilId || !createData.clubName || !createData.clubSecret) {
      toast.error("Please fill all fields");
      return;
    }
    if (createData.clubSecret !== createData.confirmSecret) {
      toast.error("Secrets do not match");
      return;
    }
    
    sendMessage({
      kind: 'Create_Club_Network',
      council_id: createData.councilId,
      club_name: createData.clubName,
      creator_name: createData.creatorName,
      creator_roll: createData.creatorIMS,
      club_secret: createData.clubSecret,
      timestamp: Date.now()
    });
    toast.loading("Sending creation request...", { duration: 2000 });
  };

  const handleCheckCreationRequest = () => {
    if (!statusCreationSecret) {
      toast.error("Please enter club secret");
      return;
    }
    setCreationRequestStatus(null);
    sendMessage({
      kind: 'Check_creation_request',
      club_secret: statusCreationSecret
    });
    toast.loading("Checking request status...", { duration: 1000 });
  };

  const handleCheckJoinRequest = () => {
    if (!statusJoinIMS) {
      toast.error("Please enter IMS");
      return;
    }
    setJoinRequestStatus(null);
    sendMessage({
      kind: 'Check_join_request',
      roll_no: statusJoinIMS
    });
    toast.loading("Checking join requests...", { duration: 1000 });
  };

  const handleSendAccessRequest = () => {
      if (!selectedCouncilId || !newAdminData.name || !newAdminData.roll) {
          toast.error("Please fill all fields");
          return;
      }
      sendMessage({
          kind: 'Admin_Access_Request',
          council_id: selectedCouncilId,
          name: newAdminData.name,
          roll_no: newAdminData.roll,
          timestamp: Date.now()
      });
      toast.success("Request Sent to Council!");
      setAdminView('intro');
  };

  const handleAdminLogin = () => {
      if (!selectedCouncilId || !existingAdminData.roll || !existingAdminData.password) {
          toast.error("Please fill all fields");
          return;
      }
      sendMessage({
          kind: 'Admin_Access_Required',
          council_id: selectedCouncilId,
          roll_no: existingAdminData.roll,
          secret: existingAdminData.password,
          timestamp: Date.now()
      });
      toast.loading("Verifying...", { duration: 1000 });
  };

  const handleAccessNetwork = () => {
      if (!joinData.name || !joinData.ims || !joinData.secret) {
          toast.error("Please fill all fields");
          return;
      }
      setJoinStatus('checking');
      sendMessage({
          kind: 'Access_Club_Network',
          name: joinData.name,
          roll_no: joinData.ims,
          secret: joinData.secret,
          timestamp: Date.now(),
          confirm_join: false
      });
  };

  const handleConfirmJoin = () => {
      setJoinStatus('joining');
      sendMessage({
          kind: 'Access_Club_Network',
          name: joinData.name,
          roll_no: joinData.ims,
          secret: joinData.secret,
          timestamp: Date.now(),
          confirm_join: true
      });
  };


  useGSAP(() => {
    // Standard page load animations (Images and Dots only)
    gsap.from(".anim-image", {
      scale: 0.9,
      opacity: 0,
      duration: 1,
      ease: "power2.out"
    });

    gsap.from(".anim-dot", {
      scale: 0,
      opacity: 0,
      duration: 0.6,
      stagger: {
        amount: 0.5,
        from: "random"
      },
      ease: "back.out(1.7)",
      delay: 0.3
    });
  }, { scope: containerRef, dependencies: [activeTab] });

  useGSAP(() => {
      // Handle Menu Text vs Forms (Join/Status)
      if (['join', 'status'].includes(clubView)) {
          gsap.from(".anim-form", {
              y: 20,
              opacity: 0,
              duration: 0.6,
              stagger: 0.1,
              ease: "power2.out"
          });
      } else if (clubView === 'menu') {
          gsap.from(".anim-text", {
              y: 30,
              opacity: 0,
              duration: 0.8,
              stagger: 0.1,
              ease: "power3.out",
              delay: 0.1
          });
      }
      
      // Admin Views Animation
      if (['select-club', 'auth-method', 'existing-admin', 'new-admin'].includes(adminView)) {
        gsap.from(".anim-admin-form", {
            y: 20,
            opacity: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: "power2.out"
        });
      }
  }, { scope: containerRef, dependencies: [clubView, adminView] });

  // Handle Create Network Wizard Animations
  useGSAP(() => {
    if (clubView === 'create') {
       gsap.from(".anim-form", {
          y: 20,
          opacity: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: "power2.out"
       });
    }
  }, { scope: containerRef, dependencies: [clubView, createStep] });

  // Handle Status Mode Animations
  useGSAP(() => {
    if (clubView === 'status') {
       gsap.from(".anim-status-input", {
          y: 20,
          opacity: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: "power2.out"
       });
    }
  }, { scope: containerRef, dependencies: [clubView, statusMode] });

  // Credits Animation
  useGSAP(() => {
    if (showCredits) {
       gsap.from(".anim-credit-item", {
          y: 30,
          opacity: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          delay: 0.1
       });
    }
  }, { scope: containerRef, dependencies: [showCredits] });
  
  const handleMenuClick = (item: string) => {
    if (item === 'Join network') setClubView('join');
    if (item === 'Create network') {
        setCreateStep(1);
        setCreateData({
          creatorName: '',
          creatorIMS: '',
          councilId: '',
          clubName: '',
          clubSecret: '',
          confirmSecret: ''
        });
        setClubView('create');
    }
    if (item === 'Request status') {
        setStatusMode('creation');
        setStatusCreationSecret('');
        setStatusJoinIMS('');
        setCreationRequestStatus(null);
        setJoinRequestStatus(null);
        setClubView('status');
    }
  };

  return (
    <div ref={containerRef} className={`min-h-screen transition-colors duration-500 ${activeTab === 'clubs' ? 'bg-black text-white' : 'bg-white text-black'}`}>
      <Toaster position="top-center" />
      {/* Header */}
      <header className="fixed top-7 left-0 right-0 z-50 bg-transparent">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-xl md:text-3xl font-bold tracking-tight">
            Event<span className="text-orange-600">Gate</span>
          </div>

          <nav className="flex items-center gap-6 md:gap-8 text-sm font-medium absolute left-1/2 -translate-x-1/2 whitespace-nowrap">
            <button 
              onClick={() => { setActiveTab('clubs'); setClubView('menu'); }}
              className={`pb-1 transition-all duration-300 ${
                activeTab === 'clubs' 
                  ? 'border-b-2 border-orange-600 font-bold text-lg' 
                  : 'hover:text-gray-600 text-gray-500'
              }`}
            >
              CLUBS
            </button>
            <button 
              onClick={() => setActiveTab('admin')}
              className={`pb-1 transition-all duration-300 ${
                activeTab === 'admin' 
                  ? 'border-b-2 border-orange-600 font-bold text-lg' 
                  : 'hover:text-gray-600 text-gray-500'
              }`}
            >
              ADMIN
            </button>
          </nav>

          {/* Credits Trigger */}
          <button 
             onClick={() => setShowCredits(true)}
             className={`p-2 rounded-full transition-colors ${
                 activeTab === 'clubs' ? 'hover:bg-white/10 text-white' : 'hover:bg-black/5 text-black'
             }`}
          >
              <Grip size={20} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      {/* If Admin Tab is active -> Show Section 1 (Admin Style) */}
      {activeTab === 'admin' && (
        <section className="relative bg-white pt-32 pb-20 px-6 overflow-hidden min-h-screen flex items-center">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            {/* Admin Image */}
            <div className="relative">
              <div className="anim-image">
                <Image
                  src="/landingPage/admin.png"
                  alt="Admin illustration"
                  width={600}
                  height={600}
                  className="w-full h-auto"
                  priority
                />
              </div>
              {/* Decorative orange dots */}
              <div className="anim-dot absolute top-12 left-12 w-3 h-3 bg-orange-600 rounded-full"></div>
              <div className="anim-dot absolute top-32 left-4 w-2.5 h-2.5 bg-orange-600 rounded-full"></div>
              <div className="anim-dot absolute top-24 right-12 w-3 h-3 bg-orange-600 rounded-full"></div>
              <div className="anim-dot absolute top-40 right-24 w-2 h-2 bg-orange-600 rounded-full"></div>
              <div className="anim-dot absolute bottom-32 left-32 w-2.5 h-2.5 bg-orange-600 rounded-full"></div>
              <div className="anim-dot absolute bottom-20 right-8 w-3 h-3 bg-orange-600 rounded-full"></div>
            </div>

            {/* Content */}
            {/* Content */}
            <div className="space-y-6 ">
              {adminView === 'intro' ? (
                <>
                  <h2 className="anim-text text-5xl md:text-6xl font-bold tracking-tight">ADMIN PORTAL</h2>
                  <p className="anim-text text-gray-600 leading-relaxed ml-7">
                    This is the portal to access the Admin page. Click on
                    <br />
                    the button below to proceed with the authentication
                  </p>
                  <div className="anim-text ml-5">
                    <button 
                      onClick={() => setAdminView('select-club')}
                      className="px-43 py-3 border-2 border-black text-sm font-medium tracking-wide hover:bg-black hover:text-white transition-colors"
                    >
                      ENTER
                    </button>
                  </div>
                </>
              ) : (
                <div className="w-full max-w-md ml-5">
                  <button 
                      onClick={() => setAdminView('intro')}
                      className="anim-admin-form mb-8 text-gray-500 hover:text-black transition-colors flex items-center gap-2"
                  >
                      <ArrowLeft size={20} />
                      <span className="text-sm tracking-wide">HOME</span>
                  </button>

                  <div className="space-y-6">
                    {/* SELECT CLUB VIEW */}
                    {adminView === 'select-club' && (
                       <>
                         <div className="anim-admin-form group">
                             <label className="block text-sm font-medium text-gray-600 mb-2">SELECT COUNCIL</label>
                             <select 
                                value={selectedCouncilId} 
                                onChange={(e) => setSelectedCouncilId(e.target.value)}
                                className="w-full bg-transparent border-b border-black py-2 text-lg focus:border-orange-500 outline-none transition-colors text-black appearance-none rounded-none"
                             >
                               {councils.map(c => (
                                   <option key={c.council_id} value={c.council_id}>{c.council_name}</option>
                               ))}
                               {councils.length === 0 && <option value="">Loading...</option>}
                             </select>
                         </div>
                         <div className="anim-admin-form pt-8 flex gap-4">
                            <button 
                                onClick={() => setAdminView('intro')}
                                className="w-1/3 py-3 border border-black text-black hover:bg-black hover:text-white transition-all duration-300 text-sm font-bold tracking-wide"
                            >
                                BACK
                            </button>
                            <button 
                                onClick={() => setAdminView('auth-method')}
                                className="w-2/3 py-3 bg-black border border-black text-white hover:bg-white hover:text-black transition-all duration-300 text-sm font-bold tracking-wide"
                            >
                                NEXT
                            </button>
                         </div>
                       </>
                    )}

                    {/* AUTH METHOD VIEW */}
                    {adminView === 'auth-method' && (
                       <div className="space-y-8 pt-4">
                          <div 
                            onClick={() => setAdminView('existing-admin')}
                            className="anim-admin-form flex items-center gap-4 cursor-pointer group"
                          >
                             <div className="w-2.5 h-2.5 bg-orange-600 rounded-full"></div>
                             <span className="text-xl font-semibold text-black border-b border-transparent group-hover:border-black transition-all">Existing Admin</span>
                          </div>
                          <div 
                            onClick={() => setAdminView('new-admin')}
                            className="anim-admin-form flex items-center gap-4 cursor-pointer group"
                          >
                             <div className="w-2.5 h-2.5 bg-orange-600 rounded-full"></div>
                             <span className="text-xl font-semibold text-black border-b border-transparent group-hover:border-black transition-all">New Admin</span>
                          </div>
                          <div className="anim-admin-form pt-4">
                             <button 
                                 onClick={() => setAdminView('select-club')}
                                 className="w-1/3 py-3 border border-black text-black hover:bg-black hover:text-white transition-all duration-300 text-sm font-bold tracking-wide"
                             >
                                 BACK
                             </button>
                          </div>
                       </div>
                    )}

                    {/* EXISTING ADMIN VIEW */}
                    {adminView === 'existing-admin' && (
                        <>
                            <div className="anim-admin-form group">
                                <input 
                                    type="text" 
                                    placeholder="IMS" 
                                    value={existingAdminData.roll}
                                    onChange={(e) => setExistingAdminData({...existingAdminData, roll: e.target.value})}
                                    className="w-full bg-transparent border-b border-black py-2 text-lg focus:border-orange-500 outline-none transition-colors placeholder:text-gray-500 text-black"
                                />
                            </div>
                            <div className="anim-admin-form group relative">
                                <input 
                                    type={showSecret ? "text" : "password"} 
                                    placeholder="Password"
                                    value={existingAdminData.password}
                                    onChange={(e) => setExistingAdminData({...existingAdminData, password: e.target.value})}
                                    className="w-full bg-transparent border-b border-black py-2 text-lg focus:border-orange-500 outline-none transition-colors placeholder:text-gray-500 tracking-widest text-black"
                                />
                                <button 
                                    onClick={() => setShowSecret(!showSecret)}
                                    className="absolute right-2 top-2 text-gray-400 hover:text-black transition-colors"
                                >
                                    {showSecret ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            <div className="anim-admin-form pt-8 flex gap-4">
                                <button 
                                    onClick={() => setAdminView('auth-method')}
                                    className="w-1/3 py-3 border border-black text-black hover:bg-black hover:text-white transition-all duration-300 text-sm font-bold tracking-wide"
                                >
                                    BACK
                                </button>
                                <button className="w-2/3 py-3 bg-black border border-black text-white hover:bg-white hover:text-black transition-all duration-300 text-sm font-bold tracking-wide" onClick={handleAdminLogin}>
                                    ACCESS ADMIN PAGE
                                </button>
                            </div>
                        </>
                    )}

                    {/* NEW ADMIN VIEW */}
                    {adminView === 'new-admin' && (
                        <>
                            <div className="anim-admin-form group">
                                <input 
                                    type="text" 
                                    placeholder="Name" 
                                    value={newAdminData.name}
                                    onChange={(e) => setNewAdminData({...newAdminData, name: e.target.value})}
                                    className="w-full bg-transparent border-b border-black py-2 text-lg focus:border-orange-500 outline-none transition-colors placeholder:text-gray-500 text-black"
                                />
                            </div>
                            <div className="anim-admin-form group">
                                <input 
                                    type="text" 
                                    placeholder="IMS" 
                                    value={newAdminData.roll}
                                    onChange={(e) => setNewAdminData({...newAdminData, roll: e.target.value})}
                                    className="w-full bg-transparent border-b border-black py-2 text-lg focus:border-orange-500 outline-none transition-colors placeholder:text-gray-500 text-black"
                                />
                            </div>
                            <div className="anim-admin-form pt-8 flex gap-4">
                                <button 
                                    onClick={() => setAdminView('auth-method')}
                                    className="w-1/3 py-3 border border-black text-black hover:bg-black hover:text-white transition-all duration-300 text-sm font-bold tracking-wide"
                                >
                                    BACK
                                </button>
                                <button onClick={handleSendAccessRequest} className="w-2/3 py-3 bg-black border border-black text-white hover:bg-white hover:text-black transition-all duration-300 text-sm font-bold tracking-wide">
                                    SEND ACCESS REQUEST
                                </button>
                            </div>
                        </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* If Clubs Tab is active -> Show Section 2 (Clubs Style) */}
      {activeTab === 'clubs' && (
        <section className="relative bg-black text-white pt-32 pb-20 px-6 overflow-hidden min-h-screen flex items-center">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div className="space-y-6 h-full flex flex-col justify-center order-2 md:order-1">
              
              {clubView === 'menu' ? (
                <>
                  <h2 className="anim-text text-5xl md:text-6xl font-bold tracking-tight">CLUB NETWORKS</h2>
                  <div className="space-y-4 pt-4 ml-18">
                      {['Join network', 'Create network', 'Request status'].map((item, index) => (
                      <div 
                          key={index} 
                          onClick={() => handleMenuClick(item)}
                          className="anim-text group flex items-center gap-4 cursor-pointer"
                      >
                          <ChevronRight className="text-orange-600 w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
                          <span className="text-xl md:text-2xl font-light hover:text-gray-300 transition-colors">{item}</span>
                      </div>
                      ))}
                  </div>
                </>
              ) : (
                <div className="w-full max-w-md">
                    <button 
                        onClick={() => setClubView('menu')}
                        className="anim-form mb-8 text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                    >
                        <ArrowLeft size={20} />
                        <span className="text-sm tracking-wide">HOME</span>
                    </button>

                    <div className="space-y-6">
                        {/* JOIN NETWORK FORM */}
                        {clubView === 'join' && (
                          <>
                            {joinStatus === 'requested' ? (
                                <div className="text-center py-10 space-y-4 anim-form">
                                   <div className="text-2xl font-bold text-orange-500">REQUEST SENT</div>
                                   <p className="text-gray-300">Your request to join this club network has been sent to the admin.</p>
                                   <button onClick={() => { setJoinStatus('idle'); setClubView('menu'); }} className="text-sm underline hover:text-white text-gray-500">Back to Menu</button>
                                </div>
                            ) : joinStatus === 'ask_join' ? (
                                <div className="text-center py-10 space-y-6 anim-form">
                                   <div className="text-xl font-bold text-white">Not a Member</div>
                                   <p className="text-gray-300">You are not in the member list for this club. Would you like to request to join?</p>
                                   <div className="flex gap-4 justify-center">
                                       <button onClick={() => setJoinStatus('idle')} className="px-6 py-2 border border-white rounded hover:bg-white hover:text-black transition-colors">Cancel</button>
                                       <button onClick={handleConfirmJoin} className="px-6 py-2 bg-orange-600 rounded hover:bg-orange-500 transition-colors font-bold">YES, JOIN</button>
                                   </div>
                                </div>
                            ) : (
                                <>
                                    <div className="anim-form group">
                                        <input 
                                            type="text" 
                                            placeholder="Name" 
                                            value={joinData.name}
                                            onChange={(e) => setJoinData({...joinData, name: e.target.value})}
                                            className="w-full bg-transparent border-b border-white py-2 text-lg focus:border-orange-500 outline-none transition-colors placeholder:text-gray-500 text-white"
                                        />
                                    </div>
                                    <div className="anim-form group">
                                        <input 
                                            type="text" 
                                            placeholder="IMS (Roll No)" 
                                            value={joinData.ims}
                                            onChange={(e) => setJoinData({...joinData, ims: e.target.value})}
                                            className="w-full bg-transparent border-b border-white py-2 text-lg focus:border-orange-500 outline-none transition-colors placeholder:text-gray-500 text-white"
                                        />
                                    </div>
                                    <div className="anim-form group relative">
                                        <input 
                                            type={showSecret ? "text" : "password"} 
                                            placeholder="Club Secret" 
                                            value={joinData.secret}
                                            onChange={(e) => setJoinData({...joinData, secret: e.target.value})}
                                            className="w-full bg-transparent border-b border-white py-2 text-lg focus:border-orange-500 outline-none transition-colors placeholder:text-gray-500 tracking-widest text-white"
                                        />
                                        <button 
                                            onClick={() => setShowSecret(!showSecret)}
                                            className="absolute right-2 top-2 text-gray-500 hover:text-white transition-colors"
                                        >
                                            {showSecret ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                    <div className="anim-form pt-4">
                                        <button 
                                            onClick={handleAccessNetwork}
                                            disabled={joinStatus === 'checking'}
                                            className="w-full py-3 bg-orange-600 border border-orange-600 rounded text-white shadow-[0_0_15px_rgba(234,88,12,0.5)] hover:shadow-[0_0_25px_rgba(234,88,12,0.8)] hover:bg-orange-500 transition-all duration-300 text-sm font-bold tracking-wide disabled:opacity-50"
                                        >
                                            {joinStatus === 'checking' ? 'VERIFYING...' : 'ACCESS NETWORK'}
                                        </button>
                                    </div>
                                </>
                            )}
                          </>
                        )}

                        {/* CREATE NETWORK FORM */}
                        {clubView === 'create' && (
                          <>
                            {/* STEP 1: Creator Details */}
                            {createStep === 1 && (
                                <>
                                    <div className="anim-form group">
                                        <input 
                                            type="text" 
                                            placeholder="Creator Name" 
                                            value={createData.creatorName}
                                            onChange={(e) => setCreateData({...createData, creatorName: e.target.value})}
                                            className="w-full bg-transparent border-b border-white py-2 text-lg focus:border-orange-500 outline-none transition-colors placeholder:text-gray-500 text-white"
                                        />
                                    </div>
                                    <div className="anim-form group">
                                        <input 
                                            type="text" 
                                            placeholder="Creator IMS" 
                                            value={createData.creatorIMS}
                                            onChange={(e) => setCreateData({...createData, creatorIMS: e.target.value})}
                                            className="w-full bg-transparent border-b border-white py-2 text-lg focus:border-orange-500 outline-none transition-colors placeholder:text-gray-500 text-white"
                                        />
                                    </div>
                                    <div className="anim-form pt-4">
                                        <button 
                                            onClick={handleCreateNext}
                                            disabled={!createData.creatorName || !createData.creatorIMS}
                                            className="w-full py-3 bg-orange-600 border border-orange-600 rounded text-white shadow-[0_0_15px_rgba(234,88,12,0.5)] hover:shadow-[0_0_25px_rgba(234,88,12,0.8)] hover:bg-orange-500 transition-all duration-300 text-sm font-bold tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            NEXT
                                        </button>
                                    </div>
                                </>
                            )}

                            {/* STEP 2: Council Selection & Club Name */}
                            {createStep === 2 && (
                                <>
                                    <div className="anim-form group">
                                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">SELECT COUNCIL</label>
                                        <select 
                                            value={createData.councilId} 
                                            onChange={(e) => setCreateData({...createData, councilId: e.target.value})}
                                            className="w-full bg-transparent border-b border-white py-2 text-lg focus:border-orange-500 outline-none transition-colors text-white appearance-none rounded-none"
                                        >
                                            <option value="">Select a council...</option>
                                            {councils.map(c => (
                                                <option key={c.council_id} value={c.council_id} className="bg-black text-white">{c.council_name}</option>
                                            ))}
                                            {councils.length === 0 && <option value="">Loading councils...</option>}
                                        </select>
                                    </div>
                                    <div className="anim-form group">
                                        <input 
                                            type="text" 
                                            placeholder="Club Name" 
                                            value={createData.clubName}
                                            onChange={(e) => setCreateData({...createData, clubName: e.target.value})}
                                            className="w-full bg-transparent border-b border-white py-2 text-lg focus:border-orange-500 outline-none transition-colors placeholder:text-gray-500 text-white"
                                        />
                                    </div>
                                    <div className="anim-form pt-4 flex gap-4">
                                        <button 
                                            onClick={() => setCreateStep(1)}
                                            className="w-1/3 py-3 border border-gray-500 rounded text-gray-300 hover:text-white hover:border-white transition-all duration-300 text-sm font-bold tracking-wide"
                                        >
                                            BACK
                                        </button>
                                        <button 
                                            onClick={handleCreateNext}
                                            disabled={!createData.councilId || !createData.clubName}
                                            className="w-2/3 py-3 bg-orange-600 border border-orange-600 rounded text-white shadow-[0_0_15px_rgba(234,88,12,0.5)] hover:shadow-[0_0_25px_rgba(234,88,12,0.8)] hover:bg-orange-500 transition-all duration-300 text-sm font-bold tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            NEXT
                                        </button>
                                    </div>
                                </>
                            )}

                            {/* STEP 3: Secret & Confirm Secret */}
                            {createStep === 3 && (
                                <>
                                    <div className="anim-form group relative">
                                        <input 
                                            type={showSecret ? "text" : "password"} 
                                            placeholder="Club Secret" 
                                            value={createData.clubSecret}
                                            onChange={(e) => setCreateData({...createData, clubSecret: e.target.value})}
                                            className="w-full bg-transparent border-b border-white py-2 text-lg focus:border-orange-500 outline-none transition-colors placeholder:text-gray-500 tracking-widest text-white"
                                        />
                                        <button 
                                            onClick={() => setShowSecret(!showSecret)}
                                            className="absolute right-2 top-2 text-gray-500 hover:text-white transition-colors"
                                        >
                                            {showSecret ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                    <div className="anim-form group relative">
                                        <input 
                                            type={showConfirmSecret ? "text" : "password"} 
                                            placeholder="Confirm Secret" 
                                            value={createData.confirmSecret}
                                            onChange={(e) => setCreateData({...createData, confirmSecret: e.target.value})}
                                            className={`w-full bg-transparent border-b py-2 text-lg outline-none transition-colors placeholder:text-gray-500 tracking-widest text-white ${
                                                createData.confirmSecret && createData.clubSecret !== createData.confirmSecret ? 'border-red-500' : 'border-white focus:border-orange-500'
                                            }`}
                                        />
                                        <button 
                                            onClick={() => setShowConfirmSecret(!showConfirmSecret)}
                                            className="absolute right-2 top-2 text-gray-500 hover:text-white transition-colors"
                                        >
                                            {showConfirmSecret ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                    
                                    <div className="anim-form pt-4 flex gap-4">
                                        <button 
                                            onClick={() => setCreateStep(2)}
                                            className="w-1/3 py-3 border border-gray-500 rounded text-gray-300 hover:text-white hover:border-white transition-all duration-300 text-sm font-bold tracking-wide"
                                        >
                                            BACK
                                        </button>
                                        <button 
                                            onClick={handleCreateClubNetwork}
                                            disabled={!createData.clubSecret || !createData.confirmSecret || createData.clubSecret !== createData.confirmSecret}
                                            className="w-2/3 py-3 bg-orange-600 border border-orange-600 rounded text-white shadow-[0_0_15px_rgba(234,88,12,0.5)] hover:shadow-[0_0_25px_rgba(234,88,12,0.8)] hover:bg-orange-500 transition-all duration-300 text-sm font-bold tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            GENERATE CREATION REQUEST
                                        </button>
                                    </div>
                                </>
                            )}
                          </>
                        )}

                        {/* STATUS FORM */}
                        {clubView === 'status' && (
                          <>
                             {/* Status Toggle */}
                            <div className="anim-form flex gap-8 mb-8 border-b border-gray-800 pb-2 justify-center">
                                <button 
                                    onClick={() => setStatusMode('creation')}
                                    className={`text-sm tracking-wider pb-2 transition-all duration-300 ${
                                        statusMode === 'creation' 
                                            ? 'text-white border-b border-orange-600' 
                                            : 'text-gray-500 hover:text-gray-300'
                                    }`}
                                >
                                    CLUB CREATION
                                </button>
                                <button 
                                    onClick={() => setStatusMode('joining')}
                                    className={`text-sm tracking-wider pb-2 transition-all duration-300 ${
                                        statusMode === 'joining' 
                                            ? 'text-white border-b border-orange-600' 
                                            : 'text-gray-500 hover:text-gray-300'
                                    }`}
                                >
                                    CLUB JOINING
                                </button>
                            </div>

                            {statusMode === 'creation' ? (
                                <>
                                    <div className="anim-status-input group relative">
                                        <input 
                                            type={showSecret ? "text" : "password"} 
                                            placeholder="Club Secret" 
                                            value={statusCreationSecret}
                                            onChange={(e) => setStatusCreationSecret(e.target.value)}
                                            className="w-full bg-transparent border-b border-white py-2 text-lg focus:border-orange-500 outline-none transition-colors placeholder:text-gray-500 tracking-widest text-white"
                                        />
                                        <button 
                                            onClick={() => setShowSecret(!showSecret)}
                                            className="absolute right-2 top-2 text-gray-500 hover:text-white transition-colors"
                                        >
                                            {showSecret ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                    {creationRequestStatus && (
                                        <div className="anim-status-input mt-4 p-4 bg-white/5 border border-white/20 rounded-xl">
                                            {creationRequestStatus.found ? (
                                                <>
                                                    <div className="text-lg font-bold mb-2">{creationRequestStatus.club_name || 'Club'}</div>
                                                    <div className="text-sm text-gray-400 mb-1">Request ID: {creationRequestStatus.request_id}</div>
                                                    <div className={`text-sm font-bold ${
                                                        creationRequestStatus.status === 'accepted' ? 'text-green-500' :
                                                        creationRequestStatus.status === 'rejected' ? 'text-red-500' :
                                                        'text-orange-500'
                                                    }`}>
                                                        Status: {creationRequestStatus.status?.toUpperCase() || 'PENDING'}
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-gray-400 text-center">No request found</div>
                                            )}
                                        </div>
                                    )}
                                    <div className="anim-status-input pt-4">
                                        <button 
                                            onClick={handleCheckCreationRequest}
                                            className="w-full py-3 bg-orange-600 border border-orange-600 rounded text-white shadow-[0_0_15px_rgba(234,88,12,0.5)] hover:shadow-[0_0_25px_rgba(234,88,12,0.8)] hover:bg-orange-500 transition-all duration-300 text-sm font-bold tracking-wide"
                                        >
                                            CHECK
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="anim-status-input group">
                                        <input 
                                            type="text" 
                                            placeholder="IMS (Roll No)" 
                                            value={statusJoinIMS}
                                            onChange={(e) => setStatusJoinIMS(e.target.value)}
                                            className="w-full bg-transparent border-b border-white py-2 text-lg focus:border-orange-500 outline-none transition-colors placeholder:text-gray-500 text-white"
                                        />
                                    </div>
                                    {joinRequestStatus && (
                                        <div className="anim-status-input mt-4 space-y-3 max-h-64 overflow-y-auto">
                                            {joinRequestStatus.length > 0 ? (
                                                joinRequestStatus.map((req) => (
                                                    <div key={req.request_id} className="p-4 bg-white/5 border border-white/20 rounded-xl">
                                                        <div className="text-lg font-bold mb-2">{req.club_name || 'Unknown Club'}</div>
                                                        <div className="text-sm text-gray-400 mb-1">Request ID: {req.request_id}</div>
                                                        <div className={`text-sm font-bold ${
                                                            req.status === 'accepted' ? 'text-green-500' :
                                                            req.status === 'rejected' ? 'text-red-500' :
                                                            'text-orange-500'
                                                        }`}>
                                                            Status: {req.status?.toUpperCase() || 'PENDING'}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-4 bg-white/5 border border-white/20 rounded-xl text-gray-400 text-center">No requests found</div>
                                            )}
                                        </div>
                                    )}
                                    <div className="anim-status-input pt-4">
                                        <button 
                                            onClick={handleCheckJoinRequest}
                                            className="w-full py-3 bg-orange-600 border border-orange-600 rounded text-white shadow-[0_0_15px_rgba(234,88,12,0.5)] hover:shadow-[0_0_25px_rgba(234,88,12,0.8)] hover:bg-orange-500 transition-all duration-300 text-sm font-bold tracking-wide"
                                        >
                                            CHECK
                                        </button>
                                    </div>
                                </>
                            )}
                          </>
                        )}
                        
                    </div>
                </div>
              )}

            </div>

            {/* Clubs Image */}
            <div className="relative order-1 md:order-2">
              <div className="anim-image">
                <Image
                  src="/landingPage/club.png"
                  alt="Clubs illustration"
                  width={600}
                  height={1400}
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
              {/* Decorative orange dots */}
              <div className="anim-dot absolute top-12 left-12 w-3 h-3 bg-orange-600 rounded-full"></div>
              <div className="anim-dot absolute top-32 left-4 w-2.5 h-2.5 bg-orange-600 rounded-full"></div>
              <div className="anim-dot absolute top-24 right-12 w-3 h-3 bg-orange-600 rounded-full"></div>
              <div className="anim-dot absolute top-40 right-24 w-2 h-2 bg-orange-600 rounded-full"></div>
              <div className="anim-dot absolute bottom-32 left-32 w-2.5 h-2.5 bg-orange-600 rounded-full"></div>
              <div className="anim-dot absolute bottom-20 right-8 w-3 h-3 bg-orange-600 rounded-full"></div>
            </div>
          </div>
        </section>
      )}

      {/* Credits Overlay */}
      {showCredits && (
          <div className="fixed inset-0 z-[100] backdrop-blur-xl bg-black/90 flex flex-col items-center justify-center text-center p-8 animate-in fade-in duration-300">
              <button 
                  onClick={() => setShowCredits(false)}
                  className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors"
                  aria-label="Close"
              >
                  <X size={32} />
              </button>
              
              <div className="space-y-8 max-w-2xl">
                  <div className="space-y-2">
                       <p className="anim-credit-item text-gray-400 text-sm tracking-[0.2em] font-light">DESIGNED AND CREATED BY</p>
                       <h2 className="anim-credit-item text-6xl md:text-8xl font-black tracking-tighter text-white">
                           <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">CCIT</span>
                       </h2>
                  </div>

                  <div className="anim-credit-item w-16 h-1 bg-white/10 mx-auto rounded-full"></div>

                  <div className="space-y-4">
                      <p className="anim-credit-item text-gray-400 text-xs tracking-[0.2em] uppercase">Contributors</p>
                      <div className="anim-credit-item flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 text-xl md:text-2xl font-bold text-white">
                          <span className="hover:text-orange-500 transition-colors cursor-default">ANTRIN MAJI</span>
                          <span className="hidden md:block text-orange-600/30 text-sm">•</span>
                          <span className="hover:text-orange-500 transition-colors cursor-default">AYUSH SIDDHA</span>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  )
}
