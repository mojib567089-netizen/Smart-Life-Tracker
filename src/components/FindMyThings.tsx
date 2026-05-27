import React, { useState } from 'react';
import { Search, MapPin, Mic, Loader2, Send } from 'lucide-react';
import { FoundItem } from '../types';
import { generateId } from '../lib/utils';

export default function FindMyThings({
  items,
  addItem,
}: {
  items: FoundItem[];
  addItem: (item: FoundItem) => void;
}) {
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSaveText = async () => {
    if (!inputText.trim()) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch('/api/items/parse-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText }),
      });

      if (!response.ok) throw new Error('API Error');

      const result = await response.json();
      
      if (result.itemName && result.location) {
        addItem({
          id: generateId(),
          itemName: result.itemName,
          location: result.location,
          dateAdded: new Date().toISOString(),
        });
        setInputText('');
      } else {
        alert('কোথায় কী রেখেছেন তা বুঝতে সমস্যা হয়েছে। দয়া করে আবার লিখুন।');
      }
    } catch (err) {
      alert('সিস্টেম এরর।');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredItems = items.filter((item) => {
    if (!searchQuery) return true;
    const lowerQ = searchQuery.toLowerCase();
    return item.itemName.toLowerCase().includes(lowerQ) || item.location.toLowerCase().includes(lowerQ);
  });

  return (
    <div className="flex flex-col h-full bg-slate-950">
      <div className="p-4 bg-orange-900 text-white rounded-b-2xl shadow-md">
        <h1 className="text-2xl font-semibold mb-2">লস্ট অ্যান্ড ফাউন্ড</h1>
        <p className="text-orange-200 text-sm">ভুলে যাওয়া জিনিসপত্র সহজে খুঁজে পান</p>
        
        <div className="mt-4 relative text-orange-900">
          <input
            type="text"
            placeholder="কী খুঁজছেন? (যেমন: চাবি)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border-none shadow-inner bg-orange-950 text-slate-100 placeholder-orange-400 focus:ring-2 focus:ring-orange-400"
          />
          <Search className="absolute left-3 top-3.5 text-orange-400 w-5 h-5" />
        </div>
      </div>

      <div className="p-4 flex-grow overflow-y-auto w-full max-w-md mx-auto">
        
        {/* Input Box for adding items */}
        <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-700 p-3 mb-6">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 pl-1">
            কোথায় রেখেছেন মনে রাখুন
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="যেমন: চাবিটা আলমারির ড্রয়ারে রাখলাম"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveText()}
              className="flex-1 bg-slate-950 px-4 py-3 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-700 transition text-sm text-slate-100 placeholder-slate-600"
              disabled={isProcessing}
            />
            <button
              onClick={handleSaveText}
              disabled={isProcessing || !inputText.trim()}
              className="bg-orange-800 hover:bg-orange-700 text-white p-3 rounded-lg disabled:opacity-50 transition"
            >
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="space-y-3 pb-20">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <div key={item.id} className="bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-700 flex items-start space-x-4">
                <div className="p-3 bg-amber-950/50 text-amber-500 rounded-full flex-shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-100 text-base">{item.itemName}</h3>
                  <p className="text-sm text-slate-400 mt-1">জায়গা: <span className="font-medium text-slate-200">{item.location}</span></p>
                  <p className="text-[10px] text-slate-500 mt-2">{new Date(item.dateAdded).toLocaleString()}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-slate-500 py-10">
              <Search className="w-12 h-12 mx-auto text-slate-700 mb-3 block" />
              <p>{searchQuery ? "কিছু পাওয়া যায়নি।" : "আপনি এখনো কোনো তথ্য রাখেননি।"}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
