import React, { useState, useEffect } from 'react';
import { Pill, Activity, Camera, Loader2, CalendarClock, Plus, X, Bell as BellIcon, Receipt } from 'lucide-react';
import { ReminderItem } from '../types';
import { fileToBase64, generateId } from '../lib/utils';

export default function SmartReminder({
  reminders,
  addReminder,
}: {
  reminders: ReminderItem[];
  addReminder: (reminder: ReminderItem) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [notifiedIds, setNotifiedIds] = useState<string[]>([]);
  
  // Form State
  const [remType, setRemType] = useState<'medicine' | 'bill'>('medicine');
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, []);

  // Check reminders periodically
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const currentTimeStr = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

      reminders.forEach((rem) => {
        if (rem.scheduleInfos && rem.scheduleInfos.includes(currentTimeStr)) {
          const notificationId = `${rem.id}-${currentTimeStr}`;
          if (!notifiedIds.includes(notificationId)) {
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('রিমাইন্ডার', {
                body: `${rem.title || rem.medicineName} এর সময় হয়েছে!`,
              });
            }
            setNotifiedIds(prev => [...prev, notificationId]);
          }
        }
      });
    };

    const interval = setInterval(checkReminders, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [reminders, notifiedIds]);

  const handlePrescriptionUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const base64Data = await fileToBase64(file);

      const response = await fetch('/api/reminders/parse-prescription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64Data,
          mimeType: file.type,
        }),
      });

      if (!response.ok) throw new Error('API Error');

      const results = await response.json();
      
      if (Array.isArray(results)) {
        results.forEach((item: any) => {
          if (item.medicineName) {
            addReminder({
              id: generateId(),
              medicineName: item.medicineName,
              scheduleInfos: item.scheduleInfos || [],
              type: 'medicine',
            });
          }
        });
      }
    } catch (err) {
      alert('সফলভাবে প্রেসক্রিপশন স্ক্যান করা যায়নি।');
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    
    addReminder({
      id: generateId(),
      medicineName: remType === 'medicine' ? title : undefined,
      title: remType === 'bill' ? title : undefined,
      scheduleInfos: time ? [time] : [],
      dueDate: date || undefined,
      type: remType,
    });
    
    setShowManualForm(false);
    setTitle('');
    setTime('');
    setDate('');
  };

  return (
    <div className="flex flex-col h-full bg-slate-950">
      <div className="p-4 bg-teal-900 text-white rounded-b-2xl shadow-md z-10 shrink-0">
        <h1 className="text-2xl font-semibold mb-2">স্মার্ট রিমাইন্ডার</h1>
        <p className="text-teal-200 text-sm">ওষুধের সময় ও বিলের অ্যালার্ট সেট করুন</p>
      </div>

      <div className="p-4 flex-grow overflow-y-auto w-full max-w-md mx-auto relative custom-scrollbar">
        
        {/* Actions */}
        {!showManualForm && (
          <div className="flex gap-3 mb-6">
            <label className="flex-1 flex flex-col items-center justify-center py-4 px-2 bg-slate-900 border border-slate-700 shadow-sm text-teal-400 rounded-xl cursor-pointer hover:bg-slate-800 transition min-h-[90px]">
              {isUploading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Camera className="w-6 h-6 mb-2" />
              )}
              <span className="font-semibold text-xs text-center">
                {isUploading ? 'স্ক্যান হচ্ছে...' : 'প্রেসক্রিপশন স্ক্যান'}
              </span>
              <input type="file" className="hidden" accept="image/*" onChange={handlePrescriptionUpload} disabled={isUploading} />
            </label>
            
            <button onClick={() => setShowManualForm(true)} className="flex-1 flex flex-col items-center justify-center py-4 px-2 bg-slate-900 border border-slate-700 shadow-sm text-teal-400 rounded-xl cursor-pointer hover:bg-slate-800 transition min-h-[90px]">
              <Plus className="w-6 h-6 mb-2" />
              <span className="font-semibold text-xs text-center">নতুন রিমাইন্ডার</span>
            </button>
          </div>
        )}

        {/* Manual Form */}
        {showManualForm && (
          <div className="bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-700 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-100">নতুন রিমাইন্ডার যোগ করুন</h3>
              <button onClick={() => setShowManualForm(false)} className="text-slate-400 hover:text-slate-200"><X className="w-5 h-5"/></button>
            </div>
            
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="flex gap-2 p-1 bg-slate-950 rounded-lg">
                <button type="button" onClick={() => setRemType('medicine')} className={`flex-1 py-1.5 text-sm font-medium rounded-md transition ${remType === 'medicine' ? 'bg-slate-800 text-teal-400 shadow-sm' : 'text-slate-500'}`}>ওষুধ</button>
                <button type="button" onClick={() => setRemType('bill')} className={`flex-1 py-1.5 text-sm font-medium rounded-md transition ${remType === 'bill' ? 'bg-slate-800 text-teal-400 shadow-sm' : 'text-slate-500'}`}>বিল / অন্যান্য</button>
              </div>
              
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1 block">{remType === 'medicine' ? 'ওষুধের নাম' : 'কাজের নাম'}</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder={remType === 'medicine' ? "যেমন: Napa Extra" : "যেমন: Current Bill"} className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-600" />
              </div>
              
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-slate-400 mb-1 block">সময়</label>
                  <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-teal-600" />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-semibold text-slate-400 mb-1 block">তারিখ (ঐচ্ছিক)</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-teal-600" />
                </div>
              </div>
              
              <button type="submit" className="w-full bg-teal-800 text-white font-semibold py-2.5 rounded-lg hover:bg-teal-700 transition">সেভ করুন</button>
            </form>
          </div>
        )}

        <h2 className="text-lg font-medium text-slate-100 mb-4 flex items-center gap-2 mt-2">
          <CalendarClock className="w-5 h-5 text-teal-500" />
          আসন্ন রিমাইন্ডার
        </h2>

        <div className="space-y-3 pb-20">
          {reminders.length > 0 ? (
            reminders.map((rem) => (
              <div key={rem.id} className="bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-700 flex items-start space-x-4">
                <div className={`p-3 rounded-full flex-shrink-0 ${rem.type === 'medicine' ? 'bg-orange-950/50 text-orange-400' : 'bg-blue-950/50 text-blue-400'}`}>
                   {rem.type === 'medicine' ? <Pill className="w-6 h-6" /> : <Receipt className="w-6 h-6" />}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-100 text-base">{rem.title || rem.medicineName}</h3>
                  {rem.scheduleInfos && rem.scheduleInfos.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {rem.scheduleInfos.map((t, idx) => (
                        <span key={idx} className="bg-teal-900 text-teal-200 text-xs px-2.5 py-1 rounded-md border border-teal-800 font-medium flex items-center">
                          <BellIcon className="w-3 h-3 mr-1" /> {t}
                        </span>
                      ))}
                    </div>
                  )}
                  {rem.dueDate && (
                    <p className="text-xs text-red-300 mt-2 font-medium bg-red-950/50 inline-block px-2 py-1 rounded">শেষ তারিখ: {rem.dueDate}</p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-slate-500 py-10">
              <Pill className="w-12 h-12 mx-auto text-slate-700 mb-3 block" />
              <p>আপনার কোনো রিমাইন্ডার সেট করা নেই।</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
