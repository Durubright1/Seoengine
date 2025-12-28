import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { BlogInputs, GeneratedBlog, SearchIntent, Country, SEOScoreResult, ChatMessage, KeywordMetric } from './types';
import { generateFullSuperPage, analyzeSEOContent } from './services/geminiService';
import { 
  Zap, Copy, Loader2, Moon, Sun,
  Check, Sparkles, MessageSquare, 
  Send, Smartphone, BarChart3, Layout, ChevronUp, ChevronDown, 
  Target, Flame, HelpCircle, MapPin
} from 'lucide-react';

const COUNTRIES: Country[] = [
  { name: "Afghanistan", capital: "Kabul" }, { name: "Albania", capital: "Tirana" }, { name: "Algeria", capital: "Algiers" },
  { name: "Andorra", capital: "Andorra La Vella" }, { name: "Angola", capital: "Luanda" }, { name: "Antigua & Barbuda", capital: "Saint John's" },
  { name: "Argentina", capital: "Buenos Aires" }, { name: "Armenia", capital: "Yerevan" }, { name: "Australia", capital: "Canberra" },
  { name: "Austria", capital: "Vienna" }, { name: "Azerbaijan", capital: "Baku" }, { name: "Bahamas", capital: "Nassau" },
  { name: "Bahrain", capital: "Manama" }, { name: "Bangladesh", capital: "Dhaka" }, { name: "Barbados", capital: "Bridgetown" },
  { name: "Belarus", capital: "Minsk" }, { name: "Belgium", capital: "Brussels" }, { name: "Belize", capital: "Belmopan" },
  { name: "Benin", capital: "Porto-Novo" }, { name: "Bhutan", capital: "Thimphu" }, { name: "Bolivia", capital: "Sucre" },
  { name: "Bosnia & Herzegovina", capital: "Sarajevo" }, { name: "Botswana", capital: "Gaborone" }, { name: "Brazil", capital: "Brasilia" },
  { name: "Brunei", capital: "Bandar Seri Begawan" }, { name: "Bulgaria", capital: "Sofia" }, { name: "Burkina Faso", capital: "Ouagadougou" },
  { name: "Burundi", capital: "Gitega" }, { name: "Cabo Verde", capital: "Praia" }, { name: "Cambodia", capital: "Phnom Penh" },
  { name: "Cameroon", capital: "Yaounde" }, { name: "Canada", capital: "Ottawa" }, { name: "Chile", capital: "Santiago" },
  { name: "China", capital: "Beijing" }, { name: "Colombia", capital: "Bogotá" }, { name: "Costa Rica", capital: "San Jose" },
  { name: "Croatia", capital: "Zagreb" }, { name: "Cuba", capital: "Havana" }, { name: "Denmark", capital: "Copenhagen" },
  { name: "Egypt", capital: "Cairo" }, { name: "France", capital: "Paris" }, { name: "Germany", capital: "Berlin" },
  { name: "India", capital: "New Delhi" }, { name: "Indonesia", capital: "Jakarta" }, { name: "Israel", capital: "Jerusalem" },
  { name: "Italy", capital: "Rome" }, { name: "Japan", capital: "Tokyo" }, { name: "Mexico", capital: "Mexico City" },
  { name: "Netherlands", capital: "Amsterdam" }, { name: "Nigeria", capital: "Abuja" }, { name: "Norway", capital: "Oslo" },
  { name: "Pakistan", capital: "Islamabad" }, { name: "Philippines", capital: "Manila" }, { name: "Poland", capital: "Warsaw" },
  { name: "Portugal", capital: "Lisbon" }, { name: "Russia", capital: "Moscow" }, { name: "Saudi Arabia", capital: "Riyadh" },
  { name: "Singapore", capital: "Singapore" }, { name: "South Africa", capital: "Pretoria" }, { name: "South Korea", capital: "Seoul" },
  { name: "Spain", capital: "Madrid" }, { name: "Switzerland", capital: "Bern" }, { name: "Thailand", capital: "Bangkok" },
  { name: "Turkey", capital: "Ankara" }, { name: "Ukraine", capital: "Kyiv" }, { name: "United Kingdom", capital: "London" },
  { name: "United States", capital: "Washington, D.C." }, { name: "Vietnam", capital: "Hanoi" }
].sort((a, b) => a.name.localeCompare(b.name));

const LOADING_MESSAGES = ["Scanning Global Trends...", "Synthesizing Humanized Copy...", "Injecting Viral Hooks...", "Mapping Local Intent...", "Architecting HTML Markup..."];

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
    const interval = setInterval(() => setLoadingStep(LOADING_MESSAGES[msgIdx++ % LOADING_MESSAGES.length]), 4000);
    try {
      const result = await generateFullSuperPage(inputs, setLoadingStep);
      const seo = await analyzeSEOContent(inputs.title, inputs.secondaryKeywords, inputs.country, inputs.city, result.html);
      const newBlog: GeneratedBlog = {
        id: crypto.randomUUID(), timestamp: Date.now(), title: inputs.title,
        htmlContent: result.html, previewImageUrl: result.previewImageUrl,
        inputs: { ...inputs }, sources: result.sources, seoResult: seo
      };
      setCurrentBlog(newBlog);
      setChatMessages([{ role: 'assistant', content: `Success! Local SEO for ${inputs.city} active. Score: ${seo.score}/100. Any virality adjustments needed?` }]);
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
        config: { systemInstruction: `You are an SEO Content Strategist. Help optimize "${currentBlog.title}". Make it more human, viral, and helpful.` } 
      });
      const response = await chat.sendMessage({ message: content });
      setChatMessages(prev => [...prev, { role: 'assistant', content: response.text || 'Process completed.' }]);
    } catch { 
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Connection timed out. Try again.' }]); 
    } finally { setIsChatting(false); }
  };

  const StructuralMetric = ({ label, current, range }: any) => {
    const isUnder = current < range.min;
    const isOver = current > range.max;
    return (
      <div className="flex flex-col items-center py-5 border-r last:border-r-0 border-slate-100 dark:border-slate-800">
        <span className="text-[10px] font-black opacity-30 uppercase tracking-widest mb-1">{label}</span>
        <div className="flex items-center gap-1">
          <span className="text-xl font-black">{current}</span>
          {isUnder && <ChevronDown className="w-3 h-3 text-red-500" />}
          {isOver && <ChevronUp className="w-3 h-3 text-red-500" />}
        </div>
        <span className="text-[9px] opacity-40 font-bold">{range.min} - {range.max}</span>
      </div>
    );
  };

  const KeywordPill = ({ term }: { term: KeywordMetric }) => {
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#050608] flex flex-col font-jakarta">
      <header className="h-20 lg:h-24 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#050608]/80 backdrop-blur-2xl sticky top-0 z-[100] px-8 lg:px-12 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-2.5 rounded-2xl shadow-xl shadow-blue-600/20"><Zap className="text-white w-6 h-6 fill-current" /></div>
          <div>
            <h1 className="text-xl font-black tracking-tighter uppercase">SuperPage <span className="text-blue-600 italic">Viral</span></h1>
            <p className="text-[8px] font-black opacity-30 uppercase tracking-[0.4em] leading-none mt-1">SEO Engine v5</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <button onClick={toggleTheme} className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm">
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
                  <label className="text-[9px] font-black uppercase opacity-40 mb-2 block tracking-widest">Primary Topic Keyword</label>
                  <input value={inputs.title} onChange={e => setInputs({...inputs, title: e.target.value})} placeholder="e.g. Best SEO Tools for 2025" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 font-bold outline-none" />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase opacity-40 mb-2 block tracking-widest">Secondary Keywords (LSI)</label>
                  <input value={inputs.secondaryKeywords} onChange={e => setInputs({...inputs, secondaryKeywords: e.target.value})} placeholder="comma, separated, terms" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 font-bold outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black uppercase opacity-40 mb-2 block tracking-widest">Country</label>
                    <select value={inputs.country} onChange={e => { const c = COUNTRIES.find(x => x.name === e.target.value); if(c) setInputs({...inputs, country: c.name, city: c.capital}); }} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-3 font-bold text-xs appearance-none">
                      {COUNTRIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase opacity-40 mb-2 block tracking-widest">Target City</label>
                    <input value={inputs.city} onChange={e => setInputs({...inputs, city: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-3 font-bold text-xs" />
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase opacity-40 mb-2 block tracking-widest">The Strategic Brief</label>
                  <textarea rows={6} value={inputs.customInstructions} onChange={e => setInputs({...inputs, customInstructions: e.target.value})} placeholder="Provide specific data, structure, or content requirements here..." className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 font-bold outline-none resize-none" />
                </div>
              </div>
              <button onClick={handleGenerate} disabled={loading} className="w-full mt-8 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.5rem] font-black text-xs tracking-[0.2em] shadow-2xl shadow-blue-500/30 flex items-center justify-center transition-all disabled:opacity-50">
                {loading ? <div className="flex flex-col items-center"><Loader2 className="animate-spin w-5 h-5 mb-1" /><span className="text-[8px] animate-pulse">{loadingStep}</span></div> : <><Sparkles className="w-4 h-4 mr-2" /> GENERATE SUPERPAGE</>}
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
                        <HelpCircle className="w-4 h-4 opacity-20" />
                      </div>
                      <div className="p-12 flex flex-col items-center border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <div className="relative w-64 h-32 mb-6">
                           <svg viewBox="0 0 100 50" className="w-full">
                              <path d="M 10 45 A 35 35 0 0 1 90 45" fill="transparent" stroke="currentColor" strokeWidth="6" className="text-slate-100 dark:text-slate-800" strokeLinecap="round" />
                              <path d="M 10 45 A 35 35 0 0 1 90 45" fill="transparent" stroke="url(#scoreGradient)" strokeWidth="6" strokeDasharray="125" strokeDashoffset={125 - (125 * (currentBlog.seoResult?.score || 0)) / 100} className="transition-all duration-1000 ease-out" strokeLinecap="round" />
                              <defs><linearGradient id="scoreGradient"><stop offset="0%" stopColor="#ef4444" /><stop offset="50%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#22c55e" /></linearGradient></defs>
                           </svg>
                           <div className="absolute inset-0 flex flex-col items-center justify-end">
                             <div className="flex items-center gap-1 mb-1"><Flame className="w-4 h-4 text-orange-500 animate-pulse" /><span className="text-[10px] font-black opacity-40 uppercase tracking-widest">Rankability</span></div>
                             <div className="text-6xl font-black tracking-tighter tabular-nums">{currentBlog.seoResult?.score}<span className="text-base opacity-20 font-bold">/100</span></div>
                           </div>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 bg-blue-50 dark:bg-blue-900/10 px-5 py-2 rounded-full border border-blue-100 dark:border-blue-800/50">
                          <MapPin className="w-3.5 h-3.5" /> Local Authority: {inputs.city}
                        </div>
                      </div>
                      <div className="p-8 space-y-10">
                        <div>
                          <h4 className="text-[11px] font-black uppercase tracking-widest opacity-40 mb-6 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Structural Audit</h4>
                          <div className="grid grid-cols-2 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] overflow-hidden">
                             <StructuralMetric label="Words" current={currentBlog.seoResult?.structure.words.current} range={currentBlog.seoResult?.structure.words} />
                             <StructuralMetric label="H2 Tags" current={currentBlog.seoResult?.structure.h2.current} range={currentBlog.seoResult?.structure.h2} />
                             <StructuralMetric label="Paragraphs" current={currentBlog.seoResult?.structure.paragraphs.current} range={currentBlog.seoResult?.structure.paragraphs} />
                             <StructuralMetric label="Visuals" current={currentBlog.seoResult?.structure.images.current} range={currentBlog.seoResult?.structure.images} />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-6">
                            <h4 className="text-[11px] font-black uppercase tracking-widest opacity-40 flex items-center gap-2"><Target className="w-4 h-4" /> Semantic Terms</h4>
                            <span className="text-[9px] font-black opacity-20 uppercase tracking-widest">{currentBlog.seoResult?.terms.length} Tracked</span>
                          </div>
                          <div className="flex flex-wrap gap-2.5">
                            {currentBlog.seoResult?.terms.map((t, i) => <KeywordPill key={i} term={t} />)}
                          </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-950/40 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 space-y-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20"><MessageSquare className="w-6 h-6 text-white" /></div>
                            <div>
                              <h4 className="text-[11px] font-black uppercase tracking-widest">AI Content Strategist</h4>
                              <p className="text-[9px] font-bold opacity-30 uppercase tracking-widest">Analysis Mode: Human & Viral</p>
                            </div>
                          </div>
                          <div className="max-h-[300px] overflow-y-auto custom-scrollbar space-y-4 p-1">
                            {chatMessages.map((m, i) => (
                              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in`}>
                                <div className={`max-w-[85%] px-5 py-3.5 rounded-2xl text-[11px] font-bold leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-slate-900 text-white dark:bg-blue-600' : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700'}`}>
                                  {m.content}
                                </div>
                              </div>
                            ))}
                            {isChatting && <div className="flex gap-2 p-2"><div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" /><div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-100" /><div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-200" /></div>}
                            <div ref={chatEndRef} />
                          </div>
                          <div className="flex gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
                             <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} placeholder="Ask to humanize, add FAQ..." className="flex-1 bg-transparent px-4 py-3 text-xs font-bold outline-none" />
                             <button onClick={handleSendMessage} disabled={!chatInput.trim() || isChatting} className="bg-blue-600 text-white w-12 h-12 rounded-xl flex items-center justify-center shadow-lg hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-90"><Send className="w-5 h-5" /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
            ) : (
              <div className="h-[900px] bg-white dark:bg-slate-900/20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[4rem] flex flex-col items-center justify-center text-center px-12">
                <div className="bg-white dark:bg-slate-900 p-16 rounded-[4rem] mb-10 shadow-inner border border-slate-50 dark:border-slate-800 animate-pulse"><Smartphone className="w-32 h-32 opacity-10" /></div>
                <h3 className="text-3xl font-black opacity-20 uppercase tracking-tighter mb-4">Awaiting Signal</h3>
                <p className="text-[10px] font-black opacity-10 uppercase tracking-[0.4em]">Initialize the Page Blueprint to start the generation sequence.</p>
              </div>
            )}
          </section>
        </div>
      </main>

      <footer className="py-20 border-t border-slate-200 dark:border-slate-800 text-center bg-white dark:bg-[#050608]/40">
        <div className="flex flex-col items-center gap-6">
          <Zap className="w-6 h-6 text-blue-600 fill-current opacity-20" />
          <p className="text-[9px] font-black opacity-10 uppercase tracking-[0.6em] max-w-xl mx-auto px-6">SuperPage v5 • World-Class Content Intelligence Architecture • 100% Humanized Strategy</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
