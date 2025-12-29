import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { BlogInputs, GeneratedBlog, SearchIntent, Country, SEOScoreResult, ChatMessage, KeywordMetric, GroundingSource } from './types';
import { generateFullSuperPage, analyzeSEOContent } from './services/geminiService';
import { 
  Zap, Copy, Loader2, Moon, Sun,
  Check, Sparkles, MessageSquare, 
  Send, Smartphone, BarChart3, Layout, ChevronUp, ChevronDown, 
  Target, Flame, HelpCircle, MapPin, Link as LinkIcon, Globe, ExternalLink
} from 'lucide-react';

const COUNTRIES: Country[] = [
  { name: "United States", code: "US", capital: "Washington, D.C.", cities: ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose", "Austin"] },
  { name: "United Kingdom", code: "GB", capital: "London", cities: ["London", "Birmingham", "Manchester", "Glasgow", "Liverpool", "Leeds", "Sheffield", "Edinburgh", "Bristol", "Leicester"] },
  { name: "Canada", code: "CA", capital: "Ottawa", cities: ["Toronto", "Montreal", "Vancouver", "Calgary", "Edmonton", "Ottawa", "Winnipeg", "Quebec City", "Hamilton"] },
  { name: "Australia", code: "AU", capital: "Canberra", cities: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Gold Coast", "Canberra", "Hobart"] },
  { name: "Germany", code: "DE", capital: "Berlin", cities: ["Berlin", "Hamburg", "Munich", "Cologne", "Frankfurt", "Stuttgart", "Düsseldorf", "Dortmund", "Essen"] },
  { name: "France", code: "FR", capital: "Paris", cities: ["Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Strasbourg", "Montpellier", "Bordeaux"] },
  { name: "India", code: "IN", capital: "New Delhi", cities: ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Ahmedabad", "Chennai", "Kolkata", "Surat", "Pune", "Jaipur"] },
  { name: "Japan", code: "JP", capital: "Tokyo", cities: ["Tokyo", "Yokohama", "Osaka", "Nagoya", "Sapporo", "Fukuoka", "Kobe", "Kyoto", "Saitama"] },
  { name: "Singapore", code: "SG", capital: "Singapore", cities: ["Singapore"] },
  { name: "United Arab Emirates", code: "AE", capital: "Abu Dhabi", cities: ["Dubai", "Abu Dhabi", "Sharjah", "Al Ain", "Ajman"] },
].sort((a, b) => a.name.localeCompare(b.name));

const getFlagEmoji = (countryCode: string) => {
  const codePoints = countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

const LOADING_MESSAGES = [
  "Performing Deep Internet Research...",
  "Analyzing Competitor Content Gaps...",
  "Identifying Trending Viral Hooks...",
  "Synthesizing Humanized Perspectives...",
  "Architecting High-Conversion HTML...",
  "Injecting Local SEO Metadata...",
  "Integrating Monetization Anchors..."
];

const StructuralMetric: React.FC<{ label: string; current: number | undefined; range: { min: number; max: number } | undefined }> = ({ label, current, range }) => {
  if (!range) return null;
  const curr = current ?? 0;
  const isUnder = curr < range.min;
  const isOver = curr > range.max;
  return (
    <div className="flex flex-col items-center py-5 border-r last:border-r-0 border-slate-100 dark:border-slate-800">
      <span className="text-[10px] font-black opacity-30 uppercase tracking-widest mb-1">{label}</span>
      <div className="flex items-center gap-1">
        <span className="text-xl font-black">{curr}</span>
        {isUnder && <ChevronDown className="w-3 h-3 text-red-500" />}
        {isOver && <ChevronUp className="w-3 h-3 text-red-500" />}
      </div>
      <span className="text-[9px] opacity-40 font-bold">{range.min} - {range.max}</span>
    </div>
  );
};

const KeywordPill: React.FC<{ term: KeywordMetric }> = ({ term }) => {
  const diffColor: Record<string, string> = {
    easy: 'border-emerald-500 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20',
    medium: 'border-amber-500 text-amber-600 bg-amber-50/50 dark:bg-amber-950/20',
    hard: 'border-red-500 text-red-600 bg-red-50/50 dark:bg-red-950/20'
  };
  return (
    <div className={`px-3 py-1.5 rounded-lg border-2 ${diffColor[term.difficulty] || diffColor.medium} flex items-center gap-2 transition-all hover:scale-105 shadow-sm`}>
      <span className="text-[11px] font-bold">{term.keyword}</span>
      <span className="text-[10px] font-black opacity-40 tabular-nums">{term.count}/{term.min}-{term.max}</span>
    </div>
  );
};

const App: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [inputs, setInputs] = useState<BlogInputs>({
    title: '', secondaryKeywords: '', country: 'United States', city: 'Washington, D.C.',
    intent: SearchIntent.Informational, niche: 'Marketing',
    language: 'English', tone: 'Humanized & Viral', audience: 'General', 
    imageSource: 'nanobanana', imageUrl: '', promotionLink: '', customInstructions: ''
  });
  const [currentBlog, setCurrentBlog] = useState<GeneratedBlog | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [previewMode, setPreviewMode] = useState<'preview' | 'html'>('preview');
  const [copied, setCopied] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const selectedCountry = COUNTRIES.find(c => c.name === inputs.country) || COUNTRIES[0];

  useEffect(() => {
    const savedTheme = localStorage.getItem('superpage_theme') || 'dark';
    setTheme(savedTheme as any);
    if (savedTheme === 'dark') document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('superpage_theme', next);
    document.documentElement.classList.toggle('dark');
  };

  const handleGenerate = async () => {
    if (!inputs.title.trim()) { setError("Focus keyword required."); return; }
    setLoading(true); setError(null);
    let msgIdx = 0;
    const interval = setInterval(() => setLoadingStep(LOADING_MESSAGES[msgIdx++ % LOADING_MESSAGES.length]), 4500);
    try {
      const result = await generateFullSuperPage(inputs, setLoadingStep);
      const seo = await analyzeSEOContent(inputs.title, inputs.secondaryKeywords, inputs.country, inputs.city, result.html);
      const newBlog: GeneratedBlog = {
        id: crypto.randomUUID(), timestamp: Date.now(), title: inputs.title,
        htmlContent: result.html, previewImageUrl: result.previewImageUrl,
        inputs: { ...inputs }, sources: result.sources, seoResult: seo
      };
      setCurrentBlog(newBlog);
      setChatMessages([{ role: 'assistant', content: `SuperPage Live! 🚀 Research analyzed ${result.sources.length} live sources. SEO Score: ${seo.score}/100. Affiliate hooks ready.` }]);
    } catch (err: any) { setError(err.message); }
    finally { clearInterval(interval); setLoading(false); }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !currentBlog) return;
    const content = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', content }]);
    setChatInput('');
    setIsChatting(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const chat = ai.chats.create({ 
        model: 'gemini-3-flash-preview', 
        config: { systemInstruction: `You are an SEO Strategist. Help optimize "${currentBlog.title}". Your goal is maximum humanization and conversion.` } 
      });
      const response = await chat.sendMessage({ message: content });
      setChatMessages(prev => [...prev, { role: 'assistant', content: response.text || 'Thinking complete.' }]);
    } catch { 
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Connection lost. Try again.' }]); 
    } finally { setIsChatting(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#050608] flex flex-col font-jakarta transition-colors duration-500">
      <header className="h-20 lg:h-24 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#050608]/80 backdrop-blur-2xl sticky top-0 z-[100] px-8 lg:px-12 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-2.5 rounded-2xl shadow-xl shadow-blue-600/20"><Zap className="text-white w-6 h-6 fill-current" /></div>
          <div>
            <h1 className="text-xl font-black tracking-tighter uppercase">SuperPage <span className="text-blue-600 italic">Viral</span></h1>
            <p className="text-[8px] font-black opacity-30 uppercase tracking-[0.4em] leading-none mt-1">AI Research Engine v5</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <button onClick={toggleTheme} className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm transition-all hover:scale-105 active:scale-95">
             {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
           </button>
        </div>
      </header>

      <main className="flex-1 max-w-[1750px] mx-auto w-full p-6 lg:p-10">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-10">
          <aside className="lg:col-span-4 xl:col-span-3 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl p-8 sticky top-32">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-8 flex items-center gap-2"><Layout className="w-4 h-4" /> Blueprint</h2>
              <div className="space-y-6">
                <div>
                  <label className="text-[9px] font-black uppercase opacity-40 mb-2 block tracking-widest">Main Target Keyword</label>
                  <input value={inputs.title} onChange={e => setInputs({...inputs, title: e.target.value})} placeholder="e.g. Best SEO Tools for 2025" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 font-bold outline-none focus:border-blue-500 transition-colors" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black uppercase opacity-40 mb-2 block tracking-widest">Local SEO Target</label>
                    <div className="relative">
                      <select 
                        value={inputs.country} 
                        onChange={e => { 
                          const c = COUNTRIES.find(x => x.name === e.target.value); 
                          if(c) setInputs({...inputs, country: c.name, city: c.capital}); 
                        }} 
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-3 py-3 font-bold text-xs appearance-none focus:border-blue-500"
                      >
                        {COUNTRIES.map(c => (
                          <option key={c.name} value={c.name}>
                            {getFlagEmoji(c.code)} {c.name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">{getFlagEmoji(selectedCountry.code)}</div>
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase opacity-40 mb-2 block tracking-widest">City Focus</label>
                    <input list="city-list" value={inputs.city} onChange={e => setInputs({...inputs, city: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 font-bold text-xs" />
                    <datalist id="city-list">
                      {selectedCountry.cities.map(city => <option key={city} value={city} />)}
                    </datalist>
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase opacity-40 mb-2 block tracking-widest flex items-center gap-2"><LinkIcon className="w-3 h-3 text-blue-500" /> Affiliate / Promo Link</label>
                  <input value={inputs.promotionLink} onChange={e => setInputs({...inputs, promotionLink: e.target.value})} placeholder="https://your-product-link.com" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 font-bold outline-none focus:border-blue-500" />
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase opacity-40 mb-2 block tracking-widest">LSI Keywords</label>
                  <input value={inputs.secondaryKeywords} onChange={e => setInputs({...inputs, secondaryKeywords: e.target.value})} placeholder="semantic terms" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 font-bold outline-none focus:border-blue-500" />
                </div>
              </div>

              {error && <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase">{error}</div>}

              <button onClick={handleGenerate} disabled={loading} className="w-full mt-8 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.5rem] font-black text-xs tracking-[0.2em] shadow-2xl shadow-blue-500/30 flex flex-col items-center justify-center transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-95">
                {loading ? (
                  <>
                    <Loader2 className="animate-spin w-5 h-5 mb-2" />
                    <span className="text-[8px] animate-pulse tracking-widest uppercase">{loadingStep}</span>
                  </>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2 mb-1" /> RESEARCH & GENERATE</>
                )}
              </button>
            </div>
          </aside>

          <section className="lg:col-span-8 xl:col-span-9">
            {currentBlog ? (
              <div className="grid xl:grid-cols-12 gap-8 lg:gap-10">
                <div className="xl:col-span-7 space-y-8">
                  <div className="bg-white dark:bg-[#0a0c10] rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden min-h-[900px] flex flex-col">
                    <div className="px-10 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/40">
                       <div className="flex bg-white dark:bg-slate-950 rounded-2xl p-1 shadow-sm border border-slate-200 dark:border-slate-800">
                          <button onClick={() => setPreviewMode('preview')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${previewMode === 'preview' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Visual</button>
                          <button onClick={() => setPreviewMode('html')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${previewMode === 'html' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Source Code</button>
                       </div>
                       <button onClick={() => { navigator.clipboard.writeText(currentBlog.htmlContent); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="px-8 py-4 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase flex items-center gap-3 shadow-xl transition-all active:scale-95">
                          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied ? 'COPIED' : 'COPY HTML'}
                       </button>
                    </div>
                    <div className="p-10 lg:p-14 flex-1 overflow-y-auto custom-scrollbar">
                      {previewMode === 'preview' ? <article className="blogger-preview animate-in" dangerouslySetInnerHTML={{ __html: currentBlog.htmlContent }} /> : <pre className="text-xs font-mono bg-slate-950 text-blue-400/80 p-10 rounded-3xl whitespace-pre-wrap leading-relaxed border border-slate-800 h-full">{currentBlog.htmlContent}</pre>}
                    </div>
                  </div>
                </div>

                <aside className="xl:col-span-5 space-y-8">
                  <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden sticky top-32 flex flex-col max-h-[calc(100vh-160px)]">
                    <div className="overflow-y-auto custom-scrollbar flex-1">
                      <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/20 dark:bg-black/10">
                        <h3 className="text-sm font-black uppercase tracking-widest opacity-60">SEO Health Monitor</h3>
                        <div className="flex items-center gap-2">
                           <Globe className="w-4 h-4 text-blue-500" />
                           <span className="text-[10px] font-black uppercase">{currentBlog.sources.length} Research Signals</span>
                        </div>
                      </div>
                      
                      <div className="p-12 flex flex-col items-center border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <div className="relative w-64 h-32 mb-6">
                           <svg viewBox="0 0 100 50" className="w-full">
                              <path d="M 10 45 A 35 35 0 0 1 90 45" fill="transparent" stroke="currentColor" strokeWidth="6" className="text-slate-100 dark:text-slate-800" strokeLinecap="round" />
                              <path d="M 10 45 A 35 35 0 0 1 90 45" fill="transparent" stroke="url(#scoreGradient)" strokeWidth="6" strokeDasharray="125" strokeDashoffset={125 - (125 * (currentBlog.seoResult?.score || 0)) / 100} className="transition-all duration-1000 ease-out" strokeLinecap="round" />
                              <defs><linearGradient id="scoreGradient"><stop offset="0%" stopColor="#ef4444" /><stop offset="50%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#22c55e" /></linearGradient></defs>
                           </svg>
                           <div className="absolute inset-0 flex flex-col items-center justify-end">
                             <div className="flex items-center gap-1 mb-1"><Flame className="w-4 h-4 text-orange-500 animate-pulse" /><span className="text-[10px] font-black opacity-40 uppercase tracking-widest">Authority</span></div>
                             <div className="text-6xl font-black tracking-tighter tabular-nums">{currentBlog.seoResult?.score}<span className="text-base opacity-20 font-bold">/100</span></div>
                           </div>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 bg-blue-50 dark:bg-blue-900/10 px-5 py-2 rounded-full border border-blue-100 dark:border-blue-800/50">
                          <MapPin className="w-3.5 h-3.5" /> {inputs.city}, {inputs.country}
                        </div>
                      </div>

                      <div className="p-8 space-y-10">
                        <div>
                          <h4 className="text-[11px] font-black uppercase tracking-widest opacity-40 mb-6 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Content Depth</h4>
                          <div className="grid grid-cols-2 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] overflow-hidden">
                             <StructuralMetric label="Words" current={currentBlog.seoResult?.structure.words.current} range={currentBlog.seoResult?.structure.words} />
                             <StructuralMetric label="H2 Tags" current={currentBlog.seoResult?.structure.h2.current} range={currentBlog.seoResult?.structure.h2} />
                             <StructuralMetric label="Paragraphs" current={currentBlog.seoResult?.structure.paragraphs.current} range={currentBlog.seoResult?.structure.paragraphs} />
                             <StructuralMetric label="Visuals" current={currentBlog.seoResult?.structure.images.current} range={currentBlog.seoResult?.structure.images} />
                          </div>
                        </div>

                        {currentBlog.sources.length > 0 && (
                          <div className="space-y-4">
                            <h4 className="text-[11px] font-black uppercase tracking-widest opacity-40 flex items-center gap-2"><Globe className="w-4 h-4" /> Verified Sources</h4>
                            <div className="space-y-2">
                              {currentBlog.sources.slice(0, 5).map((source, i) => (
                                <a key={i} href={source.uri} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-blue-500 transition-colors group">
                                  <span className="text-[11px] font-bold truncate max-w-[200px]">{source.title}</span>
                                  <ExternalLink className="w-3 h-3 opacity-20 group-hover:opacity-100 transition-opacity" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="bg-slate-50 dark:bg-slate-950/40 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 space-y-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20"><MessageSquare className="w-6 h-6 text-white" /></div>
                            <div>
                              <h4 className="text-[11px] font-black uppercase tracking-widest">SEO Strategist</h4>
                              <p className="text-[9px] font-bold opacity-30 uppercase tracking-widest">Chat for micro-tweaks</p>
                            </div>
                          </div>
                          <div className="max-h-[250px] overflow-y-auto custom-scrollbar space-y-4 p-1">
                            {chatMessages.map((m, i) => (
                              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in`}>
                                <div className={`max-w-[85%] px-5 py-3.5 rounded-2xl text-[11px] font-bold leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-slate-900 text-white dark:bg-blue-600' : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700'}`}>
                                  {m.content}
                                </div>
                              </div>
                            ))}
                            {isChatting && <div className="flex gap-2 p-2"><div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" /><div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-100" /></div>}
                            <div ref={chatEndRef} />
                          </div>
                          <div className="flex gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
                             <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} placeholder="Ask for adjustments..." className="flex-1 bg-transparent px-4 py-3 text-xs font-bold outline-none" />
                             <button onClick={handleSendMessage} disabled={!chatInput.trim() || isChatting} className="bg-blue-600 text-white w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-90"><Send className="w-5 h-5" /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
            ) : (
              <div className="h-[900px] bg-white dark:bg-slate-900/20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[4rem] flex flex-col items-center justify-center text-center px-12 transition-all">
                <div className="bg-white dark:bg-slate-900 p-16 rounded-[4rem] mb-10 shadow-inner border border-slate-50 dark:border-slate-800 animate-pulse"><Smartphone className="w-32 h-32 opacity-10" /></div>
                <h3 className="text-3xl font-black opacity-20 uppercase tracking-tighter mb-4 italic">Blueprint Required</h3>
                <p className="text-[10px] font-black opacity-10 uppercase tracking-[0.4em]">Initialize research parameters to begin the SuperPage generation sequence.</p>
              </div>
            )}
          </section>
        </div>
      </main>

      <footer className="py-20 border-t border-slate-200 dark:border-slate-800 text-center bg-white dark:bg-[#050608]/40">
        <div className="flex flex-col items-center gap-6">
          <Zap className="w-6 h-6 text-blue-600 fill-current opacity-20" />
          <p className="text-[9px] font-black opacity-10 uppercase tracking-[0.6em] max-w-xl mx-auto px-6">SuperPage v5 • Zero Cost PWA Intelligence • 100% Humanized Affiliate Strategy</p>
        </div>
      </footer>
    </div>
  );
};

export default App;