import React, { useState } from 'react';
import { Mail, Lock, Fingerprint, Chrome, EyeOff, Eye, User, Phone, KeyRound, AlertTriangle, ArrowRight, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { signInWithGoogle, auth, db } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function LoginScreen() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showFirebaseGuide, setShowFirebaseGuide] = useState(false);
  const navigate = useNavigate();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError('');
    setMessage('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const isAdminEmail = cred.user.email === 'riyamost75@gmail.com';
        await setDoc(doc(db, 'users', cred.user.uid), {
          email: cred.user.email,
          name: name || cred.user.email?.split('@')[0] || 'User',
          phone: phone || '',
          role: isAdminEmail ? 'admin' : 'user',
          createdAt: serverTimestamp()
        });
      }
      navigate('/');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed' || err.message?.includes('operation-not-allowed')) {
        setError('Email/Password provider is not enabled in Firebase project.');
        setShowFirebaseGuide(true);
      } else {
        setError(err.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await signInWithGoogle();
      navigate('/');
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled. Please try again.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Sign-in popup blocked. Please allow popups.');
      } else {
        setError('Google Sign-in failed. Error: ' + (err.message || err.code));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = () => {
    alert('Biometric Login hardware API is not active in this environment.');
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('পাসওয়ার্ড রিস্টোর করতে আগে আপনার ইমেইল দিন। (Please enter email first)');
      setMessage('');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('পাসওয়ার্ড রিসেট লিঙ্ক আপনার ইমেইলে পাঠানো হয়েছে! ইনবক্স চেক করুন।');
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email.');
      setMessage('');
    }
  };

  return (
    <div className="h-screen w-full flex justify-center items-center bg-[#1a1c23] overflow-hidden font-sans relative">
      {/* Background overlay texture simulation */}
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-700 via-[#1a1c23] to-[#1a1c23]"></div>

      <div className="w-full max-w-sm bg-[#222831] relative rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col h-full sm:h-auto max-h-[95vh] pb-6 pt-8">
        
        {/* Decorative Wave SVG (Bottom) */}
        <div className="absolute bottom-0 left-0 w-full pointer-events-none z-0">
          <svg viewBox="0 0 1440 320" className="w-full h-auto text-[#3b82f6] opacity-70 border-none">
            <path fill="currentColor" fillOpacity="1" d="M0,96L48,112C96,128,192,160,288,181.3C384,203,480,213,576,202.7C672,192,768,160,864,160C960,160,1056,192,1152,192C1248,192,1344,160,1392,144L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>

        {/* Content Container */}
        <div className="flex-1 px-8 relative z-10 overflow-y-auto custom-scrollbar flex flex-col">
          
          <div className="flex flex-col items-center mb-6">
            {/* Logo */}
            <div className="flex items-center space-x-1.5 mb-2">
              <div className="flex flex-col space-y-1">
                <div className="w-3 h-3 bg-blue-400 rounded-sm animate-pulse"></div>
                <div className="w-3 h-3 bg-yellow-400 rounded-sm animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <div className="text-white text-4xl font-extrabold tracking-tighter">W</div>
            </div>
            
            <h1 className="text-lg font-bold text-white tracking-widest uppercase text-center">
               SYSTEM PORTAL
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              {isLogin ? 'ব্যবহারকারী লগইন পোর্টাল' : 'একটি নতুন অ্যাকাউন্ট তৈরি করুন'}
            </p>
          </div>

          {/* Tab switching */}
          <div className="grid grid-cols-2 bg-slate-800/45 p-1 rounded-lg mb-6 border border-slate-750">
            <button 
              type="button"
              onClick={() => { setIsLogin(true); setError(''); setMessage(''); }}
              className={`py-1.5 text-xs font-bold rounded-md transition-all ${isLogin ? 'bg-[#f2b93a] text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              লগইন (Login)
            </button>
            <button 
              type="button"
              onClick={() => { setIsLogin(false); setError(''); setMessage(''); }}
              className={`py-1.5 text-xs font-bold rounded-md transition-all ${!isLogin ? 'bg-[#f2b93a] text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              রেজিস্ট্রেশন (Sign Up)
            </button>
          </div>

          {/* Primary Recommended Shortcut: GOOGLE SIGN-IN */}
          <div className="mb-5">
            <button
              onClick={handleGoogleLogin}
              type="button"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-3 bg-white hover:bg-slate-100 text-slate-900 font-bold py-3 px-4 rounded-xl shadow-lg transition-transform active:scale-95 disabled:opacity-50"
            >
              <Chrome className="w-5 h-5 text-red-500" />
              <span className="text-sm">Google দিয়ে ১-ক্লিকে {isLogin ? 'লগইন করুন' : 'রেজিস্ট্রেশন করুন'}</span>
            </button>
            <p className="text-[10px] text-center text-emerald-400/95 font-medium mt-1.5 bg-emerald-950/20 py-1 px-2 rounded-lg border border-emerald-900/10">
              💡 এটি সবচেয়ে সহজ ও নিরাপদ! কোনো অতিরিক্ত পাসওয়ার্ড বা ঝামেলা লাগবে না।
            </p>
          </div>

          {/* Divider */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-700"></div>
            <span className="flex-shrink mx-4 text-[10px] text-slate-500 font-bold uppercase tracking-wider">অথবা ইমেইল দিয়ে</span>
            <div className="flex-grow border-t border-slate-700"></div>
          </div>

          {/* Email registration form */}
          <form onSubmit={handleEmailAuth} className="space-y-4 mt-2">
            
            {!isLogin && (
              <>
                <div className="relative flex items-end">
                  <div className="pb-1.5 pl-1 pr-3">
                    <User className="h-4.5 w-4.5 text-[#5e95ed]" />
                  </div>
                  <div className="flex-1 border-b border-slate-755 focus-within:border-[#5e95ed] transition-colors pb-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-400">নাম (Name) <span className="text-slate-500 font-normal italic">(ঐচ্ছিক - Optional)</span></span>
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-transparent text-white placeholder-slate-600 focus:outline-none text-sm mt-0.5"
                      placeholder="যেমন: মোঃ শামীম হোসেন"
                    />
                  </div>
                </div>

                <div className="relative flex items-end">
                  <div className="pb-1.5 pl-1 pr-3">
                    <Phone className="h-4.5 w-4.5 text-[#5e95ed]" />
                  </div>
                  <div className="flex-1 border-b border-slate-755 focus-within:border-[#5e95ed] transition-colors pb-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-400">মোবাইল (Phone) <span className="text-slate-500 font-normal italic">(ঐচ্ছিক - Optional)</span></span>
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-transparent text-white placeholder-slate-600 focus:outline-none text-sm mt-0.5"
                      placeholder="যেমন: 017xxxxxxxx"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="relative flex items-end">
              <div className="pb-1.5 pl-1 pr-3">
                <Mail className="h-4.5 w-4.5 text-[#5e95ed]" />
              </div>
              <div className="flex-1 border-b border-slate-755 focus-within:border-[#5e95ed] transition-colors pb-1">
                <span className="text-[10px] text-slate-400">ইমেইল ঠিকানা (Email Address)</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent text-white placeholder-slate-600 focus:outline-none text-sm mt-0.5"
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            <div className="relative flex items-end">
              <div className="pb-1.5 pl-1 pr-3">
                <KeyRound className="h-4.5 w-4.5 text-[#5e95ed]" />
              </div>
              <div className="flex-1 border-b border-slate-755 focus-within:border-[#5e95ed] transition-colors pb-1 relative">
                <span className="text-[10px] text-slate-400">পাসওয়ার্ড (Password)</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent text-white placeholder-slate-600 focus:outline-none text-sm mt-0.5 pr-8"
                  placeholder="কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 bottom-1 text-slate-555 hover:text-slate-300"
                >
                  {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {isLogin && (
              <div className="text-right pt-0.5">
                <button type="button" onClick={handleForgotPassword} className="text-[10px] text-[#5e95ed] hover:text-white transition">
                  পাসওয়ার্ড ভুলে গেছেন? (Forgot Password?)
                </button>
              </div>
            )}

            {/* Error notifications & guide */}
            {error && (
              <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-xl text-left space-y-2">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-red-200 font-medium leading-normal">
                    {error === 'Email/Password provider is not enabled in Firebase project.' ? (
                      <span>ইমেইল ও পাসওয়ার্ড রেজিস্টার পদ্ধতিটি আপনার ফায়ারবেস কনসোলে বন্ধ করা আছে!</span>
                    ) : (
                      <span>{error}</span>
                    )}
                  </div>
                </div>
                
                {showFirebaseGuide && (
                  <div className="pt-2 border-t border-red-900/30 text-[11px] text-slate-300 space-y-1.5 bg-red-955/20 p-2 rounded">
                    <p className="font-bold text-amber-400">🛠️ দ্রুত সমাধানের ২টি সহজ উপায়:</p>
                    <div className="leading-relaxed space-y-1 font-normal">
                      <p>
                        <span className="font-bold text-white">উপায় ১ (সবচেয়ে সহজ):</span> উপরে সরাসরি <span className="font-bold text-emerald-400">Google বোতামটিতে</span> ক্লিক করুন। এটি ফায়ারবেসে এমনিতেই অটোমেটিক চালু থাকে, কোনো ঝামেলা ছাড়াই ১-ক্লিকে লগইন হয়ে যাবে!
                      </p>
                      <p>
                        <span className="font-bold text-white">উপায় ২:</span> আপনি যদি ইমেইল-পাসওয়ার্ড দিয়েই করতে চান, তবে আপনার <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="text-sky-400 underline font-bold hover:text-sky-300 inline-block">Firebase Console-এ</a> প্রবেশ করে <span className="text-yellow-400 font-bold">Authentication &gt; Sign-in method</span> ট্যাবে যান, এবং সেখানে <span className="text-yellow-400 font-bold">Email/Password</span> কে <span className="text-emerald-400 font-bold">Enable</span> (চালু) করে দিন।
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {message && <div className="text-green-300 text-xs text-center font-medium bg-green-950/40 border border-green-800/40 p-2.5 rounded-xl">{message}</div>}

            <div className="pt-3 pb-2">
               <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#f2b93a] hover:bg-[#e0a830] text-slate-900 font-extrabold py-3 px-4 rounded-xl transition-all shadow-[0_4px_15px_rgba(242,185,58,0.3)] disabled:opacity-50 transform hover:-translate-y-0.5 active:translate-y-0 text-sm"
                >
                  {loading ? (
                    <span className="flex items-center justify-center space-x-2">
                      <span className="animate-spin h-4 w-4 border-2 border-slate-900 border-t-transparent rounded-full"></span>
                      <span>কাজ হচ্ছে...</span>
                    </span>
                  ) : isLogin ? (
                    'লগইন করুন (Sign In)'
                  ) : (
                    'নতুন অ্যাকাউন্ট তৈরি করুন'
                  )}
                </button>
            </div>
          </form>

          {/* Help link */}
          <div className="mt-4 pt-2 border-t border-slate-800 text-center">
            <button 
              type="button"
              onClick={() => setShowFirebaseGuide(!showFirebaseGuide)}
              className="text-slate-500 hover:text-slate-300 text-[11px] inline-flex items-center space-x-1.5"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>রেজিস্ট্রেশন বা ফায়ারবেস সাহায্য (Firebase Help)</span>
            </button>
            {showFirebaseGuide && !error && (
              <div className="mt-2 text-left bg-slate-800/40 border border-slate-700/50 rounded-xl p-3 text-[11px] text-slate-300 space-y-1.5">
                <p className="font-bold text-amber-400">বাটন কাজ করছে না বা এরর দেখাচ্ছে?</p>
                <p className="leading-relaxed font-normal">
                  আপনার ফায়ারবেস ডেটাবেজ ও সাইন-ইন মেথডগুলো সফলভাবে কাজ করার জন্য <span className="text-white font-semibold">Google Auth</span> এবং <span className="text-white font-semibold">Email/Password</span> অপশনগুলো আপনার ফায়ারবেস প্রজেক্ট কনসোলে চালু করা থাকতে হবে। <span className="text-emerald-400 font-bold">১-ক্লিক Google সাইন-ইন</span> ব্যবহার করাই সবচেয়ে সহজ ও ঝামেলাহীন উপায়।
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
