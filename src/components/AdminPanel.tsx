import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Users, Activity, BarChart, Settings, ArrowLeft, Trash2, Ban, ShieldCheck, MessageSquare, Send } from 'lucide-react';

interface AppUser {
  id: string;
  email: string;
  role: string;
  createdAt?: any;
}

interface Ticket {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  message: string;
  status: string;
  createdAt: string;
  adminReply?: string;
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState('users');
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [confirmDeleteUserId, setConfirmDeleteUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
    
    // Subscribe to tickets
    const q = query(collection(db, 'supportTickets'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setTickets(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket)));
    });
    
    return () => unsub();
  }, []);

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersData: AppUser[] = [];
      querySnapshot.forEach((doc) => {
        usersData.push({ id: doc.id, ...doc.data() } as AppUser);
      });
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users", error);
      alert('Error fetching users (Check Admin roles)');
    } finally {
      setLoading(false);
    }
  };

  const toggleAdmin = async (userId: string, currentRole: string) => {
    try {
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (error) {
      alert('Failed to update role');
    }
  };

  const deleteUserRecord = async (userId: string) => {
    try {
      await deleteDoc(doc(db, 'users', userId));
      setUsers(users.filter(u => u.id !== userId));
      setConfirmDeleteUserId(null);
    } catch (error) {
      console.error('Failed to delete user');
    }
  };

  const handleticketReply = async (ticketId: string) => {
    if (!replyText[ticketId]?.trim()) return;
    try {
      await updateDoc(doc(db, 'supportTickets', ticketId), {
        adminReply: replyText[ticketId].trim(),
        status: 'closed'
      });
      setReplyText({ ...replyText, [ticketId]: '' });
    } catch (err) {
      alert('Failed to send reply');
    }
  };

  return (
    <div className="min-h-screen bg-[#1c2128] text-slate-300 font-sans flex flex-col md:flex-row">
      {/* Sidebar for Desktop / Top for Mobile */}
      <div className="w-full md:w-64 bg-[#232932] border-b md:border-b-0 md:border-r border-slate-700 flex flex-col">
        <div className="p-6 flex flex-col space-y-6 mb-4">
          <button onClick={() => navigate('/')} className="flex items-center space-x-2 text-sm text-yellow-400 hover:text-yellow-300 font-bold bg-yellow-400/10 px-4 py-2 rounded-xl transition w-fit border border-yellow-400/20">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to App</span>
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
              <span className="font-bold text-white text-lg">SL</span>
            </div>
            <div>
              <h1 className="font-bold text-white text-sm tracking-widest uppercase">Admin Panel</h1>
              <p className="text-[10px] text-slate-400">Control Room</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-x-auto md:overflow-hidden flex md:flex-col pb-4 md:pb-0">
          <button 
            onClick={() => setActiveMenu('users')}
            className={`flex items-center space-x-3 w-full p-3 rounded-xl transition ${activeMenu === 'users' ? 'bg-[#2d333b] text-yellow-400' : 'hover:bg-[#2d333b] hover:text-white'}`}
          >
            <Users className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium text-sm hidden md:block">User Management</span>
          </button>
          <button 
             onClick={() => setActiveMenu('analytics')}
            className={`flex items-center space-x-3 w-full p-3 rounded-xl transition ${activeMenu === 'analytics' ? 'bg-[#2d333b] text-yellow-400' : 'hover:bg-[#2d333b] hover:text-white'}`}
          >
            <BarChart className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium text-sm hidden md:block">App Analytics</span>
          </button>
          <button 
             onClick={() => setActiveMenu('support')}
            className={`flex items-center space-x-3 w-full p-3 rounded-xl transition ${activeMenu === 'support' ? 'bg-[#2d333b] text-yellow-400' : 'hover:bg-[#2d333b] hover:text-white'}`}
          >
            <MessageSquare className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium text-sm hidden md:block">Helpdesk Tickets</span>
          </button>
          <button 
             onClick={() => setActiveMenu('reports')}
            className={`flex items-center space-x-3 w-full p-3 rounded-xl transition ${activeMenu === 'reports' ? 'bg-[#2d333b] text-yellow-400' : 'hover:bg-[#2d333b] hover:text-white'}`}
          >
            <Activity className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium text-sm hidden md:block">System Logs</span>
          </button>
        </nav>

        <div className="p-4 hidden md:block">
          {/* Empty spacer or custom footer */}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 lg:p-10 overflow-y-auto">
        <header className="mb-10 mt-2 md:mt-0">
          <h2 className="text-2xl font-bold text-white mb-2">
            {activeMenu === 'users' && 'Manage Users'}
            {activeMenu === 'analytics' && 'Platform Analytics'}
            {activeMenu === 'support' && 'Helpdesk Tickets'}
            {activeMenu === 'reports' && 'System Reports'}
          </h2>
          <p className="text-slate-500 text-sm">
            End-to-End Encrypted. Document contents are not accessible by administrators.
          </p>
        </header>

        {activeMenu === 'users' && (
          <div className="bg-[#232932] rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
             <div className="overflow-x-auto">
               <table className="w-full text-left text-sm text-slate-400">
                 <thead className="bg-[#2d333b] border-b border-slate-700 text-xs uppercase text-slate-300">
                   <tr>
                     <th className="px-6 py-4 font-semibold">User</th>
                     <th className="px-6 py-4 font-semibold">Status/Role</th>
                     <th className="px-6 py-4 font-semibold text-right">Actions</th>
                   </tr>
                 </thead>
                 <tbody>
                   {loading ? (
                     <tr><td colSpan={3} className="text-center py-10"><div className="animate-spin w-6 h-6 border-2 border-yellow-500 border-t-transparent flex mx-auto rounded-full"></div></td></tr>
                   ) : users.length === 0 ? (
                     <tr><td colSpan={3} className="text-center py-10 font-mono text-slate-500">NO_USERS_FOUND</td></tr>
                   ) : (
                     users.map(u => (
                       <tr key={u.id} className="border-b border-slate-700/50 hover:bg-[#2d333b]/50 transition">
                         <td className="px-6 py-4 font-medium text-white flex items-center space-x-3">
                           <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold text-white">
                             {u.email.charAt(0).toUpperCase()}
                           </div>
                           <span>{u.email}</span>
                         </td>
                         <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${u.role === 'admin' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                              {u.role || 'user'}
                            </span>
                         </td>
                         <td className="px-6 py-4 text-right space-x-3">
                            <button 
                               onClick={() => toggleAdmin(u.id, u.role)}
                               className="text-slate-400 hover:text-white transition"
                               title="Toggle Admin"
                            >
                              <ShieldCheck className="w-4 h-4" />
                            </button>
                            {confirmDeleteUserId === u.id ? (
                               <div className="inline-flex space-x-2">
                                 <button onClick={() => deleteUserRecord(u.id)} className="text-red-400 font-bold hover:text-red-300 transition text-xs">Confirm</button>
                                 <button onClick={() => setConfirmDeleteUserId(null)} className="text-slate-400 hover:text-white transition text-xs">Cancel</button>
                               </div>
                            ) : (
                               <button 
                                  onClick={() => setConfirmDeleteUserId(u.id)}
                                  className="text-slate-400 hover:text-red-500 transition"
                                  title="Delete User Record"
                               >
                                  <Trash2 className="w-4 h-4" />
                               </button>
                            )}
                         </td>
                       </tr>
                     ))
                   )}
                 </tbody>
               </table>
             </div>
          </div>
        )}

        {activeMenu === 'support' && (
          <div className="space-y-4">
             {tickets.length === 0 ? (
               <div className="bg-[#232932] p-10 rounded-2xl border border-slate-700 text-center text-slate-500">
                 No tickets found.
               </div>
             ) : (
               tickets.map(ticket => (
                 <div key={ticket.id} className="bg-[#232932] p-5 rounded-2xl border border-slate-700 shadow-xl flex flex-col space-y-3 relative overflow-hidden">
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${ticket.status === 'open' ? 'bg-orange-500' : 'bg-green-500'}`}></div>
                    
                    <div className="flex justify-between items-start pl-2">
                       <div>
                         <h3 className="font-bold text-white text-sm">{ticket.userName} <span className="text-slate-500 font-normal">({ticket.userEmail})</span></h3>
                         <p className="text-xs text-slate-500">{new Date(ticket.createdAt).toLocaleString()}</p>
                       </div>
                       <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded ${ticket.status === 'open' ? 'bg-orange-500/20 text-orange-400' : 'bg-green-500/20 text-green-400'}`}>
                         {ticket.status}
                       </span>
                    </div>

                    <div className="pl-2">
                      <p className="text-sm text-slate-300 p-3 bg-[#1c2128] rounded-lg border border-slate-700 whitespace-pre-wrap">{ticket.message}</p>
                    </div>

                    <div className="pl-2 pt-2 border-t border-slate-700/50">
                       {ticket.adminReply ? (
                         <div className="mt-2">
                           <p className="text-xs text-slate-500 mb-1">Your Reply:</p>
                           <p className="text-sm text-yellow-400 bg-yellow-400/10 p-3 rounded-lg border border-yellow-400/20">{ticket.adminReply}</p>
                         </div>
                       ) : (
                         <div className="mt-2 flex space-x-2">
                            <input 
                              type="text" 
                              placeholder="Write a reply to close the ticket..." 
                              value={replyText[ticket.id] || ''}
                              onChange={(e) => setReplyText({ ...replyText, [ticket.id]: e.target.value })}
                              className="flex-1 bg-[#1c2128] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500"
                            />
                            <button 
                              onClick={() => handleticketReply(ticket.id)}
                              className="bg-yellow-500 text-slate-900 px-4 py-2 rounded-lg text-sm font-bold hover:bg-yellow-400 transition flex items-center"
                            >
                               <Send className="w-4 h-4 mr-2"/>
                               Reply
                            </button>
                         </div>
                       )}
                    </div>
                 </div>
               ))
             )}
          </div>
        )}

        {activeMenu !== 'users' && activeMenu !== 'support' && (
           <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-700 rounded-2xl text-slate-500 space-y-4">
              <Activity className="w-8 h-8 opacity-50" />
              <p className="font-mono text-sm uppercase tracking-widest">Module Offline</p>
           </div>
        )}
      </div>
    </div>
  );
}
