
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { BlogInputs, GeneratedBlog, SearchIntent, Country, SEOScoreResult, ChatMessage, KeywordMetric } from './types';
import { generateFullSuperPage, analyzeSEOContent } from './services/geminiService';
import { 
  Zap, Copy, Loader2, Moon, Sun,
  Check, Sparkles, MessageSquare, 
  Send, Smartphone, BarChart3, Layout, ChevronUp, ChevronDown, 
  Flame, MapPin, Link as LinkIcon, Globe, ExternalLink, Key, AlertCircle, Info,
  Download, History, Trash2, Plus, Target, Search, Database, Fingerprint, TrendingUp,
  BrainCircuit, ShieldCheck, Heart, Info as InfoIcon
} from 'lucide-react';

const COUNTRIES: Country[] = [
  { name: "Global (Universal Authority)", code: "GL", capital: "Worldwide", cities: ["N/A - Global Focus"] },
  { name: "United States", code: "US", capital: "Washington, D.C.", cities: ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Miami", "Seattle"] },
  { name: "United Kingdom", code: "GB", capital: "London", cities: ["London", "Manchester", "Birmingham", "Edinburgh", "Glasgow", "Liverpool"] },
  { name: "Canada", code: "CA", capital: "Ottawa", cities: ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa", "Edmonton"] },
  { name: "Australia", code: "AU", capital: "Canberra", cities: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Gold Coast"] },
  { name: "Germany", code: "DE", capital: "Berlin", cities: ["Berlin", "Munich", "Hamburg", "Frankfurt", "Cologne", "Stuttgart"] },
  { name: "France", code: "FR", capital: "Paris", cities: ["Paris", "Lyon", "Marseille", "Toulouse", "Nice", "Bordeaux"] },
  { name: "India", code: "IN", capital: "New Delhi", cities: ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Pune"] },
  { name: "Japan", code: "JP", capital: "Tokyo", cities: ["Tokyo", "Osaka", "Nagoya", "Yokohama", "Kyoto", "Fukuoka"] },
  { name: "Brazil", code: "BR", capital: "Brasília", cities: ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador", "Fortaleza"] },
  { name: "Mexico", code: "MX", capital: "Mexico City", cities: ["Mexico City", "Guadalajara", "Monterrey", "Cancún", "Tijuana"] },
].sort((a, b) => {
  if (a.code === 'GL') return -1;
  if (b.code === 'GL') return 1;
  return a.name.localeCompare(b.name);
});

const getFlagEmoji = (countryCode: string) => {
  if (countryCode === 'GL') return '🌐';
  const codePoints = countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

const LOADING_MESSAGES = [
  "Performing Deep Competitor Analysis...",
  "Calibrating Neural Empathy Protocols...",
  "Identifying Search Intent Gaps...",
  "Synthesizing Topical Authority...",
  "Optimizing Content Burstiness...",
  "Injecting Local Geographic Signals...",
  "Finalizing Anti-AI Protection Layers..."
];

const ScoreGauge = ({ score }: { score: number }) => {
  const radius = 80;
  const strokeWidth = 14;
  const normalizedScore = Math.min(Math.max(score, 0), 100);
  const percentage = normalizedScore / 100;
  const arcLength = Math.PI * radius;
  const dashArray = arcLength;
  const dashOffset = arcLength * (1 - percentage);

  return (
    <div className="relative flex flex-col items-center justify-center pt-6">
      <svg width="200" height="120" viewBox="0 0 200 120">
        {/* Background Arc */}
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-slate-100 dark:text-slate-800" strokeLinecap="round" />
        {/* Progress Arc */}
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#scoreGradient)" strokeWidth={strokeWidth} strokeDasharray={dashArray} strokeDashoffset={dashOffset} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute top-12 flex flex-col items-center">
        <div className="flex items-center gap-1.5 text-blue-500 mb-1">
          <Flame className="w-4 h-4" />
          <span className="text-xs font-black uppercase tracking-widest">{score}</span>
        </div>
        <div className="text-4xl font-black tracking-tighter">{score}/100</div>
      </div>
    </div>
  );
};

const AuditMetric = ({ label, current, min, max, icon: Icon }: any) => {
  const isHigh = current > max;
  const isLow = current < min;
  return (
    <div className="flex flex-col items-center p-4">
      <div className="text-[10px] font-black uppercase opacity-30 tracking-widest mb-2">{label}</div>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl font-black">{current.toLocaleString()}</span>
        {isHigh && <ChevronUp className="w-4 h-4 text-red-500" />}
        {isLow && <ChevronDown className="w-4 h-4 text-amber-500" />}
        {!isHigh && !isLow && <Check className="w-4 h-4 text-emerald-500" />}
      </div>
      <div className="text-[9px] font-bold opacity-40 uppercase tracking-tighter">{min} - {max}</div>
    </div>
  );
};

const KeywordTag = ({ metric }: { metric: KeywordMetric }) => {
  const borderColor = metric.difficulty === 'hard' ? 'border-red-400' : metric.difficulty === 'medium' ? 'border-amber-400' : 'border-emerald-400';
  const bgColor = metric.difficulty === 'hard' ? 'bg-red-50/50 dark:bg-red-500/5' : metric.difficulty === 'medium' ? 'bg-amber-50/50 dark:bg-amber-500/5' : 'bg-emerald-50/50 dark:bg-emerald-500/5';
  
  return (
    <div className={`px-4 py-2.5 rounded-full border ${borderColor} ${bgColor} flex items-center gap-2.5 transition-all hover:scale-105 cursor-default`}>
      <span className="text-[11px] font-black tracking-tight">{metric.keyword}</span>
      <span className="text-[9px] font-black opacity-40 uppercase tracking-tighter">{metric.count}/{metric.min}-{metric.max}</span>
    </div>
  );
};

const App: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [inputs, setInputs] = useState<BlogInputs>({
    title: '', secondaryKeywords: '', country: 'Global (Universal Authority)', city: 'Worldwide',
    intent: SearchIntent.Informational, niche: 'Marketing',
    language: 'English', tone: 'Expert & Empathetic', audience: 'Professionals', 
    imageSource: 'nanobanana', imageUrl: '', promotionLink: '', customInstructions: ''
  });
  const [currentBlog, setCurrentBlog] = useState<GeneratedBlog | null>(null);
  const [history, setHistory] = useState<GeneratedBlog[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [previewMode, setPreviewMode] = useState<'preview' | 'html'>('preview');
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const selectedCountry = COUNTRIES.find(c => c.name === inputs.country) || COUNTRIES[0];
  const isGlobal = selectedCountry.code === 'GL';

  useEffect(() => {
    const savedTheme = localStorage.getItem('superpage_theme') || 'dark';
    setTheme(savedTheme as any);
    if (savedTheme === 'dark') document.documentElement.classList.add('dark');
    const savedHistory = localStorage.getItem('superpage_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleGenerate = async () => {
    if (!inputs.title.trim()) { setError("Primary keyword is required for research."); return; }
    setLoading(true); setError(null);
    let msgIdx = 0;
    const interval = setInterval(() => setLoadingStep(LOADING_MESSAGES[msgIdx++ % LOADING_MESSAGES.length]), 4500);
    try {
      const result = await generateFullSuperPage(inputs, (step) => setLoadingStep(step));
      const seo = await analyzeSEOContent(inputs.title, inputs.secondaryKeywords, inputs.country, inputs.city, result.html);
      const newBlog: GeneratedBlog = {
        id: crypto.randomUUID(), timestamp: Date.now(), title: inputs.title,
        htmlContent: result.html, previewImageUrl: result.previewImageUrl,
        inputs: { ...inputs }, sources: result.sources, seoResult: seo
      };
      setCurrentBlog(newBlog);
      setHistory(prev => {
        const updated = [newBlog, ...prev].slice(0, 30);
        localStorage.setItem('superpage_history', JSON.stringify(updated));
        return updated;
      });
      setChatMessages([{ role: 'assistant', content: `SuperPage calibrated. Empathy: ${seo.empathyLevel}%, Authority: ${seo.authoritySignal}%. Research integrated from ${result.sources.length} competitors.` }]);
    } catch (err: any) {
      setError(err.message || "Protocol failed. Check API connectivity.");
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!currentBlog) return;
    const blob = new Blob([currentBlog.htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentBlog.title.replace(/\s+/g, '-').toLowerCase()}-superpage.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isChatting || !currentBlog) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsChatting(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: `Original Content:\n${currentBlog.htmlContent.substring(0, 5000)}\n\nUser Question: ${userMsg}` }] }],
        config: { systemInstruction: "You are a World-Class Content Architect. Help improve or refine SuperPage content. Concise actionable advice." }
      });
      setChatMessages(prev => [...prev, { role: 'assistant', content: response.text || "Neural failure." }]);
    } catch (err: any) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: `Terminal error: ${err.message}` }]);
    } finally {
      setIsChatting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020305] flex flex-col font-jakarta transition-colors duration-500 overflow-x-hidden">
      <header className="h-24 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#020305]/80 backdrop-blur-2xl sticky top-0 z-[100] px-10 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-2xl shadow-blue-600/30 ring-4 ring-blue-600/10"><BrainCircuit className="text-white w-7 h-7" /></div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter uppercase flex items-center gap-2">
              SuperPage <span className="text-blue-600 italic">Neural</span>
              <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] tracking-widest font-black border border-emerald-500/20 ml-2 uppercase">Deep Intent v7.0</span>
            </h1>
            <p className="text-[9px] font-black opacity-30 uppercase tracking-[0.5em] leading-none mt-1.5">Viral Content Architect • AI Empathy Protocol</p>
          </div>
        </div>
        <div className="flex items-center gap-5">
           <button onClick={() => setShowHistory(!showHistory)} className={`w-14 h-14 rounded-[1.25rem] border flex items-center justify-center shadow-sm transition-all hover:scale-105 ${showHistory ? 'bg-blue-600 border-blue-600 text-white shadow-blue-500/30' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
             <History className="w-6 h-6" />
           </button>
           <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="w-14 h-14 bg-white dark:bg-slate-800 rounded-[1.25rem] border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm hover:rotate-12 transition-transform">
             {theme === 'light' ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
           </button>
        </div>
      </header>

      <main className="flex-1 max-w-[1850px] mx-auto w-full p-8 lg:p-12 relative">
        <div className={`fixed inset-y-0 right-0 w-80 bg-white dark:bg-slate-900 shadow-2xl z-[150] transform transition-transform duration-500 border-l border-slate-200 dark:border-slate-800 pt-32 px-8 ${showHistory ? 'translate-x-0' : 'translate-x-full'}`}>
           <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 mb-10">Vault of Authority</h3>
           <div className="space-y-5 max-h-[calc(100vh-280px)] overflow-y-auto custom-scrollbar pr-2">
             {history.map(item => (
               <button key={item.id} onClick={() => { setCurrentBlog(item); setShowHistory(false); }} className={`w-full text-left p-5 rounded-2xl border transition-all hover:translate-x-1 ${currentBlog?.id === item.id ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}>
                 <p className="text-[12px] font-black truncate mb-1">{item.title}</p>
                 <p className="text-[9px] opacity-60 font-bold uppercase tracking-widest">{new Date(item.timestamp).toLocaleDateString()}</p>
               </button>
             ))}
           </div>
           <button onClick={() => { setCurrentBlog(null); setShowHistory(false); }} className="absolute bottom-12 left-8 right-8 py-5 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
             <Plus className="w-5 h-5" /> Initialize Blueprint
           </button>
        </div>

        <div className="grid lg:grid-cols-12 gap-12">
          <aside className="lg:col-span-4 xl:col-span-3 space-y-8">
            <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl p-10 sticky top-36">
              <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-600 mb-10 flex items-center gap-3"><Target className="w-5 h-5" /> Deep Blueprint</h2>
              <div className="space-y-8">
                <div>
                  <label className="text-[10px] font-black uppercase opacity-40 mb-3 block tracking-widest">Viral Focus Keyword</label>
                  <input value={inputs.title} onChange={e => setInputs({...inputs, title: e.target.value})} placeholder="e.g. Best Eco-Tourism in 2025" className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 font-black outline-none focus:border-blue-500 transition-colors placeholder:opacity-20" />
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="text-[10px] font-black uppercase opacity-40 mb-3 block tracking-widest">Country Target</label>
                    <select value={inputs.country} onChange={e => { const c = COUNTRIES.find(x => x.name === e.target.value); if(c) setInputs({...inputs, country: c.name, city: c.capital}); }} className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-2xl pl-5 pr-3 py-4 font-black text-xs appearance-none">
                      {COUNTRIES.map(c => <option key={c.name} value={c.name}>{getFlagEmoji(c.code)} {c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={`text-[10px] font-black uppercase opacity-40 mb-3 block tracking-widest ${isGlobal ? 'opacity-10' : ''}`}>Local Intent</label>
                    <input list="city-list" value={isGlobal ? 'Worldwide' : inputs.city} disabled={isGlobal} onChange={e => setInputs({...inputs, city: e.target.value})} className={`w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 font-black text-xs focus:border-blue-500 outline-none transition-opacity ${isGlobal ? 'opacity-30 cursor-not-allowed' : ''}`} />
                    {!isGlobal && <datalist id="city-list">{selectedCountry.cities.map(city => <option key={city} value={city} />)}</datalist>}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase opacity-40 mb-3 block tracking-widest">LSI / Secondary Terms</label>
                  <textarea value={inputs.secondaryKeywords} onChange={e => setInputs({...inputs, secondaryKeywords: e.target.value})} placeholder="Solar ROI, sustainable travel cost..." className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 font-black text-xs outline-none focus:border-blue-500 h-24 resize-none" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase opacity-40 mb-3 block tracking-widest flex items-center gap-2"><Heart className="w-3.5 h-3.5 text-emerald-500" /> Humanity Protocol</label>
                  <select value={inputs.tone} onChange={e => setInputs({...inputs, tone: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 font-black text-xs appearance-none">
                    <option>Expert & Empathetic</option>
                    <option>Viral & High-Energy</option>
                    <option>Professional & Scientific</option>
                    <option>Witty & Sarcastic</option>
                  </select>
                </div>
              </div>
              {error && <div className="mt-8 p-5 rounded-2xl bg-red-500/10 border border-red-500/20 text-[10px] font-black text-red-600 uppercase tracking-widest flex gap-3 animate-bounce"><AlertCircle className="w-4 h-4" /> {error}</div>}
              <button onClick={handleGenerate} disabled={loading} className="w-full mt-10 py-6 bg-blue-600 hover:bg-blue-700 text-white rounded-[2rem] font-black text-xs tracking-[0.3em] shadow-[0_20px_40px_rgba(37,99,235,0.3)] flex flex-col items-center transition-all disabled:opacity-50 hover:-translate-y-1 active:scale-95">
                {loading ? <><Loader2 className="animate-spin w-6 h-6 mb-2" /><span className="text-[9px] uppercase animate-pulse">{loadingStep}</span></> : <><Sparkles className="w-5 h-5 mr-2 mb-1" /> GENERATE NEURAL PAGE</>}
              </button>
            </div>
          </aside>

          <section className="lg:col-span-8 xl:col-span-9">
            {currentBlog ? (
              <div className="grid xl:grid-cols-12 gap-12">
                <div className="xl:col-span-7 space-y-10">
                  <div className="bg-white dark:bg-[#0a0c10] rounded-[4rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden min-h-[950px] flex flex-col">
                    <div className="px-12 py-8 border-b border-slate-100 dark:border-slate-800 flex flex-wrap gap-6 justify-between items-center bg-slate-50/50 dark:bg-slate-950/40">
                       <div className="flex bg-white dark:bg-slate-950 rounded-[1.5rem] p-1.5 border border-slate-200 dark:border-slate-800 shadow-inner">
                          <button onClick={() => setPreviewMode('preview')} className={`px-10 py-4 rounded-[1.25rem] text-[11px] font-black uppercase transition-all ${previewMode === 'preview' ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>Viral Render</button>
                          <button onClick={() => setPreviewMode('html')} className={`px-10 py-4 rounded-[1.25rem] text-[11px] font-black uppercase transition-all ${previewMode === 'html' ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>Blogger HTML</button>
                       </div>
                       <div className="flex items-center gap-4">
                         <button onClick={handleDownload} className="w-14 h-14 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[1.25rem] flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all"><Download className="w-6 h-6 opacity-60" /></button>
                         <button onClick={() => { navigator.clipboard.writeText(currentBlog.htmlContent); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="px-10 py-5 bg-slate-900 dark:bg-blue-600 text-white rounded-[1.25rem] text-[11px] font-black uppercase flex items-center gap-4 shadow-2xl hover:bg-black dark:hover:bg-blue-700 transition-all active:scale-95">
                            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />} {copied ? 'COPIED' : 'EXTRACT ASSETS'}
                         </button>
                       </div>
                    </div>
                    <div className="p-12 lg:p-20 flex-1 overflow-y-auto custom-scrollbar">
                      {previewMode === 'preview' ? <article className="blogger-preview animate-in" dangerouslySetInnerHTML={{ __html: currentBlog.htmlContent }} /> : <pre className="text-[12px] font-mono bg-slate-950 text-emerald-400/80 p-12 rounded-[2.5rem] whitespace-pre-wrap leading-relaxed border border-slate-800 h-full selection:bg-emerald-500 selection:text-black">{currentBlog.htmlContent}</pre>}
                    </div>
                  </div>
                </div>

                <aside className="xl:col-span-5 space-y-10">
                  <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl p-10 sticky top-36 flex flex-col gap-10">
                      <div>
                        <h3 className="text-[11px] font-black uppercase tracking-[0.4em] opacity-40 mb-4 flex items-center justify-center gap-3">
                          Content Score <InfoIcon className="w-3.5 h-3.5" />
                        </h3>
                        <div className="border-b border-slate-100 dark:border-slate-800 pb-10">
                           <ScoreGauge score={currentBlog.seoResult?.score || 0} />
                           <p className="text-center text-blue-600 text-[10px] font-black uppercase tracking-widest mt-6 cursor-pointer hover:underline">Select competitors</p>
                        </div>
                        
                        <div className="py-10 border-b border-slate-100 dark:border-slate-800">
                          <h4 className="text-[11px] font-black uppercase tracking-[0.4em] opacity-40 mb-8 flex items-center gap-2">
                             Structure <InfoIcon className="w-3.5 h-3.5" />
                          </h4>
                          <div className="grid grid-cols-2 gap-px bg-slate-100 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden">
                             <div className="bg-white dark:bg-slate-900"><AuditMetric label="Words" current={currentBlog.seoResult?.structure.words.current} min={currentBlog.seoResult?.structure.words.min} max={currentBlog.seoResult?.structure.words.max} /></div>
                             <div className="bg-white dark:bg-slate-900"><AuditMetric label="H2" current={currentBlog.seoResult?.structure.h2.current} min={currentBlog.seoResult?.structure.h2.min} max={currentBlog.seoResult?.structure.h2.max} /></div>
                             <div className="bg-white dark:bg-slate-900"><AuditMetric label="Paragraphs" current={currentBlog.seoResult?.structure.paragraphs.current} min={currentBlog.seoResult?.structure.paragraphs.min} max={currentBlog.seoResult?.structure.paragraphs.max} /></div>
                             <div className="bg-white dark:bg-slate-900"><AuditMetric label="Images" current={currentBlog.seoResult?.structure.images.current} min={currentBlog.seoResult?.structure.images.min} max={currentBlog.seoResult?.structure.images.max} /></div>
                          </div>
                        </div>

                        <div className="py-10">
                          <div className="flex items-center gap-6 mb-8 overflow-x-auto custom-scrollbar pb-2 no-scrollbar">
                             <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-blue-600 border-b-2 border-blue-600 pb-2 flex-shrink-0">Keywords <span className="opacity-40 ml-2">{currentBlog.seoResult?.terms.length}</span></h4>
                             <h4 className="text-[11px] font-black uppercase tracking-[0.4em] opacity-40 pb-2 flex-shrink-0">Headings <span className="opacity-40 ml-2">3</span></h4>
                             <h4 className="text-[11px] font-black uppercase tracking-[0.4em] opacity-40 pb-2 flex-shrink-0">Meta Tags <span className="opacity-40 ml-2">3</span></h4>
                          </div>
                          <div className="flex flex-wrap gap-3">
                             {currentBlog.seoResult?.terms.map((metric, idx) => (
                               <KeywordTag key={idx} metric={metric} />
                             ))}
                          </div>
                        </div>
                      </div>

                      <div className="bg-blue-600/5 dark:bg-blue-600/10 border border-blue-600/20 p-10 rounded-[3rem] space-y-8">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/40"><MessageSquare className="w-7 h-7 text-white" /></div>
                          <div>
                            <h4 className="text-[12px] font-black uppercase tracking-widest">Architect Terminal</h4>
                            <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest">Micro-adjustment Core</p>
                          </div>
                        </div>
                        <div className="max-h-[380px] overflow-y-auto custom-scrollbar space-y-5 px-1">
                          {chatMessages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in`}>
                              <div className={`max-w-[88%] px-6 py-4.5 rounded-[1.5rem] text-[12px] font-bold leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-slate-900 text-white dark:bg-blue-600 shadow-blue-500/20' : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700'}`}>
                                {m.content}
                              </div>
                            </div>
                          ))}
                          {isChatting && <div className="flex gap-2 p-3"><div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" /><div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100" /></div>}
                          <div ref={chatEndRef} />
                        </div>
                        <div className="flex gap-3 bg-white dark:bg-slate-950 p-2 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 focus-within:border-blue-500 transition-all shadow-inner">
                           <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} placeholder="Inject more empathy into H3..." className="flex-1 bg-transparent px-5 py-4 text-xs font-black outline-none placeholder:opacity-20" />
                           <button onClick={handleSendMessage} disabled={!chatInput.trim() || isChatting} className="bg-blue-600 text-white w-14 h-14 rounded-xl flex items-center justify-center shadow-xl shadow-blue-600/30 transition-all active:scale-90"><Send className="w-6 h-6" /></button>
                        </div>
                      </div>
                  </div>
                </aside>
              </div>
            ) : (
              <div className="h-[950px] flex flex-col items-center justify-center border-4 border-dashed border-slate-200 dark:border-slate-800 rounded-[5rem] opacity-20">
                <Layout className="w-32 h-32 mb-8" />
                <p className="text-xl font-black uppercase tracking-[0.5em]">System Idle: Waiting for Blueprint</p>
              </div>
            )}
          </section>
        </div>
      </main>

      <footer className="p-10 text-center border-t border-slate-200 dark:border-slate-800">
        <p className="text-[10px] font-black uppercase tracking-[0.5em] opacity-30">© 2025 SuperPage Global Engine • Powered by Gemini Neural Architect</p>
      </footer>
    </div>
  );
};

export default App;
