import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Leaf, 
  MapPin, 
  Thermometer, 
  CloudRain, 
  Droplets, 
  TrendingUp, 
  Info, 
  RefreshCcw, 
  ChevronRight, 
  ChevronLeft,
  Volume2,
  VolumeX,
  Sparkles,
  Search,
  CheckCircle2,
  XCircle,
  BarChart3,
  Stethoscope,
  User,
  Phone
} from 'lucide-react';

import { SPECS, ECON, STRINGS, SOIL_TYPES, DISTRICTS_DATA, SOIL_DOCTORS } from './constants';
import { Language, SoilType, AnalysisResult } from './types';

// --- Components ---

const MeshBackground = () => (
  <div className="mesh-bg">
    <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl animate-float-slow" />
    <div className="absolute bottom-[20%] right-[10%] w-96 h-96 bg-agri-main/10 rounded-full blur-3xl animate-float-delayed" />
    <div className="absolute top-[40%] right-[15%] w-48 h-48 bg-emerald-300/10 rounded-full blur-2xl animate-float-slow" />
  </div>
);

const Header = ({ lang, voiceOn, toggleVoice, setLang, speak }: { 
  lang: Language, 
  voiceOn: boolean, 
  toggleVoice: () => void,
  setLang: (l: Language) => void,
  speak: (t: string) => void
}) => {
  const l = STRINGS[lang];
  return (
    <div className="sticky top-0 z-[500] px-4 py-3">
      <div className="max-w-6xl mx-auto glass rounded-2xl flex items-center justify-between px-6 py-3 shadow-sm">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => speak(l.appName)}>
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-agri-dark rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Leaf size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-display text-xl text-emerald-900 font-bold tracking-tight">{l.appName}</h1>
            <p className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest leading-none">Digital Agri</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-slate-100 p-1 rounded-xl gap-1 shrink-0">
            {(['en', 'te', 'hi'] as Language[]).map(ln => (
              <button
                key={ln}
                onClick={() => setLang(ln)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  lang === ln 
                    ? 'bg-white shadow-sm text-emerald-700' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {ln === 'en' ? 'EN' : ln === 'te' ? 'తె' : 'हि'}
              </button>
            ))}
          </div>
          <button
            onClick={toggleVoice}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              voiceOn 
                ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                : 'bg-neutral-50 border-neutral-200 text-slate-400'
            }`}
          >
            {voiceOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
            <span className="hidden sm:inline">{l.vbtxt}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [introStarted, setIntroStarted] = useState(false);
  const [activeStepCover, setActiveStepCover] = useState<number | null>(null);
  const [lang, setLang] = useState<Language | null>(null);
  const [step, setStep] = useState(1);
  const [soilType, setSoilType] = useState<SoilType | ''>('');
  const [ph, setPh] = useState(6.5);
  const [n, setN] = useState<string>('');
  const [p, setP] = useState<string>('');
  const [k, setK] = useState<string>('');
  const [land, setLand] = useState<string>('');
  const [tmp, setTmp] = useState(28);
  const [rain, setRain] = useState<string>('850');
  const [season, setSeason] = useState('Kharif');
  const [irrigation, setIrrigation] = useState('Well');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [voiceOn, setVoiceOn] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchDistrict, setSearchDistrict] = useState('');
  const [detectedDistrict, setDetectedDistrict] = useState<string | null>(null);

  const prevStepRef = useRef(step);

  // --- Voice Engine ---
  const speak = (txt: string) => {
    if (!voiceOn || !window.speechSynthesis || !lang) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(txt);
    u.lang = lang === 'te' ? 'te-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN';
    u.rate = 1.0;
    window.speechSynthesis.speak(u);
  };

  useEffect(() => {
    if (lang && step === 1 && prevStepRef.current !== 1) {
      speak(STRINGS[lang].v1);
    } else if (lang && step === 2) {
      speak(STRINGS[lang].v2);
    }
    prevStepRef.current = step;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step, lang]);

  // --- Geolocation Mock ---
  const handleUseLocation = () => {
    if (!lang) return;
    
    // Explicitly ask the user via voice
    const askMsg = lang === 'te' 
      ? "దయచేసి మీ స్థానాన్ని గుర్తించడానికి అనుమతించండి." 
      : lang === 'hi' 
        ? "कृपया अपना स्थान पहचानने की अनुमति दें।" 
        : "Please allow access to your location so I can identify your district.";
    
    speak(askMsg);
    
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        
        let nearestId = '';
        let minDistance = Infinity;

        // Haversine-like distance simple approximation for small areas
        Object.entries(DISTRICTS_DATA).forEach(([id, data]) => {
          const dy = latitude - data.lat;
          const dx = (longitude - data.lng) * Math.cos(latitude * Math.PI / 180);
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < minDistance) {
            minDistance = distance;
            nearestId = id;
          }
        });

        if (nearestId) {
          applyDistrictData(nearestId);
        }
        
        const successMsg = lang === 'te' 
          ? "ధన్యవాదాలు. మీ ప్రాంతాన్ని నేను గుర్తించాను." 
          : lang === 'hi' 
            ? "धन्यवाद। मैंने आपके क्षेत्र की पहचान कर ली है।" 
            : "Thank you. I have identified your location.";
        speak(successMsg);
      }, (err) => {
        const denyMsg = lang === 'te' 
          ? "క్షమించాలి, స్థాన అనుమతి తిరస్కరించబడింది." 
          : lang === 'hi' 
            ? "क्षमा करें, स्थान की अनुमति अस्वीकार कर दी गई है।" 
            : "Location access was denied.";
        setError(denyMsg);
        speak(denyMsg);
      });
    } else {
      setError("Geolocation not supported.");
    }
  };

  const applyDistrictData = (id: string) => {
    const data = DISTRICTS_DATA[id];
    if (data && lang) {
      setSoilType(data.soil);
      setDetectedDistrict(id);
      setSearchDistrict('');
      setRain(data.rainfall.toString());
      const soilName = STRINGS[lang]['sn' + SOIL_TYPES.findIndex(s => s.type === data.soil)];
      speak(`${STRINGS[lang].locAuto} ${soilName}. ${STRINGS[lang].rnAuto} ${data.rainfall} mm.`);
    }
  };

  // --- Calculations ---
  const calculateResult = async () => {
    if (!lang) return;
    setLoading(true);
    setResult(null);
    speak(STRINGS[lang].vana);

    const landNum = parseFloat(land);
    const nNum = parseFloat(n);
    const pNum = parseFloat(p);
    const kNum = parseFloat(k);
    const rainNum = parseFloat(rain);

    const scores = Object.keys(SPECS).map(cropName => {
      const spec = SPECS[cropName];
      let score = 100;
      if (soilType !== spec.soil) score -= 30;
      if (ph < spec.minPH || ph > spec.maxPH) score -= 20;
      if (nNum < spec.minN || nNum > spec.maxN) score -= 17;
      if (pNum < spec.minP || pNum > spec.maxP) score -= 17;
      if (kNum < spec.minK || kNum > spec.maxK) score -= 16;
      return { cropName, score: Math.max(0, score) };
    }).sort((a, b) => b.score - a.score);

    const top3 = scores.slice(0, 3).map(x => x.cropName);
    const bestCrop = top3[0];
    const econ = ECON[bestCrop];
    
    const estYield = parseFloat((econ.yld * landNum).toFixed(1));
    const totalCost = Math.round(econ.cost * landNum);
    const totalRevenue = Math.round(econ.yld * landNum * econ.msp);
    const netProfit = totalRevenue - totalCost;

    const adviceResponse = await fetch('/api/advice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        soilType: STRINGS[lang].sn0 ? STRINGS[lang]['sn' + SOIL_TYPES.findIndex(s => s.type === soilType)] : soilType,
        ph, n: nNum, p: pNum, k: kNum,
        land: landNum, tmp, rain: rainNum,
        season: STRINGS[lang].sk0 ? STRINGS[lang]['sk' + ['Kharif', 'Rabi', 'Zaid', 'Perennial'].indexOf(season)] : season,
        irrigation: STRINGS[lang].ir0 ? STRINGS[lang]['ir' + ['Well', 'Canal', 'Rainfed', 'Drip'].indexOf(irrigation)] : irrigation,
        topCrops: top3.map(c => STRINGS[lang].crops[c] || c),
        bestCrop: STRINGS[lang].crops[bestCrop] || bestCrop,
        yield: estYield,
        profit: netProfit,
        lang
      })
    });

    const adviceData = await adviceResponse.json();
    const aiAdvice = adviceData.advice || "Advice currently unavailable.";

    setResult({
      bestCrop,
      top3,
      estimatedYield: estYield,
      netProfit,
      advice: aiAdvice
    });
    setLoading(false);
    speak(STRINGS[lang].vres(STRINGS[lang].crops[bestCrop], Math.abs(netProfit).toLocaleString('en-IN')));
  };

  const handleNextStep1 = () => {
    if (!soilType || !n || !p || !k || !land) {
      setError(STRINGS[lang!].e1);
      speak(STRINGS[lang!].e1);
      return;
    }
    setError(null);
    setStep(2);
    setActiveStepCover(2);
    speak(STRINGS[lang!].s2t);
  };

  const handleAnalyze = () => {
    if (!rain) {
      setError(STRINGS[lang!].e2);
      speak(STRINGS[lang!].e2);
      return;
    }
    setError(null);
    setStep(3);
    setActiveStepCover(3);
  };

  const resetAll = () => {
    setStep(1);
    setResult(null);
    setSoilType('');
    setN(''); setP(''); setK(''); setLand('');
    setRain('850');
    setError(null);
  };

  const l = lang ? STRINGS[lang] : STRINGS.en;

  if (!introStarted) {
    return (
      <div className="fixed inset-0 z-[10000] bg-black flex flex-col items-center justify-center text-white overflow-hidden">
        <motion.div 
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.6 }}
          transition={{ duration: 2 }}
          className="absolute inset-0 z-0"
        >
          <img 
            src="https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=1920&q=80" 
            alt="Farming Landscape" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-transparent to-black/40 z-1" />
        
        <div className="relative z-10 text-center px-6">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="h-[2px] w-12 bg-emerald-500 rounded-full" />
              <p className="text-emerald-400 font-bold uppercase tracking-[0.5em] text-[10px]">Welcome to</p>
              <div className="h-[2px] w-12 bg-emerald-500 rounded-full" />
            </div>
            <h1 className="font-display text-7xl md:text-9xl font-black mb-4 tracking-tighter drop-shadow-2xl">
              ANNADATA
            </h1>
            <p className="text-white/80 font-medium text-sm md:text-xl max-w-lg mx-auto mb-10 leading-relaxed italic">
              "Providing the power of AI to every farmer's hand, ensuring a greener and more prosperous tomorrow."
            </p>
          </motion.div>

          <motion.button
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1.2 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setIntroStarted(true);
              speak("Please select your language to begin.");
            }}
            className="group relative px-12 py-5 bg-emerald-600 rounded-2xl font-bold uppercase tracking-widest text-sm shadow-2xl hover:bg-emerald-500 transition-all flex items-center gap-3 mx-auto"
          >
            <span className="relative z-10">Launch Experience</span>
            <ChevronRight className="group-hover:translate-x-1 transition-transform relative z-10" />
            <div className="absolute inset-0 rounded-2xl ring-2 ring-emerald-400/50 animate-ping opacity-20" />
          </motion.button>
        </div>
      </div>
    );
  }

  // Cinematic Step Covers
  const stepCovers: Record<number, { img: string, title: string, sub: string, icon: any }> = {
    1: { 
      img: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=1920&q=80", 
      title: l.s1t, 
      sub: l.s1s,
      icon: <Leaf size={40} className="text-emerald-400" />
    },
    2: { 
      img: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1920&q=80", 
      title: l.s2t, 
      sub: l.s2s,
      icon: <CloudRain size={40} className="text-emerald-400" />
    },
    3: { 
      img: "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=1920&q=80", 
      title: l.rht, 
      sub: l.fieldStrategy,
      icon: <Sparkles size={40} className="text-emerald-400" />
    }
  };

  if (activeStepCover !== null) {
    const cover = stepCovers[activeStepCover];
    return (
      <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center text-white overflow-hidden">
        <motion.div 
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.7 }}
          className="absolute inset-0"
        >
          <img 
            src={cover.img} 
            alt="Step Background" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-900/40 to-black/60" />
        
        <div className="relative z-10 text-center px-8">
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex flex-col items-center"
          >
            <div className="p-5 bg-white/10 backdrop-blur-2xl rounded-[2rem] border border-white/20 mb-8 shadow-2xl">
              {cover.icon}
            </div>
            <h2 className="font-display text-5xl md:text-8xl font-black mb-4 tracking-tighter uppercase whitespace-pre-wrap">
              {cover.title}
            </h2>
            <div className="h-1.5 w-24 bg-emerald-500 mx-auto rounded-full mb-8" />
            <p className="text-emerald-300 font-bold uppercase tracking-[0.4em] text-xs mb-12 max-w-md mx-auto leading-relaxed">
              {cover.sub}
            </p>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const finishing = activeStepCover === 3;
                setActiveStepCover(null);
                // Force a scroll to top when cover is dismissed
                window.scrollTo({ top: 0, behavior: 'instant' });
                if (finishing) {
                  calculateResult();
                }
              }}
              className="px-12 py-5 bg-white text-emerald-950 rounded-2xl font-black uppercase tracking-widest text-sm shadow-2xl flex items-center gap-4 group transition-all relative z-[10010]"
            >
              <span className="relative z-10">{activeStepCover === 3 ? l.anTxt : "Explore Details"}</span>
              <ChevronRight className="group-hover:translate-x-1 transition-transform relative z-10" size={20} />
            </motion.button>
          </motion.div>
        </div>
        
        <div className="absolute top-12 left-12 opacity-40">
           <h4 className="text-2xl font-bold tracking-tighter italic">ANNADATA</h4>
        </div>
      </div>
    );
  }

  if (!lang) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#022c22] flex flex-col items-center justify-center p-6 text-center overflow-hidden">
        <MeshBackground />
        
        <div className="relative z-10 flex flex-col items-center">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0, rotate: -20 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
            className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-agri-dark rounded-[2.5rem] flex items-center justify-center shadow-2xl mb-8 relative"
          >
            <Leaf className="text-white" size={48} />
            <div className="absolute -top-2 -right-2 bg-white rounded-full p-2 shadow-lg">
              <Sparkles className="text-emerald-500 animate-pulse" size={16} />
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <h1 className="font-display text-4xl sm:text-6xl md:text-8xl font-bold text-white mb-2 tracking-tighter">
              {STRINGS.en.appName}
            </h1>
            <div className="h-1.5 w-24 bg-emerald-500 mx-auto rounded-full mb-6" />
            <p className="text-emerald-400 font-bold uppercase tracking-[0.4em] text-[10px] sm:text-xs">
              {STRINGS.en.appSub}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl px-4">
            {[
              { id: 'en', nat: 'English', sub: STRINGS.en.welcomeTitle, icon: '🌍' },
              { id: 'te', nat: 'తెలుగు', sub: STRINGS.te.welcomeTitle, icon: '🌾' },
              { id: 'hi', nat: 'हिंदी', sub: STRINGS.hi.welcomeTitle, icon: '🌞' }
            ].map((item, idx) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + (idx * 0.1) }}
                whileHover={{ y: -8, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setLang(item.id as Language);
                  speak(STRINGS[item.id as Language].welcome);
                  setActiveStepCover(1);
                }}
                className="group relative bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl flex flex-col items-center gap-2 transition-all hover:bg-white/10 hover:border-emerald-500/50"
              >
                <div className="text-3xl mb-1">{item.icon}</div>
                <span className={`text-xl font-bold text-white tracking-tight ${item.id === 'te' || item.id === 'hi' ? 'font-sans' : ''}`}>{item.nat}</span>
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest opacity-60">{item.sub}</span>
              </motion.button>
            ))}
          </div>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-12 text-emerald-500/40 text-[9px] font-bold uppercase tracking-[0.2em] max-w-xs"
          >
            {STRINGS.en.expertSys}
          </motion.p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen text-slate-800 font-sans selection:bg-emerald-200 relative ${lang === 'te' ? 'lte' : lang === 'hi' ? 'lhi' : ''}`}>
      <MeshBackground />
      <Header 
        lang={lang} 
        voiceOn={voiceOn} 
        toggleVoice={() => setVoiceOn(!voiceOn)} 
        setLang={setLang}
        speak={speak}
      />

      <main className="max-w-4xl mx-auto px-6 py-10 pb-24">
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {[l.step1, l.step2, l.step3].map((s, i) => (
            <React.Fragment key={i}>
              <div 
                className={`flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer transition-all ${
                  step === i + 1 
                    ? 'bg-emerald-600 text-white shadow-lg' 
                    : step > i + 1 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-white text-slate-400 border border-neutral-200'
                }`}
                onClick={() => {
                  if (step > i + 1) setStep(i + 1);
                  speak(s);
                }}
              >
                <div className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${step >= i + 1 ? 'bg-white/20' : 'bg-slate-100'}`}>
                  {i + 1}
                </div>
                <span className="text-xs font-bold">{s}</span>
              </div>
              {i < 2 && <div className={`w-10 h-0.5 rounded-full ${step > i + 1 ? 'bg-emerald-300' : 'bg-neutral-200'}`} />}
            </React.Fragment>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass rounded-[2rem] overflow-hidden shadow-2xl shadow-emerald-900/10 relative"
            >
              {/* Module Background Image */}
              <div className="absolute inset-0 z-0">
                <img 
                  src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80" 
                  alt="Soil Module Background" 
                  className="w-full h-full object-cover opacity-20"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/80 to-white" />
              </div>

              <div className="relative z-10">
                <div className="h-48 relative overflow-hidden backdrop-blur-sm border-b border-white/20">
                  <div className="absolute inset-0">
                    <img 
                      src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80" 
                      alt="Soil health" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-emerald-950/40 to-transparent" />
                  </div>
                  <div className="absolute bottom-6 left-8 flex items-center gap-4">
                    <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                      <Leaf className="text-emerald-300" size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-white cursor-pointer" onClick={() => speak(l.s1t)}>{l.s1t}</h2>
                      <p className="text-sm text-emerald-200 cursor-pointer" onClick={() => speak(l.s1s)}>{l.s1s}</p>
                    </div>
                  </div>
                </div>

                <div className="p-8 md:p-10 space-y-10">
                <div className="bg-emerald-50/50 backdrop-blur-sm rounded-2xl p-6 border border-emerald-100/50">
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-xs font-bold uppercase tracking-widest text-emerald-800 cursor-pointer" onClick={() => speak(l.locLbl)}>{l.locLbl}</label>
                    <button 
                      onClick={handleUseLocation}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white border border-emerald-200 rounded-xl text-[10px] font-bold text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                    >
                      <MapPin size={12} /> {l.useLoc}
                    </button>
                  </div>
                  
                  <div className="relative">
                    <input 
                      type="text" 
                      value={searchDistrict}
                      onChange={e => setSearchDistrict(e.target.value)}
                      placeholder={l.locPh}
                      className="w-full bg-white rounded-xl px-10 py-3 outline-none border border-emerald-200 focus:ring-2 focus:ring-emerald-500/20 text-sm font-medium"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400" size={16} />
                    
                    {searchDistrict && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-neutral-200 shadow-2xl z-50 overflow-hidden max-h-[300px] overflow-y-auto">
                        {Object.entries(DISTRICTS_DATA)
                          .filter(([id, data]) => 
                            data.nameEn.toLowerCase().includes(searchDistrict.toLowerCase()) || 
                            data.nameTe.includes(searchDistrict) || 
                            data.nameHi.includes(searchDistrict)
                          )
                          .map(([id, data]) => (
                            <button
                              key={id}
                              onClick={() => applyDistrictData(id)}
                              className="w-full text-left px-5 py-3 hover:bg-emerald-50 transition-colors border-b border-neutral-50 last:border-0 flex justify-between items-center"
                            >
                              <div>
                                <p className="text-sm font-bold text-slate-700">{data[`name${lang.charAt(0).toUpperCase() + lang.slice(1)}` as keyof typeof data]}</p>
                                <p className="text-[10px] text-slate-400 uppercase font-medium">{STRINGS[lang]['sn' + SOIL_TYPES.findIndex(s => s.type === data.soil)]}</p>
                              </div>
                              <ChevronRight size={14} className="text-emerald-400" />
                            </button>
                          ))}
                      </div>
                    )}
                  </div>

                  {detectedDistrict && (
                    <div className="mt-3 flex items-center justify-between bg-white/50 px-4 py-2 rounded-lg border border-emerald-200/50">
                      <p className="text-[10px] font-bold text-emerald-700">
                        {l.locAuto} <span className="underline">{DISTRICTS_DATA[detectedDistrict][`name${lang.charAt(0).toUpperCase() + lang.slice(1)}` as keyof typeof DISTRICTS_DATA[string]]}</span>
                      </p>
                      <button onClick={() => setDetectedDistrict(null)} className="text-emerald-400 hover:text-emerald-600 transition-colors">
                        <XCircle size={14} />
                      </button>
                    </div>
                  )}

                  {detectedDistrict && SOIL_DOCTORS[detectedDistrict] && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-8 pt-6 border-t border-emerald-100"
                    >
                      <div className="flex items-center gap-3 mb-4 cursor-pointer" onClick={() => speak(l.drTitle)}>
                        <div className="p-2 bg-emerald-100 rounded-lg">
                          <Stethoscope size={18} className="text-emerald-700" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 tracking-tight">{l.drTitle}</h4>
                          <p className="text-[10px] text-slate-500 font-medium">{l.drSub}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-3">
                        {SOIL_DOCTORS[detectedDistrict].map((dr, idx) => (
                          <motion.a
                            key={idx}
                            href={`tel:${dr.phone}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            whileHover={{ x: 5 }}
                            className="flex items-center justify-between p-4 bg-white border border-neutral-100 rounded-2xl shadow-sm hover:border-emerald-200 hover:bg-emerald-50/30 transition-all group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 border border-emerald-100">
                                <User size={18} />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-700">{dr[`name${lang.charAt(0).toUpperCase() + lang.slice(1)}` as keyof typeof dr]}</p>
                                <p className="text-[10px] font-bold text-emerald-600 tracking-wider">{dr.phone}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-emerald-600/20 group-hover:bg-emerald-700 transition-all">
                              <Phone size={12} />
                              <span>{l.callNow}</span>
                            </div>
                          </motion.a>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold uppercase tracking-widest text-emerald-800 cursor-pointer" onClick={() => speak(l.soilLbl)}>{l.soilLbl}</label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {SOIL_TYPES.map((st, idx) => (
                      <button
                        key={st.type}
                        onClick={() => {
                          setSoilType(st.type);
                          speak(l['sn' + idx]);
                        }}
                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                          soilType === st.type 
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                            : 'bg-white border-neutral-100 hover:border-emerald-200 text-slate-400'
                        }`}
                      >
                        <span className="text-2xl">{st.icon}</span>
                        <span className="text-[10px] font-bold uppercase">{l['sn' + idx]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-50/50 backdrop-blur-sm rounded-2xl p-6 border border-neutral-100">
                  <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => speak(l.phLbl)}>
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">{l.phLbl}</label>
                    <span className="text-xl font-bold text-emerald-700 px-3 py-1 bg-white rounded-xl shadow-sm border border-emerald-100">{ph}</span>
                  </div>
                  <input 
                    type="range" min="4" max="9" step="0.1" value={ph} 
                    onChange={e => setPh(parseFloat(e.target.value))}
                    className="w-full accent-emerald-600 h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400 uppercase cursor-pointer" onClick={() => speak(l.phU)}>
                    <span>{l.phU.split('←→')[0]}</span>
                    <span>{l.phU.split('←→')[1]}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {[
                    { label: l.nLbl, val: n, set: setN, unit: l.nU, icon: <div className="text-xs font-bold text-emerald-800">N</div> },
                    { label: l.pLbl, val: p, set: setP, unit: l.pU, icon: <div className="text-xs font-bold text-emerald-800">P</div> },
                    { label: l.kLbl, val: k, set: setK, unit: l.kU, icon: <div className="text-xs font-bold text-emerald-800">K</div> },
                    { label: l.landLbl, val: land, set: setLand, unit: l.landU, icon: <MapPin size={16} /> }
                  ].map((field, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center gap-2 cursor-pointer" onClick={() => speak(field.label)}>
                        <div className="text-emerald-700">{field.icon}</div>
                        <label className="text-xs font-bold uppercase tracking-widest text-slate-500">{field.label}</label>
                      </div>
                      <div className="relative">
                        <input 
                          type="number" value={field.val} onChange={e => field.set(e.target.value)}
                          placeholder="00"
                          className="w-full bg-slate-50 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500/20 border border-neutral-100 text-lg font-bold"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase cursor-pointer" onClick={() => speak(field.unit)}>{field.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div className="mt-8 p-4 rounded-xl bg-red-50 text-red-600 text-xs font-bold flex items-center gap-2 cursor-pointer" onClick={() => speak(error)}>
                  <XCircle size={16} /> {error}
                </div>
              )}

              <div className="mt-10">
                <button 
                  onClick={handleNextStep1}
                  className="w-full bg-emerald-600 text-white font-bold py-5 rounded-2xl shadow-lg hover:bg-emerald-700 hover:shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 group"
                >
                  <span className="tracking-widest uppercase text-sm">{l.btn1t}</span>
                  <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass rounded-[2rem] overflow-hidden shadow-2xl shadow-emerald-900/10 relative"
            >
              {/* Module Background Image */}
              <div className="absolute inset-0 z-0">
                <img 
                  src="https://images.unsplash.com/photo-1534067783941-51c9c23ecefd?auto=format&fit=crop&w=1200&q=80" 
                  alt="Atmospheric Background" 
                  className="w-full h-full object-cover opacity-20"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/80 to-white" />
              </div>

              <div className="relative z-10">
                <div className="h-48 relative overflow-hidden backdrop-blur-sm border-b border-white/20">
                  <div className="absolute inset-0">
                    <img 
                      src="https://images.unsplash.com/photo-1534067783941-51c9c23ecefd?auto=format&fit=crop&w=1200&q=80" 
                      alt="Atmospheric conditions" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-emerald-950/40 to-transparent" />
                  </div>
                  <button 
                    onClick={() => {
                      setStep(1);
                      speak(l.bkTxt);
                    }}
                    className="absolute top-6 right-8 p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-white hover:bg-white/20 transition-all shadow-sm z-20"
                    title={l.bkTxt}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div className="absolute bottom-6 left-8 flex items-center gap-4">
                    <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                      <CloudRain className="text-emerald-300" size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-white cursor-pointer" onClick={() => speak(l.s2t)}>{l.s2t}</h2>
                      <p className="text-sm text-emerald-200 cursor-pointer" onClick={() => speak(l.s2s)}>{l.s2s}</p>
                    </div>
                  </div>
                </div>

                <div className="p-8 md:p-10 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className="bg-slate-50/50 backdrop-blur-sm rounded-2xl p-6 border border-neutral-100">
                    <div className="flex justify-between items-center mb-4 cursor-pointer" onClick={() => speak(l.tmpLbl)}>
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-500">{l.tmpLbl}</label>
                      <span className="text-xl font-bold text-emerald-700 px-3 py-1 bg-white rounded-xl shadow-sm border border-emerald-100">{tmp}°C</span>
                    </div>
                    <input 
                      type="range" min="10" max="50" step="1" value={tmp} 
                      onChange={e => setTmp(parseInt(e.target.value))}
                      className="w-full accent-emerald-600 h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  <div className="bg-emerald-50/50 backdrop-blur-sm rounded-2xl p-6 border border-emerald-100/50 flex items-center justify-between">
                    <div className="flex flex-col gap-1 cursor-pointer" onClick={() => speak(l.rnLbl)}>
                      <label className="text-xs font-bold uppercase tracking-widest text-emerald-800">{l.rnLbl}</label>
                      <p className="text-[10px] text-emerald-600 font-medium">{l.rnAuto}</p>
                    </div>
                    <div className="text-2xl font-black text-emerald-700 font-mono">
                      {rain || '--'} <span className="text-xs font-bold">{l.unitMM}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold uppercase tracking-widest text-emerald-800 cursor-pointer" onClick={() => speak(l.snLbl)}>{l.snLbl}</label>
                  <div className="flex flex-wrap gap-3">
                    {['Kharif', 'Rabi', 'Zaid', 'Perennial'].map((s, idx) => (
                      <button
                        key={s}
                        onClick={() => {
                          setSeason(s);
                          speak(l['sk' + idx]);
                        }}
                        className={`flex-1 min-w-[120px] py-4 rounded-xl font-bold text-xs uppercase transition-all border-2 ${
                          season === s 
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' 
                            : 'bg-white border-neutral-100 text-slate-500 hover:border-emerald-200'
                        }`}
                      >
                        {l['sk' + idx]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold uppercase tracking-widest text-emerald-800 cursor-pointer" onClick={() => speak(l.irLbl)}>{l.irLbl}</label>
                  <div className="flex flex-wrap gap-3">
                    {['Well', 'Canal', 'Rainfed', 'Drip'].map((i, idx) => (
                      <button
                        key={i}
                        onClick={() => {
                          setIrrigation(i);
                          speak(l['ir' + idx]);
                        }}
                        className={`flex-1 min-w-[120px] py-4 rounded-xl font-bold text-xs uppercase transition-all border-2 ${
                          irrigation === i 
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' 
                            : 'bg-white border-neutral-100 text-slate-500 hover:border-emerald-200'
                        }`}
                      >
                        {l['ir' + idx]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-8 p-4 rounded-xl bg-red-50 text-red-600 text-xs font-bold flex items-center gap-2 cursor-pointer" onClick={() => speak(error)}>
                  <XCircle size={16} /> {error}
                </div>
              )}

              <div className="mt-10 flex gap-4">
                <button 
                  onClick={() => setStep(1)}
                  className="flex-1 py-5 rounded-2xl font-bold text-xs uppercase text-slate-500 border border-neutral-200 hover:bg-neutral-50 transition-all flex items-center justify-center gap-2"
                >
                  <ChevronLeft size={18} /> {l.bkTxt}
                </button>
                <button 
                  onClick={handleAnalyze}
                  className="flex-[2] bg-emerald-600 text-white font-bold py-5 rounded-2xl shadow-lg hover:bg-emerald-700 hover:shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 group"
                >
                  <Sparkles size={18} className="animate-pulse" />
                  <span className="tracking-widest uppercase text-sm">{l.anTxt}</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

          {step === 3 && (
            <div className="space-y-8">
              <div className="flex justify-start">
                <button 
                  onClick={() => {
                    setStep(2);
                    speak(l.bkTxt);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl text-xs font-bold text-slate-500 border border-neutral-200 hover:bg-neutral-50 transition-all shadow-sm"
                >
                  <ChevronLeft size={16} /> {l.bkTxt}
                </button>
              </div>
              
              {loading ? (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="glass rounded-[2rem] p-20 text-center flex flex-col items-center justify-center gap-6 shadow-2xl shadow-emerald-900/5"
                >
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
                    <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-600" size={24} />
                  </div>
                  <p className="text-emerald-700 font-bold uppercase tracking-widest text-xs animate-pulse cursor-pointer" onClick={() => speak(l.ltxt)}>{l.ltxt}</p>
                </motion.div>
              ) : result && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-8"
                >
                  {/* Hero Result */}
                    <div className="bg-emerald-800 rounded-[2.5rem] overflow-hidden shadow-2xl relative shadow-emerald-900/20">
                    <div className="absolute inset-0 opacity-20 group">
                      <img 
                        src="https://images.unsplash.com/photo-1595113316349-9fa4eb24f884?auto=format&fit=crop&w=1200&q=80" 
                        alt="Success Crop" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-950 via-emerald-900/40 to-transparent" />
                    <div className="p-8 md:p-12 relative z-10 text-white">
                      <div className="flex items-center gap-2 mb-4 bg-white/10 w-fit px-3 py-1 rounded-full cursor-pointer" onClick={() => speak(l.rht)}>
                        <Sparkles size={14} className="text-emerald-300" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-100">{l.rht}</p>
                      </div>
                      <h3 className="font-display text-4xl md:text-6xl font-black mb-8 cursor-pointer underline decoration-emerald-400" onClick={() => speak(l.crops[result.bestCrop])}>
                        {l.crops[result.bestCrop]} <span className="text-2xl opacity-60 font-medium italic block sm:inline font-sans">({l.fieldStrategy})</span>
                      </h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:bg-white/20 transition-all cursor-pointer" onClick={() => speak(`${l.m1l}: ${l.crops[result.bestCrop]}`)}>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-200 mb-2">{l.m1l}</p>
                          <p className="text-2xl font-bold tracking-tight">{l.crops[result.bestCrop]}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:bg-white/20 transition-all cursor-pointer" onClick={() => speak(`${l.m2l}: ${result.estimatedYield} ${l.unitQ}`)}>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-200 mb-2">{l.m2l}</p>
                          <p className="text-2xl font-bold tracking-tight">{result.estimatedYield} <span className="text-sm font-medium opacity-60">{l.unitQ}</span></p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:bg-white/20 transition-all cursor-pointer" onClick={() => speak(`${l.m3l}: ${result.netProfit} ${l.m3u}`)}>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-200 mb-2">{l.m3l}</p>
                          <p className={`text-2xl font-bold tracking-tight ${result.netProfit >= 0 ? 'text-white' : 'text-red-300'}`}>
                            ₹{Math.abs(result.netProfit).toLocaleString('en-IN')}
                          </p>
                          <p className="text-[10px] font-bold text-emerald-300 mt-1 opacity-60 uppercase tracking-tighter">{l.m3u}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Insights */}
                    <div className="glass rounded-[2rem] p-8 shadow-xl shadow-emerald-900/5">
                      <div className="flex items-center gap-3 mb-6 cursor-pointer" onClick={() => speak(l.sct)}>
                        <Search size={22} className="text-emerald-600" />
                        <h4 className="text-xl font-bold tracking-tight">{l.sct}</h4>
                      </div>
                      
                      <div className="space-y-4">
                        {[
                          { label: l.soilLbl, val: `${l['sn' + SOIL_TYPES.findIndex(s => s.type === soilType)] ?? soilType} → ${l.crops[result.bestCrop]}`, ok: soilType === SPECS[result.bestCrop].soil },
                          { label: l.phLbl, val: `${ph} (${l.phU.split('←→')[0]}: ${SPECS[result.bestCrop].minPH}–${SPECS[result.bestCrop].maxPH})`, ok: ph >= SPECS[result.bestCrop].minPH && ph <= SPECS[result.bestCrop].maxPH },
                          { label: l.optimCheck, val: l.optimVal, ok: true }
                        ].map((check, idx) => (
                          <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-neutral-100 cursor-pointer hover:bg-white transition-colors" onClick={() => speak(check.label)}>
                            {check.ok ? <CheckCircle2 className="text-emerald-600" size={18} /> : <XCircle className="text-red-500" size={18} />}
                            <div>
                              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{check.label}</p>
                              <p className="text-xs font-bold text-slate-700">{check.val}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AI Wisdom */}
                    <div className="glass rounded-[2rem] p-8 shadow-xl shadow-emerald-900/5 flex flex-col">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => speak(l.ait)}>
                          <Sparkles className="text-emerald-600" size={22} />
                          <h4 className="text-xl font-bold tracking-tight">{l.ait}</h4>
                        </div>
                        <button 
                          onClick={() => speak(result.advice)}
                          className="p-2 bg-emerald-100 text-emerald-700 rounded-full hover:bg-emerald-200 transition-all shadow-sm"
                          title={l.radt}
                        >
                          <Volume2 size={16} />
                        </button>
                      </div>
                      
                      <div 
                        className="text-sm leading-relaxed text-slate-600 bg-emerald-50/50 p-6 rounded-2xl flex-grow font-medium whitespace-pre-wrap cursor-pointer"
                        onClick={() => speak(result.advice)}
                      >
                        {result.advice}
                      </div>
                    </div>
                  </div>

                  {/* Financial Overview */}
                  <div className="glass rounded-[2rem] p-8 shadow-xl shadow-emerald-900/5 overflow-hidden">
                    <div className="flex items-center gap-3 mb-6 cursor-pointer" onClick={() => speak(l.ptt)}>
                      <BarChart3 className="text-emerald-600" size={24} />
                      <h4 className="text-xl font-bold tracking-tight">{l.ptt}</h4>
                    </div>
                    
                    <div className="overflow-x-auto -mx-8">
                      <table className="w-full text-left min-w-[600px]">
                        <thead>
                          <tr className="bg-slate-50 border-y border-neutral-100">
                            <th className="px-8 py-4 text-[10px] font-bold uppercase text-slate-400">{l.pc0}</th>
                            <th className="px-4 py-4 text-[10px] font-bold uppercase text-slate-400">{l.pc1} ({l.unitQ})</th>
                            <th className="px-4 py-4 text-[10px] font-bold uppercase text-slate-400">{l.pc2}</th>
                            <th className="px-4 py-4 text-[10px] font-bold uppercase text-slate-400">{l.pc4}</th>
                            <th className="px-8 py-4 text-[10px] font-bold uppercase text-slate-400">{l.pc5}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                          {Object.keys(ECON).map(crop => {
                            const spec = SPECS[crop];
                            const econ = ECON[crop];
                            const landNum = parseFloat(land);
                            
                            let sc = 100;
                            if (soilType !== spec.soil) sc -= 30;
                            if (ph < spec.minPH || ph > spec.maxPH) sc -= 20;

                            const ty = (econ.yld * landNum).toFixed(1);
                            const tc = Math.round(econ.cost * landNum);
                            const tr = Math.round(econ.yld * landNum * econ.msp);
                            const np = tr - tc;
                            const isRec = result.top3.includes(crop);

                            return (
                              <tr 
                                key={crop} 
                                className={`${isRec ? 'bg-emerald-50/50' : ''} hover:bg-neutral-50 transition-colors cursor-pointer group`}
                                onClick={() => speak(`${l.crops[crop]}: ${np} ${l.pc4}`)}
                              >
                                <td className="px-8 py-5 font-bold text-slate-700">
                                  {l.crops[crop]} {isRec && <span className="ml-2 text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full uppercase">{l.aiChoice}</span>}
                                </td>
                                <td className="px-4 py-5 text-sm">{ty}</td>
                                <td className="px-4 py-5 text-sm">₹{tc.toLocaleString('en-IN')}</td>
                                <td className={`px-4 py-5 text-sm font-bold ${np >= 0 ? 'text-emerald-700' : 'text-red-500'}`}>
                                  ₹{Math.abs(np).toLocaleString('en-IN')}
                                </td>
                                <td className="px-8 py-5">
                                  <div className="flex items-center gap-2">
                                    <div className="flex-grow h-1.5 bg-neutral-100 rounded-full overflow-hidden w-20">
                                      <div className={`h-full rounded-full transition-all ${sc >= 70 ? 'bg-emerald-500' : sc >= 40 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${sc}%` }} />
                                    </div>
                                    <span className="text-[10px] font-bold uppercase text-slate-400">
                                      {sc >= 70 ? l.ratingEx : sc >= 40 ? l.ratingFair : l.ratingPoor}
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex gap-4 mt-8">
                    <button 
                      onClick={resetAll}
                      className="flex-1 py-5 rounded-2xl font-bold text-xs uppercase text-slate-500 border border-neutral-200 hover:bg-neutral-50 transition-all"
                    >
                      {l.reTxt}
                    </button>
                    <button 
                      onClick={() => setStep(2)}
                      className="flex-1 bg-emerald-600 text-white font-bold py-5 rounded-2xl shadow-lg hover:bg-emerald-700 hover:shadow-emerald-600/20 transition-all"
                    >
                      {l.modTxt}
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </AnimatePresence>
      </main>

      <footer className="bg-white border-t border-neutral-200 py-12 px-6 text-center cursor-pointer" onClick={() => speak(l.ftxt)}>
        <div className="flex items-center justify-center gap-2 mb-4">
          <Leaf className="text-emerald-600" size={20} />
          <span className="font-serif text-lg font-bold text-emerald-800">{l.appName}</span>
        </div>
        <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-[0.3em] mb-2">{l.arch2025}</p>
        <p className="text-[9px] text-slate-400 uppercase tracking-widest mb-4">{l.expertSys}</p>
        <p className="text-xs text-slate-400 font-medium max-w-md mx-auto leading-relaxed">
          {l.ftxt}
        </p>
      </footer>
    </div>
  );
}
