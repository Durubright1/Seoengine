
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { BlogInputs, GeneratedBlog, SearchIntent, Country, SEOScoreResult, ChatMessage } from './types';
import { generateFullSuperPage, analyzeSEOContent } from './services/geminiService';
import { 
  Zap, Copy, Loader2, Moon, Sun,
  Check, Sparkles, MessageSquare, 
  Send, Smartphone, BarChart3, Layout, ChevronUp, ChevronDown, 
  Flame, MapPin, Link as LinkIcon, Globe, ExternalLink, Key, AlertCircle, Info,
  Download, History, Trash2, Plus, Target, Search, Database, Fingerprint, TrendingUp,
  BrainCircuit, ShieldCheck, Heart
} from 'lucide-react';

const COUNTRIES: Country[] = [
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
  { name: "Italy", code: "IT", capital: "Rome", cities: ["Rome", "Milan", "Naples", "Turin", "Florence", "Venice"] },
  { name: "Spain", code: "ES", capital: "Madrid", cities: ["Madrid", "Barcelona", "Valencia", "Seville", "Bilbao"] },
  { name: "Singapore", code: "SG", capital: "Singapore", cities: ["Singapore"] },
  { name: "UAE", code: "AE", capital: "Abu Dhabi", cities: ["Dubai", "Abu Dhabi", "Sharjah"] },
  { name: "South Africa", code: "ZA", capital: "Pretoria", cities: ["Johannesburg", "Cape Town", "Durban"] },
  { name: "Nigeria", code: "NG", capital: "Abuja", cities: ["Lagos", "Abuja", "Port Harcourt"] },
  { name: "Netherlands", code: "NL", capital: "Amsterdam", cities: ["Amsterdam", "Rotterdam", "Utrecht"] },
  { name: "Sweden", code: "SE", capital: "Stockholm", cities: ["Stockholm", "Gothenburg", "Malmö"] },
  { name: "Switzerland", code: "CH", capital: "Bern", cities: ["Zurich", "Geneva", "Basel"] },
  { name: "Norway", code: "NO", capital: "Oslo", cities: ["Oslo", "Bergen", "Trondheim"] },
  { name: "Denmark", code: "DK", capital: "Copenhagen", cities: ["Copenhagen", "Aarhus", "Odense"] },
  { name: "Finland", code: "FI", capital: "Helsinki", cities: ["Helsinki", "Espoo", "Tampere"] },
  { name: "Ireland", code: "IE", capital: "Dublin", cities: ["Dublin", "Cork", "Limerick"] },
  { name: "New Zealand", code: "NZ", capital: "Wellington", cities: ["Auckland", "Wellington", "Christchurch"] },
  { name: "Portugal", code: "PT", capital: "Lisbon", cities: ["Lisbon", "Porto"] },
  { name: "Greece", code: "GR", capital: "Athens", cities: ["Athens", "Thessaloniki"] },
  { name: "Turkey", code: "TR", capital: "Ankara", cities: ["Istanbul", "Ankara", "Izmir"] },
  { name: "South Korea", code: "KR", capital: "Seoul", cities: ["Seoul", "Busan", "Incheon"] },
  { name: "Thailand", code: "TH", capital: "Bangkok", cities: ["Bangkok", "Phuket", "Chiang Mai"] },
  { name: "Vietnam", code: "VN", capital: "Hanoi", cities: ["Ho Chi Minh City", "Hanoi"] },
  { name: "Malaysia", code: "MY", capital: "Kuala Lumpur", cities: ["Kuala Lumpur", "Penang"] },
  { name: "Indonesia", code: "ID", capital: "Jakarta", cities: ["Jakarta", "Bali", "Surabaya"] },
  { name: "Philippines", code: "PH", capital: "Manila", cities: ["Manila", "Cebu City"] },
  { name: "Saudi Arabia", code: "SA", capital: "Riyadh", cities: ["Riyadh", "Jeddah"] },
  { name: "Israel", code: "IL", capital: "Jerusalem", cities: ["Tel Aviv", "Jerusalem"] },
  { name: "Argentina", code: "AR", capital: "Buenos Aires", cities: ["Buenos Aires", "Córdoba"] },
  { name: "Chile", code: "CL", capital: "Santiago", cities: ["Santiago", "Valparaíso"] },
  { name: "Colombia", code: "CO", capital: "Bogotá", cities: ["Bogotá", "Medellín"] },
  { name: "Egypt", code: "EG", capital: "Cairo", cities: ["Cairo", "Alexandria"] },
  { name: "Morocco", code: "MA", capital: "Rabat", cities: ["Casablanca", "Marrakech"] },
  { name: "Pakistan", code: "PK", capital: "Islamabad", cities: ["Karachi", "Lahore"] },
  { name: "Poland", code: "PL", capital: "Warsaw", cities: ["Warsaw", "Kraków"] },
  { name: "Belgium", code: "BE", capital: "Brussels", cities: ["Brussels", "Antwerp"] },
  { name: "Austria", code: "AT", capital: "Vienna", cities: ["Vienna", "Salzburg"] },
  { name: "Hungary", code: "HU", capital: "Budapest", cities: ["Budapest"] },
  { name: "Czech Republic", code: "CZ", capital: "Prague", cities: ["Prague"] },
  { name: "Romania", code: "RO", capital: "Bucharest", cities: ["Bucharest"] },
  { name: "Ukraine", code: "UA", capital: "Kyiv", cities: ["Kyiv", "Lviv"] },
  { name: "Kenya", code: "KE", capital: "Nairobi", cities: ["Nairobi"] },
  { name: "Ethiopia", code: "ET", capital: "Addis Ababa", cities: ["Addis Ababa"] },
  { name: "Ghana", code: "GH", capital: "Accra", cities: ["Accra"] },
].sort((a, b) => a.name.localeCompare(b.name));

const getFlagEmoji = (countryCode: string) => {
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

const App: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [inputs, setInputs] = useState<BlogInputs>({
    title: '', secondaryKeywords: '', country: 'United States', city: 'Washington, D.C.',
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

  useEffect(() => {
    const savedTheme = localStorage.getItem('superpage_theme') || 'dark';
    setTheme(savedTheme as any);
    if (savedTheme === 'dark') document.documentElement.classList.add('dark');
    const savedHistory = localStorage.getItem('superpage_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
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

  // Fixed: handleDownload implementation
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

  // Fixed: handleSendMessage implementation using Gemini
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
        contents: [
          { role: 'user', parts: [{ text: `Original Content:\n${currentBlog.htmlContent.substring(0, 5000)}\n\nUser Question: ${userMsg}` }] }
        ],
        config: {
          systemInstruction: "You are a World-Class Content Architect. Help the user improve or refine their SuperPage content. Provide professional, concise, and actionable advice or code snippets."
        }
      });

      const assistantMsg = response.text || "I apologize, but the neural terminal could not generate a response. Please try again.";
      setChatMessages(prev => [...prev, { role: 'assistant', content: assistantMsg }]);
    } catch (err: any) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: `Terminal error: ${err.message || "Unknown error"}` }]);
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
        <div className={`fixed inset-y-0 right-0 w-80 bg-white dark:bg-slate-900 shadow-2xl z-[150] transform transition-transform duration-500 ease-expo border-l border-slate-200 dark:border-slate-800 pt-32 px-8 ${showHistory ? 'translate-x-0' : 'translate-x-full'}`}>
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
                      {COUNTRIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase opacity-40 mb-3 block tracking-widest">Local Intent</label>
                    <input list="city-list" value={inputs.city} onChange={e => setInputs({...inputs, city: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 font-black text-xs focus:border-blue-500 outline-none" />
                    <datalist id="city-list">{selectedCountry.cities.map(city => <option key={city} value={city} />)}</datalist>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase opacity-40 mb-3 block tracking-widest">LSI / Secondary Terms</label>
                  <textarea value={inputs.secondaryKeywords} onChange={e => setInputs({...inputs, secondaryKeywords: e.target.value})} placeholder="Solar ROI, sustainable travel cost, etc..." className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 font-black text-xs outline-none focus:border-blue-500 h-24 resize-none" />
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
                        <h3 className="text-[11px] font-black uppercase tracking-[0.4em] opacity-40 mb-8 flex items-center gap-3"><BrainCircuit className="w-5 h-5 text-blue-500" /> Neural Sentiment Monitor</h3>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="bg-slate-50 dark:bg-slate-950 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 group hover:border-blue-500 transition-colors">
                             <div className="flex justify-between items-start mb-4">
                               <TrendingUp className="w-6 h-6 text-blue-500" />
                               <span className="text-[11px] font-black text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full">{currentBlog.seoResult?.viralPotential}%</span>
                             </div>
                             <div className="text-3xl font-black mb-1">{currentBlog.seoResult?.score}</div>
                             <div className="text-[9px] font-black opacity-30 uppercase tracking-widest">Authority Score</div>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-950 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 group hover:border-emerald-500 transition-colors">
                             <div className="flex justify-between items-start mb-4">
                               <ShieldCheck className="w-6 h-6 text-emerald-500" />
                               <span className="text-[11px] font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full">{currentBlog.seoResult?.humanityScore}%</span>
                             </div>
                             <div className="text-3xl font-black mb-1">{currentBlog.seoResult?.empathyLevel}%</div>
                             <div className="text-[9px] font-black opacity-30 uppercase tracking-widest">Neural Empathy</div>
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
                        <div className="flex gap-3 bg-white dark:bg-slate-950 p-2 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 focus-within:border-blue-500 focus-within:ring-4 ring-blue-500/10 transition-all shadow-inner">
                           <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} placeholder="Inject more empathy into H3..." className="flex-1 bg-transparent px-5 py-4 text-xs font-black outline-none placeholder:opacity-20" />
                           <button onClick={handleSendMessage} disabled={!chatInput.trim() || isChatting} className="bg-blue-600 text-white w-14 h-14 rounded-xl flex items-center justify-center hover:bg-blue-700 active:scale-90 transition-all shadow-xl shadow-blue-600/30"><Send className="w-6 h-6" /></button>
                        </div>
                      </div>

                      <div className="space-y-5">
                        <h