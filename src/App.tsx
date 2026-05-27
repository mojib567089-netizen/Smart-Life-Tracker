import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Home, FileText, Bell, Search, ShieldCheck, LogOut, Settings, ChevronLeft, User as UserIcon, LifeBuoy } from 'lucide-react';
import DocumentVault from './components/DocumentVault';
import SmartReminder from './components/SmartReminder';
import FindMyThings from './components/FindMyThings';
import LoginScreen from './components/LoginScreen';
import AdminPanel from './components/AdminPanel';
import SupportHelpdesk from './components/SupportHelpdesk';
import { DocumentItem, ReminderItem, FoundItem } from './types';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, getDoc, collection, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';

const GlossyAppIcon = ({ icon: Icon, title, onClick, gradient, iconColor = "text-white" }: any) => (
  <button onClick={onClick} className="flex flex-col items-center space-y-2 group w-full">
    <div className={`w-[80px] h-[80px] sm:w-[90px] sm:h-[90px] mx-auto rounded-[1.6rem] shadow-[0_12px_24px_rgba(0,0,0,0.15)] group-hover:shadow-[0_16px_32px_rgba(0,0,0,0.25)] transition-all duration-300 transform group-hover:-translate-y-1 relative overflow-hidden flex items-center justify-center ${gradient} border-[1.5px] border-white/40`}>
       {/* Glossy Overlay Reflection */}
       <div className="absolute top-0 left-0 w-full h-[55%] bg-gradient-to-b from-white/70 to-white/5 rounded-b-[2.5rem] opacity-90 z-10 pointer-events-none mix-blend-overlay"></div>
       <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] bg-white/40 blur-xl pointer-events-none rounded-full"></div>
       
       {/* Inner Shadow for 3D depth */}
       <div className="absolute inset-0 rounded-[1.6rem] shadow-[inset_0_-8px_16px_rgba(0,0,0,0.2),inset_0_4px_12px_rgba(255,255,255,0.8)] pointer-events-none z-20"></div>
       
       <Icon className={`w-10 h-10 sm:w-11 sm:h-11 relative z-30 drop-shadow-md ${iconColor}`} />
    </div>
    <span className="text-[12px] sm:text-[13px] font-bold text-slate-700 tracking-wide mt-2 drop-shadow-sm">{title}</span>
  </button>
);

function SettingsPanel({ user, handleLogout }: { user: User, handleLogout: () => void }) {
  return (
    <div className="p-6 h-full bg-slate-950">
      <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 p-6 flex flex-col items-center">
        <div className="w-24 h-24 rounded-full bg-slate-800 overflow-hidden mb-4 shadow-inner">
            {user.photoURL ? <img src={user.photoURL} alt="profile" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-500 text-4xl font-bold">{user.email?.charAt(0).toUpperCase()}</div>}
        </div>
        <h2 className="text-xl font-bold text-slate-100">{user.displayName || 'অ্যাপ ব্যবহারকারী'}</h2>
        <p className="text-slate-400 text-sm mb-6">{user.email}</p>
        
        <div className="w-full space-y-3 mt-4">
          <div className="w-full flex items-center space-x-3 p-4 bg-slate-800 rounded-xl">
             <UserIcon className="text-slate-400 w-5 h-5"/>
             <div className="flex-1">
               <p className="text-xs text-slate-400">অ্যাকাউন্টের ধরন</p>
               <p className="text-sm font-semibold text-slate-200">জেনারেল ইউজার</p>
             </div>
          </div>
          
          <button onClick={handleLogout} className="w-full flex items-center justify-center space-x-2 bg-red-950/30 text-red-400 font-semibold py-3.5 rounded-xl hover:bg-red-900/50 transition border border-red-900/50 mt-6">
            <LogOut className="w-5 h-5" />
            <span>লগআউট (Logout)</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function MainApp({ user, isAdmin }: { user: User; isAdmin: boolean }) {
  const [activeTab, setActiveTab] = useState<'home' | 'docs' | 'reminder' | 'find' | 'settings' | 'helpdesk'>('home');
  const navigate = useNavigate();

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [foundItems, setFoundItems] = useState<FoundItem[]>([]);

  useEffect(() => {
    if (!user) return;
    
    const unsubDocs = onSnapshot(collection(db, `users/${user.uid}/documents`), (snap) => {
      setDocuments(snap.docs.map(d => ({ id: d.id, ...d.data() } as DocumentItem)));
    }, (error) => console.error(JSON.stringify(error)));
    
    const unsubRems = onSnapshot(collection(db, `users/${user.uid}/reminders`), (snap) => {
      setReminders(snap.docs.map(d => ({ id: d.id, ...d.data() } as ReminderItem)));
    }, (error) => console.error(JSON.stringify(error)));

    const unsubItems = onSnapshot(collection(db, `users/${user.uid}/foundItems`), (snap) => {
      setFoundItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as FoundItem)));
    }, (error) => console.error(JSON.stringify(error)));

    return () => {
      unsubDocs(); unsubRems(); unsubItems();
    };
  }, [user]);

  const addDocument = async (docData: DocumentItem) => {
    await setDoc(doc(db, `users/${user.uid}/documents`, docData.id), docData);
  };
  const updateDocument = async (docData: DocumentItem) => {
    await setDoc(doc(db, `users/${user.uid}/documents`, docData.id), docData);
  };
  const deleteDocument = async (docId: string) => {
    await deleteDoc(doc(db, `users/${user.uid}/documents`, docId));
  };
  const addReminder = async (remData: ReminderItem) => {
    await setDoc(doc(db, `users/${user.uid}/reminders`, remData.id), remData);
  };
  const addFoundItem = async (itemData: FoundItem) => {
    await setDoc(doc(db, `users/${user.uid}/foundItems`, itemData.id), itemData);
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <div className="h-screen w-full flex justify-center bg-slate-950 overflow-hidden font-sans">
      <div className="w-full max-w-md bg-slate-900 h-full relative flex flex-col shadow-2xl">
        
        {/* Top Header */}
        <div className="flex justify-between items-center px-4 py-3 bg-slate-900 border-b border-slate-800 z-10">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-slate-800 overflow-hidden">
               {user.photoURL ? <img src={user.photoURL} alt="profile" /> : <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">{user.email?.charAt(0).toUpperCase()}</div>}
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-slate-400">স্বাগতম,</span>
              <span className="text-sm font-semibold text-slate-100 truncate max-w-[120px]">{user.displayName || user.email}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={handleLogout} className="p-2 text-red-400 bg-red-950/30 rounded-full hover:bg-red-900/50 transition">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dynamic Content Area & Dashboard */}
        <div className="flex-1 overflow-hidden relative bg-slate-900">
          
          {activeTab === 'home' && (
            <div className="h-full overflow-y-auto px-6 py-8 custom-scrollbar">
               {isAdmin && (
                 <div className="mb-10 w-full flex justify-center">
                   <button 
                     onClick={() => navigate('/admin')}
                     className="w-full flex items-center justify-between bg-gradient-to-r from-slate-800 to-slate-950 p-4 rounded-[1.5rem] shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 active:translate-y-0 border border-slate-700"
                   >
                     <div className="flex items-center space-x-4 text-left">
                       <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center shadow-inner">
                         <ShieldCheck className="w-6 h-6 text-yellow-400" />
                       </div>
                       <div>
                         <h3 className="text-white font-bold text-lg leading-tight">Admin Panel</h3>
                         <p className="text-slate-400 text-xs mt-0.5">Control Room</p>
                       </div>
                     </div>
                     <div className="bg-yellow-400 text-slate-950 px-4 py-2 rounded-xl text-sm font-bold shadow-md">
                       Open
                     </div>
                   </button>
                 </div>
               )}
              
               <div className="grid grid-cols-3 gap-x-4 gap-y-10 max-w-sm mx-auto">
                  <GlossyAppIcon 
                    icon={FileText} 
                    title="ডকুমেন্টস" 
                    onClick={() => setActiveTab('docs')}
                    gradient="bg-gradient-to-br from-[#4facfe] to-[#00f2fe]"
                    iconColor="text-white"
                  />
                  <GlossyAppIcon 
                    icon={Bell} 
                    title="রিমাইন্ডার" 
                    onClick={() => setActiveTab('reminder')}
                    gradient="bg-gradient-to-br from-[#fa709a] to-[#fee140]"
                    iconColor="text-white"
                  />
                  <GlossyAppIcon 
                    icon={Search} 
                    title="ফাইন্ডার" 
                    onClick={() => setActiveTab('find')}
                    gradient="bg-gradient-to-br from-[#a18cd1] to-[#fbc2eb]"
                    iconColor="text-white"
                  />
                  <GlossyAppIcon 
                    icon={LifeBuoy} 
                    title="হেল্পডেক্স" 
                    onClick={() => setActiveTab('helpdesk')}
                    gradient="bg-gradient-to-br from-[#f83600] to-[#f9d423]"
                    iconColor="text-white"
                  />
                  <GlossyAppIcon 
                    icon={Settings} 
                    title="সেটিংস" 
                    onClick={() => setActiveTab('settings')}
                    gradient="bg-gradient-to-br from-[#84fab0] to-[#8fd3f4]"
                    iconColor="text-white"
                  />
               </div>
            </div>
          )}

          {activeTab !== 'home' && (
            <div className="h-full flex flex-col">
              <div className="bg-slate-900 px-4 py-3 flex items-center shadow-sm z-10 border-b border-slate-800">
                  <button onClick={() => setActiveTab('home')} className="flex items-center space-x-1 text-indigo-300 hover:text-indigo-100 transition bg-indigo-950/50 px-3 py-1.5 rounded-full">
                    <ChevronLeft className="w-4 h-4" />
                    <span className="font-semibold text-xs">Home</span>
                  </button>
                  <h2 className="ml-auto font-bold text-slate-100 text-sm">
                    {activeTab === 'docs' ? 'Documents' : activeTab === 'reminder' ? 'Reminders' : activeTab === 'find' ? 'Finder' : activeTab === 'helpdesk' ? 'Helpdesk' : 'Settings'}
                  </h2>
              </div>
              <div className="flex-1 overflow-auto bg-slate-950 relative">
                {activeTab === 'docs' && <DocumentVault documents={documents} addDocument={addDocument} updateDocument={updateDocument} deleteDocument={deleteDocument} />}
                {activeTab === 'reminder' && <SmartReminder reminders={reminders} addReminder={addReminder} />}
                {activeTab === 'find' && <FindMyThings items={foundItems} addItem={addFoundItem} />}
                {activeTab === 'helpdesk' && <SupportHelpdesk user={user} />}
                {activeTab === 'settings' && <SettingsPanel user={user} handleLogout={handleLogout} />}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const isSuperAdmin = u.email === 'riyamost75@gmail.com';
        try {
          const userDoc = await getDoc(doc(db, 'users', u.uid));
          if (userDoc.exists()) {
            setIsAdmin(userDoc.data().role === 'admin' || isSuperAdmin);
          } else {
            setIsAdmin(isSuperAdmin);
          }
        } catch (e) {
          console.error(e);
          setIsAdmin(isSuperAdmin);
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) {
    return <div className="h-screen w-full flex items-center justify-center bg-slate-950"><div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div></div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={user ? <MainApp user={user} isAdmin={isAdmin} /> : <Navigate to="/login" />} />
        <Route path="/login" element={!user ? <LoginScreen /> : <Navigate to="/" />} />
        <Route path="/admin" element={user && isAdmin ? <AdminPanel /> : <Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
