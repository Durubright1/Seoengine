
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { BlogInputs, GeneratedBlog, SearchIntent, Country, SEOScoreResult, ChatMessage, KeywordMetric } from './types';
import { generateFullSuperPage, analyzeSEOContent, researchSecondaryKeywords } from './services/geminiService';
import { 
  Zap, Copy, Loader2, Moon, Sun,
  Check, Sparkles, MessageSquare, 
  Send, Flame, Target, BrainCircuit, 
  Wand2, AlertTriangle, ExternalLink,
  BarChart3, UserCheck, Activity, Layers
} from 'lucide-react';

const COUNTRIES: Country[] = [
  { name: "Global (Universal Authority)", code: "GL", capital: "Worldwide", cities: ["N/A"] },
  { name: "United States", code: "US", capital: "D.C.", cities: ["NY", "LA", "Chicago"] },
  { name: "United Kingdom", code: "GB", capital: "London", cities: ["London", "Manchester"] },
  { name: "Canada", code: "CA", capital: "Ottawa", cities: ["Toronto", "Vancouver"] },
  { name: "Australia", code: "AU", capital: "Canberra", cities: ["Sydney", "Melbourne"] },
].sort((a, b) => (a.code === 'GL' ? -1 : 1));

const getFlagEmoji = (countryCode: string) => countryCode === 'GL' ? '🌐' : countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt(0)).map(cp => String.fromCodePoint(cp)).join('');

const LOADING_MESSAGES = [
  "Applying Humanity Protocols...",
  "Bypassing AI Detectors...",
  "Synthesizing Narrative Depth...",
  "Grounding 2024-2025 Data...",
  "Sourcing HD Stock Assets...",
  "Final SEO Integrity Audit..."
];

const KeywordDifficultyBar = ({ term }: { term: KeywordMetric }) => {
  const diffColor = term.difficulty > 70 ? 'bg-red-500' : term.difficulty > 40 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className="flex flex-col gap-1.5 p-3.5 bg-slate-50/80 dark:bg-slate-900/80 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all hover:border-blue-500/30 group">
      <div className="flex justify-between items-center px-0.5">
        <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 truncate pr-2">{term.keyword}</span>
        <span className="text-[9px] font-bold opacity-50 tracking-tighter shrink-0">Vol: {(term.volume/1000).toFixed(1)}k</span>
      </div>
      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${diffColor} transition-all duration-1000 group-hover:opacity-80`} style={{ width: `${term.difficulty}%` }} />
      </div>
      <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-tight opacity-40">
        <span>KD: {term.difficulty}</span>
        <span>Count: {term.count}</span>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [inputs, setInputs] = useState<BlogInputs>({
    title: '', secondaryKeywords: '', country: 'Global (Universal Authority)', city: 'Worldwide',
    intent: SearchIntent.Informational, niche: 'Marketing',
    language: 'English', tone: 'Expert & Empathetic', audience: 'Professionals', 
    imageSource: 'unsplash', imageUrl: '', promotionLink: '', customInstructions: ''
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
  const [isCopying, setIsCopying] = useState(false);
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
    } catch (err) { setError("Research Fail."); }
    finally { setResearching(false); }
  };

  const handleGenerate = async () => {
    if (!inputs.title.trim()) return;
    setLoading(true); setError(null);
    let msgIdx = 0;
    const interval = setInterval(() => setLoadingStep(LOADING_MESSAGES[msgIdx++ % LOADING_MESSAGES.length]), 4500);
    try {
      const result = await generateFullSuperPage(inputs, (step) => setLoadingStep(step));
      const seo = await analyzeSEOContent(inputs.title, result.html);
      setCurrentBlog({
        id: crypto.randomUUID(), timestamp: Date.now(), title: inputs.title,
        htmlContent: result.html, previewImageUrl: result.previewImageUrl,
        inputs: { ...inputs }, sources: result.sources, seoResult: seo
      });
      setChatMessages([{ role: 'assistant', content: "Humanity protocol verified. Think Tank narrative deployed." }]);
    } catch (err: any) { setError(err.message || "Synthesis Fail."); }
    finally { clearInterval(interval); setLoading(false); }
  };

  const handleCopy = () => {
    if (!currentBlog) return;
    navigator.clipboard.writeText(currentBlog.htmlContent);
    setIsCopying(true);
    setTimeout(() => setIsCopying(false), 2000);
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
        contents: [{ role: 'user', parts: [{ text: `Request: ${userMsg}\nContext Sample: ${currentBlog.htmlContent.substring(0, 3000)}` }] }],
        config: { systemInstruction: "Update the HTML snippet provided based on user edits. Keep the elite humanity tone." }
      });
      const newHtml = response.text.trim().replace(/^```html\n?/i, '').replace(/\n?```$/i, '').trim();
      if (newHtml.length > 200) setCurrentBlog({ ...currentBlog, htmlContent: newHtml });
    } catch (err) { setError("Refinement Context Full."); }
    finally { setIsChatting(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020305] flex flex-col font-jakarta transition-colors duration-500 overflow-x-hidden selection:bg-blue-500 selection:text-white">
      <header className="h-24 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-[#020305]/70 backdrop-blur-3xl sticky top-0 z-[100] px-10 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-2xl shadow-blue-600/30 ring-4 ring-blue-600/10"><BrainCircuit className="text-white w-7 h-7" /></div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter uppercase flex items-center gap-2">
              SuperPage <span className="text-blue-600 italic">Pro</span>
              <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[9px] tracking-widest font-black border border-blue-500/20 ml-2 uppercase">v17.0 ELITE</span>
            </h1>
            <p className="text-[9px] font-black opacity-30 uppercase tracking-[0.5em] leading-none mt-1.5">3,000-Word Narrative Engine • Neural Sourcing</p>
          </div>
        </div>
        <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="w-14 h-14 bg-white dark:bg-slate-900 rounded-[1.25rem] border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm hover:rotate-12 transition-transform">
          {theme === 'light' ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
        </button>
      </header>

      <main className="flex-1 max-w-[1900px] mx-auto w-full p-8 lg:p-12">
        <div className="grid lg:grid-cols-12 gap-10">
          {/* Column 1: Blueprint Sidebar */}
          <aside className="lg:col-span-4 xl:col-span-3 space-y-8">
            <div className="bg-white dark:bg-slate-950 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl p-10 space-y-8 sticky top-36">
              <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-600 flex items-center gap-3"><Target className="w-5 h-5" /> Blueprint</h2>
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase opacity-40 mb-3 block tracking-widest">Focus Keyword</label>
                  <input value={inputs.title} onChange={e => setInputs({...inputs, title: e.target.value})} placeholder="Main keyword..." className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 font-black outline-none focus:border-blue-500 transition-all text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase opacity-40 mb-3 block tracking-widest">Target Region</label>
                    <select value={inputs.country} onChange={e => setInputs({...inputs, country: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-4 font-black text-xs appearance-none">
                      {COUNTRIES.map(c => <option key={c.name} value={c.name}>{getFlagEmoji(c.code)} {c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase opacity-40 mb-3 block tracking-widest">City</label>
                    <input value={isGlobal ? 'Global' : inputs.city} disabled={isGlobal} onChange={e => setInputs({...inputs, city: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-4 font-black text-xs outline-none focus:border-blue-500" />
                  </div>
                </div>
                <div>
                   <div className="flex justify-between items-center mb-3">
                    <label className="text-[10px] font-black uppercase opacity-40 block tracking-widest">LSI Semantic Core</label>
                    <button onClick={handleResearchKeywords} disabled={researching} className="text-[9px] font-black text-blue-600 hover:opacity-70 transition-opacity uppercase flex items-center gap-1">
                      {researching ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />} Auto-Find
                    </button>
                  </div>
                  <textarea value={inputs.secondaryKeywords} onChange={e => setInputs({...inputs, secondaryKeywords: e.target.value})} placeholder="LSI Keywords..." className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 font-black text-xs h-32 resize-none outline-none focus:border-blue-500" />
                </div>
                <div>
                   <label className="text-[10px] font-black uppercase opacity-40 mb-3 block tracking-widest">Affiliate/Promotion Link</label>
                   <input value={inputs.promotionLink} onChange={e => setInputs({...inputs, promotionLink: e.target.value})} placeholder="https://..." className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 font-black text-xs outline-none focus:border-blue-500 shadow-sm" />
                </div>
              </div>
              <button onClick={handleGenerate} disabled={loading} className="w-full py-6 bg-blue-600 hover:bg-blue-700 text-white rounded-[2rem] font-black text-xs tracking-[0.3em] flex flex-col items-center transition-all disabled:opacity-50 shadow-2xl">
                {loading ? <><Loader2 className="animate-spin w-6 h-6 mb-2" /><span className="text-[9px] uppercase animate-pulse">{loadingStep}</span></> : <><Sparkles className="w-5 h-5 mr-2 mb-1" /> SYNC SUPERPAGE</>}
              </button>
            </div>
          </aside>

          {/* Column 2: Content Workspace */}
          <section className="lg:col-span-8 xl:col-span-6">
            {currentBlog ? (
              <div className="bg-white dark:bg-slate-950 rounded-[4rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden min-h-[1000px] flex flex-col relative group">
                {isCopying && (
                  <div className="absolute inset-0 z-[50] flex items-center justify-center pointer-events-none">
                    <div className="absolute inset-0 bg-blue-600/10 animate-pulse" />
                    <div className="w-full h-1.5 bg-blue-500 absolute top-0 animate-neural-scan shadow-[0_0_40px_rgba(59,130,246,0.8)]" />
                    <div className="bg-white dark:bg-slate-900 px-10 py-5 rounded-[2rem] shadow-2xl border border-blue-500/50 flex items-center gap-4 animate-bounce">
                       <Check className="text-emerald-500 w-6 h-6" />
                       <span className="text-xs font-black uppercase tracking-widest">Neural Assets Extracted</span>
                    </div>
                  </div>
                )}
                <div className="px-10 py-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 sticky top-0 z-[60] backdrop-blur-xl">
                   <div className="flex bg-white dark:bg-slate-900 rounded-2xl p-1.5 border border-slate-200 dark:border-slate-800 shadow-inner">
                      <button onClick={() => setPreviewMode('preview')} className={`px-8 py-3.5 rounded-xl text-[10px] font-black uppercase transition-all ${previewMode === 'preview' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'}`}>Visual Render</button>
                      <button onClick={() => setPreviewMode('html')} className={`px-8 py-3.5 rounded-xl text-[10px] font-black uppercase transition-all ${previewMode === 'html' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'}`}>Source Code</button>
                   </div>
                   <button onClick={handleCopy} className={`px-10 py-5 rounded-2xl text-[10px] font-black uppercase flex items-center gap-4 transition-all hover:scale-105 ${isCopying ? 'bg-emerald-500 shadow-emerald-500/30' : 'bg-slate-900 dark:bg-blue-600 shadow-blue-600/30'} text-white shadow-2xl`}>
                      {isCopying ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />} {isCopying ? 'COPIED' : 'EXTRACT PAYLOAD'}
                   </button>
                </div>
                <div className={`p-10 lg:p-16 flex-1 transition-opacity duration-300 ${isCopying ? 'opacity-30 blur-sm' : 'opacity-100'}`}>
                  {previewMode === 'preview' ? <article className="blogger-preview animate-in" dangerouslySetInnerHTML={{ __html: currentBlog.htmlContent }} /> : <pre className="text-[11px] font-mono bg-slate-950 text-emerald-400/80 p-12 rounded-[2.5rem] whitespace-pre-wrap leading-relaxed border border-slate-800 h-full overflow-y-auto">{currentBlog.htmlContent}</pre>}
                </div>
              </div>
            ) : (
              <div className="h-[1000px] flex flex-col items-center justify-center border-4 border-dashed border-slate-200 dark:border-slate-900 rounded-[5rem] opacity-30 group hover:opacity-50 transition-all">
                <BrainCircuit className="w-32 h-32 mb-8 group-hover:scale-110 group-hover:rotate-12 transition-transform text-blue-600" />
                <p className="text-xl font-black uppercase tracking-[0.5em]">Neural Think Tank v17.0</p>
                <p className="text-[10px] font-black uppercase tracking-widest mt-4">Pro Engine Ready for Deployment</p>
              </div>
            )}
          </section>

          {/* Column 3: Think Tank Audit */}
          <aside className="lg:col-span-12 xl:col-span-3 space-y-10">
            {currentBlog && (
              <div className="bg-white dark:bg-slate-950 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl p-8 sticky top-36 h-[calc(100vh-200px)] flex flex-col gap-10">
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-12">
                  <div className="pt-2 text-center">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 mb-6">Semantic Integrity Score</h3>
                    <div className="relative inline-flex items-center justify-center">
                       <svg className="w-32 h-32 transform -rotate-90">
                          <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-100 dark:text-slate-900" />
                          <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="10" fill="transparent" strokeDasharray={364} strokeDashoffset={364 - (364 * (currentBlog.seoResult?.score || 0) / 100)} className="text-blue-600 transition-all duration-1000" strokeLinecap="round" />
                       </svg>
                       <span className="absolute text-2xl font-black">{currentBlog.seoResult?.score}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col gap-1 items-center">
                      <UserCheck className="w-4 h-4 text-emerald-500 mb-1" />
                      <span className="text-[8px] font-black uppercase opacity-40">Humanity</span>
                      <span className="text-xs font-black">{currentBlog.seoResult?.humanityScore}%</span>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col gap-1 items-center">
                      <Activity className="w-4 h-4 text-blue-500 mb-1" />
                      <span className="text-[8px] font-black uppercase opacity-40">Burstiness</span>
                      <span className="text-xs font-black">{currentBlog.seoResult?.burstinessIndex}/100</span>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-[11px] font-black uppercase text-blue-600 flex items-center gap-2 px-1"><BarChart3 className="w-4 h-4" /> Realistic Keyword KD</h4>
                    <div className="space-y-4">
                      {currentBlog.seoResult?.terms.map((term, i) => (
                        <KeywordDifficultyBar key={i} term={term} />
                      ))}
                    </div>
                  </div>

                  <div className="py-8 border-y border-slate-100 dark:border-slate-800 space-y-6">
                    <h4 className="text-[11px] font-black uppercase opacity-40 flex items-center gap-2 px-1"><MessageSquare className="w-4 h-4 text-blue-600" /> Narrative Refiner</h4>
                    <div className="space-y-4 mb-6">
                       {chatMessages.map((msg, i) => (
                         <div key={i} className={`p-4 rounded-2xl text-xs font-bold leading-relaxed animate-in ${msg.role === 'user' ? 'bg-blue-600 text-white ml-8 shadow-lg' : 'bg-slate-100 dark:bg-slate-900 mr-8 text-slate-700 dark:text-slate-300'}`}>{msg.content}</div>
                       ))}
                       <div ref={chatEndRef} />
                    </div>
                    <div className="relative group">
                      <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} placeholder="Tweak narrative..." className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-xs font-bold pr-12 outline-none focus:border-blue-500 transition-all" />
                      <button onClick={handleSendMessage} className="absolute right-3 top-3.5 p-2 text-blue-600 hover:scale-125 transition-transform"><Send className="w-4 h-4" /></button>
                    </div>
                  </div>

                  <div className="space-y-6 pb-4">
                    <h4 className="text-[11px] font-black uppercase text-blue-600 px-1">Evidence Grounding</h4>
                    <div className="space-y-3">
                      {currentBlog.sources.map((src, i) => (
                        <a key={i} href={src.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-blue-500 transition-colors group text-xs font-black truncate">
                          <ExternalLink className="w-4 h-4 opacity-40 group-hover:text-blue-500 shrink-0" />
                          {src.title}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>

      <footer className="p-10 text-center border-t border-slate-200 dark:border-slate-800">
        <p className="text-[10px] font-black uppercase tracking-[0.5em] opacity-30">© 2025 Neural Architect • High-Fidelity 3,000-Word SEO Automation</p>
      </footer>
    </div>
  );
};

export default App;
