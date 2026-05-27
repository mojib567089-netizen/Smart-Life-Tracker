import React, { useState, useEffect } from 'react';
import { Send, Clock, CheckCircle2, MessageSquare } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { User } from 'firebase/auth';

export default function SupportHelpdesk({ user }: { user: User }) {
  const [message, setMessage] = useState('');
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'supportTickets'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setTickets(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [user.uid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    setLoading(true);
    try {
      await addDoc(collection(db, 'supportTickets'), {
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || 'Unknown',
        message: message.trim(),
        status: 'open',
        createdAt: new Date().toISOString()
      });
      setMessage('');
    } catch (err) {
      console.error(err);
      alert('Failed to send message.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950">
      <div className="p-4 bg-blue-900 text-white rounded-b-2xl shadow-md z-10 shrink-0">
        <h1 className="text-2xl font-semibold mb-2 flex items-center text-white">
          <MessageSquare className="w-6 h-6 mr-2" />
          হেল্পডেক্স
        </h1>
        <p className="text-blue-200 text-sm">এডমিনের সাথে সরাসরি যোগাযোগ করুন</p>
      </div>

      <div className="flex-grow overflow-y-auto w-full max-w-md mx-auto relative custom-scrollbar p-4">
        
        {/* Ticket form */}
        <div className="bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-700 mb-6">
          <h3 className="font-bold text-slate-100 mb-3 flex items-center text-sm">
            নতুন মেসেজ পাঠান
          </h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="আপনার সমস্যা বিস্তারিত লিখুন..."
              className="w-full px-3 py-2 border border-slate-700 bg-slate-950 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-700 resize-none h-24"
              required
            ></textarea>
            <button
              type="submit"
              disabled={loading || !message.trim()}
              className="w-full bg-blue-800 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-700 transition flex items-center justify-center disabled:opacity-50"
            >
              <Send className="w-4 h-4 mr-2" />
              {loading ? 'পাঠানো হচ্ছে...' : 'সেন্ড করুন'}
            </button>
          </form>
        </div>

        {/* Previous Tickets */}
        <div>
          <h3 className="text-sm font-semibold text-slate-400 mb-3 ml-1">আপনার পূর্ববর্তী মেসেজসমূহ</h3>
          <div className="space-y-3 pb-20">
            {tickets.length > 0 ? (
              tickets.map((ticket) => (
                <div key={ticket.id} className="bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-700 relative overflow-hidden group">
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${ticket.status === 'open' ? 'bg-orange-700' : 'bg-green-700'}`}></div>
                  <div className="pl-2">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center ${ticket.status === 'open' ? 'bg-orange-950/50 text-orange-300' : 'bg-green-950/50 text-green-300'}`}>
                        {ticket.status === 'open' ? (
                          <><Clock className="w-3 h-3 mr-1" /> অপেক্ষমান (Open)</>
                        ) : (
                          <><CheckCircle2 className="w-3 h-3 mr-1" /> সমাধানকৃত (Closed)</>
                        )}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-200 whitespace-pre-wrap">{ticket.message}</p>
                    
                    {ticket.adminReply && (
                      <div className="mt-3 bg-blue-950/50 border border-blue-900 rounded-lg p-3 relative">
                        <span className="absolute -top-2 left-3 bg-blue-800 text-blue-100 text-[9px] font-bold px-1.5 rounded">এডমিন রিপ্লে</span>
                        <p className="text-xs text-blue-100 mt-1">{ticket.adminReply}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10">
                <MessageSquare className="w-10 h-10 mx-auto text-slate-700 mb-2" />
                <p className="text-slate-500 text-sm">কোনো পূর্ববর্তী মেসেজ নেই</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
