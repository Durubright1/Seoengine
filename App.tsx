
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { BlogInputs, GeneratedBlog, SearchIntent, Country, SEOScoreResult, ChatMessage, KeywordMetric } from './types';
import { generateFullSuperPage, analyzeSEOContent, researchSecondaryKeywords } from './services/geminiService';
import { 
  Zap, Copy, Loader2, Moon, Sun,
  Check, Sparkles, MessageSquare, 
  Send, Layout, ChevronUp, ChevronDown, 
  Flame, Target, BrainCircuit, Zap as ZapIcon, Image as ImageIcon,
  Wand2, Clock, Shield
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
  "Bypassing Pattern Recognition...",
  "Injecting Human Imperfections...",
  "Calibrating Nano Banana Imagery...",
  "Neural Scouring for Intent...",
  "Radical Empathy Applied...",
  "Destroying GPT Footprints..."
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
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-slate-100 dark:text-slate-800" strokeLinecap="round" />
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

const KeywordTag = ({ metric }: { metric: KeywordMetric }) => {
  const isHard = metric.difficulty === 'hard';
  const isMedium = metric.difficulty === 'medium';
  const borderColor = isHard ? 'border-red-500/50' : isMedium ? 'border-amber-500/50' : 'border-emerald-500/50';
  const bgColor = isHard ? 'bg-red-500/5' : isMedium ? 'bg-amber-500/5' : 'bg-emerald-500/5';
  const textColor = isHard ? 'text-red-600 dark:text-red-400' : isMedium ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400';
  
  return (
    <div className={`px-4 py-2.5 rounded-full border ${borderColor} ${bgColor} flex flex-col transition-all hover:scale-105 cursor-default shadow-sm`}>
      <span className="text-[11px] font-black tracking-tight flex items-center gap-2">
        {metric.keyword}
        <span className={`text-[8px] font-black uppercase opacity-60 ${textColor}`}>{metric.difficulty}</span>
      </span>
      <span className="text-[9px] font-black opacity-40 uppercase tracking-tighter">
        {metric.count} / {metric.min}-{metric.max}
      </span>
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
  const [loading, setLoading] = useState(false);
  const [researching, setResearching] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [previewMode, setPreviewMode] = useState<'preview' | 'html'>('preview');
  const [copied, setCopied] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const isGlobal = inputs.country.includes('Global');

  useEffect(() => {
    const savedTheme = localStorage.getItem('superpage_theme') || 'dark';
    setTheme(savedTheme as any);
    if (savedTheme === 'dark') document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleResearchKeywords = async () => {
    if (!inputs.title.trim()) return;
    setResearching(true);
    try {
      const keywords = await researchSecondaryKeywords(inputs.title);
      setInputs(prev => ({ ...prev, secondaryKeywords: keywords }));
    } catch (err) { console.error(err); }
    finally { setResearching(false); }
  };

  const handleGenerate = async () => {
    if (!inputs.title.trim()) { setError("Focus keyword required."); return; }
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
      setChatMessages([{ role: 'assistant', content: "SuperPage Protocol Complete. SEO optimized and human-verified. Use the refiner to make surgical edits." }]);
    } catch (err: any) {
      setError(err.message || "Neural Synth Fault.");
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
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
        contents: [{ role: 'user', parts: [{ text: `Current HTML:\n${currentBlog.htmlContent}\n\nUser Request: ${userMsg}` }] }],
        config: { systemInstruction: "Update the provided HTML content based on the user request. Maintain all humanity protocols and image tags. Return ONLY HTML." }
      });
      const newHtml = response.text.trim().replace(/^```html\n?/i, '').replace(/\n?```$/i, '').trim();
      if (newHtml.includes('<h1')) {
        const updatedBlog = { ...currentBlog, htmlContent: newHtml };
        setCurrentBlog(updatedBlog);
        setChatMessages(prev => [...prev, { role: 'assistant', content: "Narrative fine-tuned. View updated render." }]);
      } else {
        setChatMessages(prev => [...prev, { role: 'assistant', content: response.text }]);
      }
    } catch (err: any) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: "Assistant offline." }]);
    } finally { setIsChatting(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020305] flex flex-col font-jakarta transition-colors duration-500 overflow-x-hidden">
      <header className="h-24 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#020305]/80 backdrop-blur-2xl sticky top-0 z-[100] px-10 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-2xl shadow-blue-600/30 ring-4 ring-blue-600/10"><BrainCircuit className="text-white w-7 h-7" /></div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter uppercase flex items-center gap-2">
              SuperPage <span className="text-blue-600 italic">Neural</span>
              <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] tracking-widest font-black border border-emerald-500/20 ml-2 uppercase">v12.0 SEO</span>
            </h1>
            <p className="text-[9px] font-black opacity-30 uppercase tracking-[0.5em] leading-none mt-1.5">Elite SEO Automation • Nano Banana Engine</p>
          </div>
        </div>
        <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="w-14 h-14 bg-white dark:bg-slate-800 rounded-[1.25rem] border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm">
          {theme === 'light' ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
        </button>
      </header>

      <main className="flex-1 max-w-[1850px] mx-auto w-full p-8 lg:p-12">
        <div className="grid lg:grid-cols-12 gap-12">
          {/* Permanent Sidebar: SuperPage Blueprint */}
          <aside className="lg:col-span-4 xl:col-span-3">
            <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl p-10 space-y-10">
              <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-600 flex items-center gap-3"><Target className="w-5 h-5" /> SuperPage Blueprint</h2>
              <div className="space-y-8">
                <div>
                  <label className="text-[10px] font-black uppercase opacity-40 mb-3 block tracking-widest">Primary Focus Keyword</label>
                  <input value={inputs.title} onChange={e => setInputs({...inputs, title: e.target.value})} placeholder="Main high-volume keyword..." className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 font-black outline-none focus:border-blue-500 transition-colors" />
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="text-[10px] font-black uppercase opacity-40 mb-3 block tracking-widest">Target Country</label>
                    <select value={inputs.country} onChange={e => setInputs({...inputs, country: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-2xl pl-5 pr-3 py-4 font-black text-xs appearance-none">
                      {COUNTRIES.map(c => <option key={c.name} value={c.name}>{getFlagEmoji(c.code)} {c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase opacity-40 mb-3 block tracking-widest">Target City</label>
                    <input value={isGlobal ? 'Worldwide' : inputs.city} disabled={isGlobal} onChange={e => setInputs({...inputs, city: e.target.value})} className={`w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 font-black text-xs outline-none focus:border-blue-500 transition-opacity ${isGlobal ? 'opacity-30 cursor-not-allowed' : ''}`} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-[10px] font-black uppercase opacity-40 block tracking-widest">LSI Secondary keywords</label>
                    <button onClick={handleResearchKeywords} disabled={researching} className="text-[9px] font-black text-blue-600 uppercase flex items-center gap-1.5 hover:opacity-70 transition-opacity">
                      {researching ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />} Auto-Research
                    </button>
                  </div>
                  <textarea value={inputs.secondaryKeywords} onChange={e => setInputs({...inputs, secondaryKeywords: e.target.value})} placeholder="Keywords for semantic coverage..." className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 font-black text-xs outline-none focus:border-blue-500 h-24 resize-none" />
                </div>

                <div>
                   <label className="text-[10px] font-black uppercase opacity-40 mb-3 block tracking-widest">Visual Asset Mode</label>
                   <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => setInputs({...inputs, imageSource: 'nanobanana'})} className={`py-4 rounded-2xl border-2 font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2 ${inputs.imageSource === 'nanobanana' ? 'border-blue-600 bg-blue-600/10 text-blue-600 shadow-lg' : 'border-slate-100 dark:border-slate-800 opacity-40 hover:opacity-100'}`}><ZapIcon className="w-4 h-4" /> Nano Banana</button>
                      <button onClick={() => setInputs({...inputs, imageSource: 'pexels'})} className={`py-4 rounded-2xl border-2 font-black text-[10px] uppercase transition-all flex items-center justify-center gap-2 ${inputs.imageSource === 'pexels' ? 'border-blue-600 bg-blue-600/10 text-blue-600 shadow-lg' : 'border-slate-100 dark:border-slate-800 opacity-40 hover:opacity-100'}`}><ImageIcon className="w-4 h-4" /> Pexels 8K</button>
                   </div>
                </div>
              </div>
              <button onClick={handleGenerate} disabled={loading} className="w-full mt-10 py-6 bg-blue-600 hover:bg-blue-700 text-white rounded-[2rem] font-black text-xs tracking-[0.3em] flex flex-col items-center transition-all disabled:opacity-50 shadow-2xl">
                {loading ? <><Loader2 className="animate-spin w-6 h-6 mb-2" /><span className="text-[9px] uppercase animate-pulse">{loadingStep}</span></> : <><Sparkles className="w-5 h-5 mr-2 mb-1" /> CONSTRUCT SUPERPAGE</>}
              </button>
            </div>
          </aside>

          {/* Result Section */}
          <section className="lg:col-span-8 xl:col-span-9">
            {currentBlog ? (
              <div className="grid xl:grid-cols-12 gap-12">
                <div className="xl:col-span-8 space-y-10">
                  <div className="bg-white dark:bg-[#0a0c10] rounded-[4rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden min-h-[950px] flex flex-col">
                    <div className="px-12 py-8 border-b border-slate-100 dark:border-slate-800 flex flex-wrap gap-6 justify-between items-center bg-slate-50/30 dark:bg-slate-900/40">
                       <div className="flex bg-white dark:bg-slate-950 rounded-[1.5rem] p-1.5 border border-slate-200 dark:border-slate-800 shadow-inner">
                          <button onClick={() => setPreviewMode('preview')} className={`px-10 py-4 rounded-[1.25rem] text-[11px] font-black uppercase transition-all ${previewMode === 'preview' ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>Visual Render</button>
                          <button onClick={() => setPreviewMode('html')} className={`px-10 py-4 rounded-[1.25rem] text-[11px] font-black uppercase transition-all ${previewMode === 'html' ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>Source Assets</button>
                       </div>
                       <button onClick={() => { navigator.clipboard.writeText(currentBlog.htmlContent); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="px-10 py-5 bg-slate-900 dark:bg-blue-600 text-white rounded-[1.25rem] text-[11px] font-black uppercase flex items-center gap-4 shadow-2xl hover:scale-105 transition-transform">
                          {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />} {copied ? 'COPIED' : 'EXTRACT ASSETS'}
                       </button>
                    </div>
                    <div className="p-12 lg:p-20 flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-[#0a0c10]">
                      {previewMode === 'preview' ? <article className="blogger-preview animate-in" dangerouslySetInnerHTML={{ __html: currentBlog.htmlContent }} /> : <pre className="text-[12px] font-mono bg-slate-950 text-emerald-400/80 p-12 rounded-[2.5rem] whitespace-pre-wrap leading-relaxed border border-slate-800 h-full selection:bg-emerald-500 selection:text-black">{currentBlog.htmlContent}</pre>}
                    </div>
                  </div>
                </div>

                <aside className="xl:col-span-4 space-y-10">
                  <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl p-8 sticky top-36 flex flex-col gap-10 h-[calc(100vh-200px)]">
                      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-12">
                        <div className="pt-4">
                          <h3 className="text-[11px] font-black uppercase tracking-[0.4em] opacity-40 mb-4 flex justify-center text-center">Neural SEO Integrity</h3>
                          <ScoreGauge score={currentBlog.seoResult?.score || 0} />
                        </div>
                        
                        <div className="py-8 border-y border-slate-100 dark:border-slate-800">
                          <h4 className="text-[11px] font-black uppercase opacity-40 mb-6 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-blue-600" /> Narrative Refiner</h4>
                          <div className="space-y-4 mb-6">
                             {chatMessages.length === 0 && <p className="text-[10px] font-black opacity-20 uppercase text-center py-6">Architect Ready for refinements.</p>}
                             {chatMessages.map((msg, i) => (
                               <div key={i} className={`p-4 rounded-2xl text-xs font-bold leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white ml-8 shadow-lg' : 'bg-slate-50 dark:bg-slate-800 mr-8 text-slate-600 dark:text-slate-300'}`}>{msg.content}</div>
                             ))}
                             <div ref={chatEndRef} />
                          </div>
                          <div className="relative group">
                            <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} placeholder="Ask to adjust sections..." className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-xs font-bold pr-12 outline-none focus:border-blue-500 transition-all shadow-inner" />
                            <button onClick={handleSendMessage} className="absolute right-3 top-3.5 p-2 text-blue-600 hover:scale-125 transition-transform"><Send className="w-4 h-4" /></button>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-[11px] font-black uppercase text-blue-600 mb-8 flex justify-between">LSI Density Status</h4>
                          <div className="flex flex-wrap gap-2.5">
                             {currentBlog.seoResult?.terms.map((metric, idx) => (
                               <KeywordTag key={idx} metric={metric} />
                             ))}
                          </div>
                        </div>
                      </div>
                  </div>
                </aside>
              </div>
            ) : (
              <div className="h-[950px] flex flex-col items-center justify-center border-4 border-dashed border-slate-200 dark:border-slate-800 rounded-[5rem] opacity-20 group hover:opacity-40 transition-opacity">
                <Layout className="w-32 h-32 mb-8 group-hover:scale-110 transition-transform text-blue-600" />
                <p className="text-xl font-black uppercase tracking-[0.5em]">Awaiting Blueprint Initialization</p>
                <p className="text-[10px] font-black uppercase tracking-widest mt-4">Deep Content Scouring • Cinematic Grounding</p>
              </div>
            )}
          </section>
        </div>
      </main>

      <footer className="p-10 text-center border-t border-slate-200 dark:border-slate-800">
        <p className="text-[10px] font-black uppercase tracking-[0.5em] opacity-30">© 2025 Neural Architect • Single-Session SEO Environment</p>
      </footer>
    </div>
  );
};

export default App;
