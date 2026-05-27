import { Upload, FileText, Search, Loader2, Trash2, Edit, X, Check, Folder, Plus, ChevronLeft, File, Download } from 'lucide-react';
import { DocumentItem } from '../types';
import { fileToBase64, generateId } from '../lib/utils';
import React, { useState } from 'react';

export default function DocumentVault({
  documents,
  addDocument,
  updateDocument,
  deleteDocument
}: {
  documents: DocumentItem[];
  addDocument: (doc: DocumentItem) => void;
  updateDocument: (doc: DocumentItem) => void;
  deleteDocument: (id: string) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingDoc, setViewingDoc] = useState<DocumentItem | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [editCategory, setEditCategory] = useState('');
  const [editSummary, setEditSummary] = useState('');
  
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [customFolders, setCustomFolders] = useState<string[]>([]);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const downloadFile = (doc: DocumentItem) => {
    const link = document.createElement('a');
    link.href = doc.image;
    link.download = `document_${new Date(doc.dateAdded).getTime()}.${doc.image.startsWith('data:application/pdf') ? 'pdf' : 'png'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Convert PDF base64 to Blob URL dynamically to prevent downloads and enable inline preview
  React.useEffect(() => {
    if (viewingDoc && viewingDoc.image.startsWith('data:application/pdf')) {
      try {
        const parts = viewingDoc.image.split(';base64,');
        const contentType = parts[0].split(':')[1] || 'application/pdf';
        const byteCharacters = atob(parts[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: contentType });
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);

        return () => {
          URL.revokeObjectURL(url);
          setPdfUrl(null);
        };
      } catch (err) {
        console.error('Error creating PDF blob URL', err);
        setPdfUrl(viewingDoc.image);
      }
    } else {
      setPdfUrl(null);
    }
  }, [viewingDoc]);

  const allFolders = Array.from(new Set([...documents.map(d => d.category), ...customFolders, 'Other'])).filter(Boolean);

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      setCustomFolders(prev => [...Array.from(new Set([...prev, newFolderName.trim()]))]);
      setNewFolderName('');
      setIsCreatingFolder(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const base64Data = await fileToBase64(file);

        let categoryToUse = currentFolder;
        let summaryToUse = 'কোনো বিবরণ নেই';
        let keywordsToUse: string[] = [];

        // Only auto-categorize if uploaded outside any specific folder (in root or "Other")
        if (!currentFolder || currentFolder === 'Other') {
          const response = await fetch('/api/documents/categorize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              base64Data,
              mimeType: file.type,
            }),
          });
          if (response.ok) {
             const result = await response.json();
             categoryToUse = result.category || 'Other';
             keywordsToUse = result.keywords || [];
             summaryToUse = result.summary || summaryToUse;
          } else {
             categoryToUse = 'Other';
          }
        }

        addDocument({
          id: generateId(),
          image: base64Data,
          category: categoryToUse || 'Other',
          keywords: keywordsToUse,
          summary: summaryToUse,
          dateAdded: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Failed to upload and process documents.', err);
    } finally {
      setIsUploading(false);
    }
  };

  const startEditing = (doc: DocumentItem) => {
    setEditingId(doc.id);
    setEditCategory(doc.category);
    setEditSummary(doc.summary);
  };

  const saveEdit = (doc: DocumentItem) => {
    updateDocument({
      ...doc,
      category: editCategory || 'Other',
      summary: editSummary
    });
    setEditingId(null);
  };

  const confirmDelete = (id: string) => {
    deleteDocument(id);
    setDeletingId(null);
  };

  // If search query exists, show flat matching list
  const isSearching = searchQuery.trim().length > 0;
  
  const filteredDocs = isSearching 
    ? documents.filter((doc) => {
        const lowerQ = searchQuery.toLowerCase();
        return (
          doc.category.toLowerCase().includes(lowerQ) ||
          doc.summary.toLowerCase().includes(lowerQ) ||
          doc.keywords.some((k) => k.toLowerCase().includes(lowerQ))
        );
      })
    : (currentFolder ? documents.filter(d => d.category === currentFolder) : []);

  const renderDocCard = (doc: DocumentItem) => {
    const isImage = doc.image && doc.image.startsWith('data:image');
    const isPdf = doc.image && doc.image.startsWith('data:application/pdf');
    return (
      <div key={doc.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-start space-x-4 relative group">
        <div onClick={() => setViewingDoc(doc)} className="flex-shrink-0 w-16 h-16 bg-slate-100 hover:bg-slate-200 cursor-pointer rounded-lg overflow-hidden flex items-center justify-center border border-slate-200 transition" title="View Document">
          {isImage ? (
            <img src={doc.image} alt={doc.category} className="w-full h-full object-cover" />
          ) : isPdf ? (
            <div className="text-red-500 font-bold flex flex-col items-center">
               <FileText className="w-6 h-6 mb-0.5" />
               <span className="text-[10px]">PDF</span>
            </div>
          ) : (
            <File className="text-slate-400 w-8 h-8" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          {editingId === doc.id ? (
            <div className="flex flex-col space-y-2 w-full">
              <input 
                type="text" 
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="text-xs font-medium border border-blue-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400 w-full"
                placeholder="ক্যাটাগরি / ফোল্ডার (Folder)"
              />
              <textarea 
                value={editSummary}
                onChange={(e) => setEditSummary(e.target.value)}
                className="text-sm text-slate-700 border border-slate-200 rounded px-2 py-1 w-full focus:outline-none focus:border-blue-400 resize-none h-16"
                placeholder="বিবরণ (Summary)"
              />
              <div className="flex space-x-2 pt-1">
                <button onClick={() => saveEdit(doc)} className="bg-green-500 text-white rounded p-1 hover:bg-green-600 transition flex items-center text-xs px-2"><Check className="w-3 h-3 mr-1"/> সেভ</button>
                <button onClick={() => setEditingId(null)} className="bg-slate-200 text-slate-600 rounded p-1 hover:bg-slate-300 transition flex items-center text-xs px-2"><X className="w-3 h-3 mr-1"/> বাতিল</button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-start">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 truncate max-w-[120px]">
                  {doc.category}
                </span>
                {deletingId === doc.id ? (
                  <div className="flex items-center space-x-1 ml-2">
                    <button onClick={() => confirmDelete(doc.id)} className="p-1 px-2 text-xs bg-red-100 text-red-600 hover:bg-red-200 rounded font-semibold whitespace-nowrap">মুছুন</button>
                    <button onClick={() => setDeletingId(null)} className="p-1 px-2 text-xs bg-slate-100 text-slate-600 hover:bg-slate-200 rounded font-semibold whitespace-nowrap">বাতিল</button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button onClick={() => downloadFile(doc)} className="p-1.5 text-slate-400 hover:text-green-500 rounded bg-slate-50 sm:bg-transparent"><Download className="w-4 h-4" /></button>
                    <button onClick={() => startEditing(doc)} className="p-1.5 text-slate-400 hover:text-blue-500 rounded bg-slate-50 sm:bg-transparent"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => setDeletingId(doc.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded bg-slate-50 sm:bg-transparent"><Trash2 className="w-4 h-4" /></button>
                  </div>
                )}
              </div>
              <p className="text-sm text-slate-700 mt-1 line-clamp-2">{doc.summary}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                <span className="text-[10px] text-slate-400 mr-2 flex items-center border-r pr-2">{new Date(doc.dateAdded).toLocaleDateString()}</span>
                {doc.keywords.slice(0, 3).map((kw, idx) => (
                  <span key={idx} className="bg-slate-100 text-slate-600 text-[10px] px-2 py-1 rounded-md">
                    #{kw}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-950">
      <div className="p-4 bg-indigo-900 text-white rounded-b-2xl shadow-md z-10 shrink-0">
        {!isSearching && currentFolder && (
          <button onClick={() => setCurrentFolder(null)} className="flex items-center space-x-1 text-indigo-200 hover:text-white mb-3 text-sm font-medium transition">
            <ChevronLeft className="w-4 h-4" /> <span>ভল্টে ফিরুন (Back)</span>
          </button>
        )}
        <h1 className="text-2xl font-semibold mb-2">
          {isSearching ? 'ফলাফল (Search Results)' : currentFolder ? <span className="flex items-center text-indigo-100"><Folder className="w-6 h-6 mr-2 text-yellow-500 fill-yellow-500"/> {currentFolder}</span> : 'ডকুমেন্ট ভল্ট (Vault)'}
        </h1>
        {!currentFolder && !isSearching && <p className="text-indigo-200 text-sm">জরুরি পেপার্স, এনআইডি, জমির দলিল সব এক জায়গায়</p>}
        
        <div className="mt-4 relative text-indigo-900">
          <input
            type="text"
            placeholder="ফাইল খুঁজুন (Search files)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border-none shadow-inner bg-indigo-950 text-slate-100 placeholder-indigo-400 focus:ring-2 focus:ring-indigo-400"
          />
          <Search className="absolute left-3 top-3.5 text-indigo-400 w-5 h-5" />
        </div>
      </div>

      <div className="p-4 flex-grow overflow-y-auto w-full max-w-md mx-auto relative custom-scrollbar">
        {/* Upload Button */}
        {(!isSearching && currentFolder !== null) && (
          <div className="mb-6 flex justify-center">
            <label className="flex flex-col items-center justify-center w-full max-w-sm h-32 border-2 border-indigo-700 border-dashed rounded-xl cursor-pointer bg-slate-900 hover:bg-slate-800 transition drop-shadow-sm">
              {isUploading ? (
                <div className="flex flex-col items-center space-y-2 text-indigo-400">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="text-sm font-medium">ডকুমেন্ট প্রসেস করা হচ্ছে...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-indigo-400">
                  <Upload className="w-8 h-8 mb-2" />
                  <p className="text-sm font-medium">এই ফোল্ডারে ফাইল আপলোড করুন</p>
                  <p className="text-xs text-indigo-600 mt-1">Images, PDF, etc. (একাধিক সম্ভব)</p>
                </div>
              )}
              <input type="file" className="hidden" multiple accept="image/*,application/pdf" onChange={handleFileUpload} disabled={isUploading} />
            </label>
          </div>
        )}

        {/* Folder Creation Form */}
        {!isSearching && currentFolder === null && isCreatingFolder && (
          <div className="mb-6 bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-700">
            <h3 className="text-sm font-bold text-slate-100 mb-3 block">নতুন ফোল্ডার তৈরি করুন</h3>
            <div className="flex space-x-2">
              <input 
                type="text" 
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="ফোল্ডারের নাম (যেমন: Medical)" 
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                autoFocus
              />
              <button onClick={handleCreateFolder} className="bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-600 transition">তৈরি</button>
              <button onClick={() => { setIsCreatingFolder(false); setNewFolderName(''); }} className="bg-slate-800 text-slate-300 px-3 py-2 rounded-lg text-sm hover:bg-slate-700 transition"><X className="w-5 h-5"/></button>
            </div>
          </div>
        )}

        {/* Flat listing for Searching OR specific Folder view */}
        {(isSearching || currentFolder !== null) ? (
          <div className="space-y-4 pb-20">
            {filteredDocs.length > 0 ? (
              filteredDocs.map(renderDocCard)
            ) : (
              <div className="text-center text-slate-500 py-10">
                <FileText className="w-12 h-12 mx-auto text-slate-700 mb-3" />
                <p>কোনো ফাইল পাওয়া যায়নি। (No files found)</p>
              </div>
            )}
          </div>
        ) : (
          /* Folder Grid View */
          <div className="pb-20">
            <div className="grid grid-cols-2 gap-4">
               {/* Add Folder Button Card */}
               <button onClick={() => setIsCreatingFolder(true)} className="flex flex-col items-center justify-center p-6 bg-slate-900 border-2 border-dashed border-indigo-900 rounded-2xl hover:border-indigo-700 hover:bg-slate-800 transition group min-h-[140px] shadow-sm">
                  <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center group-hover:bg-slate-700 transition mb-3">
                    <Plus className="w-6 h-6 text-indigo-500" />
                  </div>
                  <span className="font-semibold text-slate-300 text-sm">নতুন ফোল্ডার</span>
               </button>

               {/* Folder Cards */}
               {allFolders.map(folderName => {
                 const count = documents.filter(d => d.category === folderName).length;
                 return (
                   <button key={folderName} onClick={() => setCurrentFolder(folderName)} className="flex flex-col items-start p-5 bg-slate-900 border border-slate-700 rounded-2xl shadow-sm hover:shadow-md transition text-left relative overflow-hidden group min-h-[140px]">
                     <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-indigo-950 to-slate-900 rounded-bl-3xl opacity-50 z-0"></div>
                     <Folder className="w-10 h-10 text-yellow-500 fill-yellow-500 drop-shadow-sm mb-auto relative z-10 group-hover:scale-105 transition-transform" />
                     <div className="relative z-10 w-full mt-4">
                       <h3 className="font-bold text-slate-100 text-[15px] truncate w-full">{folderName}</h3>
                       <p className="text-xs text-slate-400 mt-0.5">{count} ফাইল (Files)</p>
                     </div>
                   </button>
                 );
               })}
            </div>
          </div>
        )}
      </div>

      {viewingDoc && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col p-4 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-4 text-white shrink-0">
            <div className="min-w-0 flex-1 mr-4">
              <span className="text-xs bg-indigo-900 px-2 py-0.5 rounded font-semibold text-indigo-200 uppercase">{viewingDoc.category}</span>
              <h3 className="font-bold truncate mt-0.5 text-sm sm:text-base text-slate-100">{viewingDoc.summary}</h3>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <button 
                onClick={() => downloadFile(viewingDoc)}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full transition text-white"
                title="Download"
              >
                <Download className="w-5 h-5" />
              </button>
              {viewingDoc.image.startsWith('data:application/pdf') && pdfUrl && (
                <a 
                  href={pdfUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="px-3 py-1.5 bg-indigo-800 hover:bg-indigo-700 font-bold text-xs rounded-lg transition inline-flex items-center border border-indigo-600 text-white"
                >
                  ফুল স্ক্রীন
                </a>
              )}
              <button onClick={() => setViewingDoc(null)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full transition text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex-1 rounded-xl overflow-hidden flex items-center justify-center relative bg-slate-950 border border-slate-800">
            {viewingDoc.image.startsWith('data:application/pdf') ? (
              pdfUrl ? (
                <iframe src={`${pdfUrl}#toolbar=0&navpanes=0`} className="w-full h-full bg-white rounded-lg border-none" title="PDF Viewer" />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-300">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
                  <p className="text-sm">পিডিএফ লোড করা হচ্ছে...</p>
                </div>
              )
            ) : viewingDoc.image.startsWith('data:image') ? (
               <img src={viewingDoc.image} alt="Document View" className="max-w-full max-h-full object-contain" />
            ) : (
               <div className="bg-slate-900 p-6 rounded-xl flex flex-col items-center">
                 <File className="w-16 h-16 text-slate-600 mb-3" />
                 <p className="text-slate-400 font-medium">এই ফাইলের প্রিভিউ দেখা সম্ভব নয়।</p>
               </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}