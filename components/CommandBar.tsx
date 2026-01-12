
import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, ArrowRight, X, Check, Loader2, ScanLine, Camera, RefreshCcw, Mic, MicOff } from 'lucide-react';
import { parseNaturalLanguage, analyzeReceipt } from '../geminiService.ts';
import { AIResponse, Transaction } from '../types.ts';

interface CommandBarProps {
  onRecord: (tx: Omit<Transaction, "id" | "user_id" | "account_id">) => void;
  context: string;
}

export const CommandBar: React.FC<CommandBarProps> = ({ onRecord, context }) => {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState<AIResponse | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [exampleIndex, setExampleIndex] = useState(0);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const examples = [
    "Sold 3 fish for 5000",
    "Paid rent 200k",
    "Lent 10k to Sam",
    "Bought chicken feed 50k",
    "Customer paid 15k debt",
    "Sold lunch for 8000",
    "Paid electricity bill 40k"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setExampleIndex((prev) => (prev + 1) % examples.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };

    recognition.start();
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    setLoading(true);
    try {
      const result = await parseNaturalLanguage(input, context);
      if (result.intent === 'RECORD' && result.transaction) {
        setParsed(result);
      } else if (result.intent === 'QUERY') {
        alert(result.query_answer || "I couldn't find an answer for that.");
        setInput("");
      } else {
        alert("Sorry, I didn't catch that. Try 'Sold item for 5000'");
      }
    } catch (err) {
      alert("Something went wrong with the AI assistant.");
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false 
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraOpen(true);
    } catch (err) {
      alert("Could not access camera. Check permissions.");
      console.error(err);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      const MAX_WIDTH = 1024;
      const scale = Math.min(1, MAX_WIDTH / video.videoWidth);
      canvas.width = video.videoWidth * scale;
      canvas.height = video.videoHeight * scale;
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL('image/jpeg', 0.75).split(',')[1];
      
      stopCamera();
      setLoading(true);
      
      try {
        const result = await analyzeReceipt(base64);
        if (result.transaction) {
          setParsed(result);
        } else {
          alert("Couldn't read receipt. Try typing details.");
        }
      } catch (err) {
        alert("Error analyzing image.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleConfirm = () => {
    if (parsed?.transaction) {
      onRecord({
        ...parsed.transaction,
        date: new Date().toISOString()
      });
      setParsed(null);
      setInput("");
    }
  };

  const handleCancel = () => {
    setParsed(null);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 safe-pb z-50 pointer-events-none">
      <div className="max-w-md mx-auto relative pointer-events-auto">
        
        {/* Camera Modal Overlay */}
        {isCameraOpen && (
          <div className="fixed inset-0 bg-black z-[60] flex flex-col items-center justify-center p-6">
            <div className="relative w-full aspect-[3/4] rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none">
                <div className="w-full h-full border-2 border-white/30 rounded-xl border-dashed"></div>
              </div>
              <div className="absolute top-4 left-0 right-0 text-center">
                <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest">Align receipt inside frame</p>
              </div>
            </div>

            <div className="mt-12 flex items-center justify-between w-full px-8">
              <button onClick={stopCamera} className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white">
                <X className="w-6 h-6" />
              </button>
              <button onClick={capturePhoto} className="w-20 h-20 rounded-full border-4 border-white p-1 flex items-center justify-center active:scale-90 transition-all">
                <div className="w-full h-full bg-white rounded-full"></div>
              </button>
              <div className="w-12 h-12"></div>
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        {/* Upper Action Layer: Snap */}
        {!parsed && !loading && !isCameraOpen && (
          <div className="mb-2 flex justify-center animate-slide-up">
            <button
              type="button"
              onClick={startCamera}
              className="bg-white border-2 border-indigo-100 px-5 py-2.5 rounded-full flex items-center space-x-3 shadow-lg shadow-indigo-100/50 active:scale-95 transition-all group"
            >
              <div className="bg-indigo-600 p-1.5 rounded-lg group-active:rotate-12 transition-transform">
                <Camera className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <span className="block text-xs font-extrabold text-indigo-600 leading-none">Snap Receipt</span>
              </div>
            </button>
          </div>
        )}

        {/* The Auto-Scrolling Hint - Directly above the bar */}
        {!parsed && !loading && !isCameraOpen && (
          <div className="h-6 flex items-center justify-center mb-1 overflow-hidden">
            <p key={exampleIndex} className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest animate-hint flex items-center">
              <Sparkles className="w-3 h-3 mr-1 text-indigo-300" />
              Try: "{examples[exampleIndex]}"
            </p>
          </div>
        )}

        {parsed && (
          <div className="absolute bottom-full left-0 right-0 mb-4 animate-slide-up">
            <div className="bg-white border-2 border-indigo-500 rounded-3xl p-5 shadow-2xl">
              <div className="flex items-center space-x-2 mb-2">
                <div className="bg-emerald-100 p-1 rounded-md">
                   <Check className="w-3 h-3 text-emerald-600" />
                </div>
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Extracted Instantly</p>
              </div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-lg font-bold text-slate-800">{parsed.transaction?.description}</h4>
                  <p className="text-sm text-slate-500">{parsed.transaction?.category} • {parsed.transaction?.type}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-extrabold text-indigo-600 underline">
                    {parsed.transaction?.amount}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={handleCancel} className="flex items-center justify-center space-x-2 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold active:scale-95 transition-all">
                  <X className="w-5 h-5" />
                  <span>Discard</span>
                </button>
                <button onClick={handleConfirm} className="flex items-center justify-center space-x-2 py-3 bg-indigo-600 text-white rounded-2xl font-bold active:scale-95 transition-all shadow-lg shadow-indigo-200">
                  <Check className="w-5 h-5" />
                  <span>Confirm</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <form 
          onSubmit={handleSubmit}
          className={`flex items-center bg-indigo-600 rounded-full p-1.5 shadow-xl shadow-indigo-100 border border-white/20 ring-4 ring-indigo-500/10 transition-all duration-300 ${loading ? 'opacity-90' : 'opacity-100'}`}
        >
          <div className="flex-1 flex items-center px-4">
            {loading ? (
              <div className="flex items-center mr-3">
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              </div>
            ) : isListening ? (
              <div className="w-5 h-5 flex items-center justify-center mr-3 relative">
                <div className="absolute inset-0 bg-red-400 rounded-full animate-ping opacity-50"></div>
                <Mic className="w-5 h-5 text-white relative z-10" />
              </div>
            ) : (
              <Sparkles className="w-5 h-5 text-indigo-200 mr-3" />
            )}
            <input 
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? "Listening..." : loading ? "Extracting..." : "Describe transaction..."}
              className="w-full bg-transparent border-none focus:outline-none text-white placeholder-indigo-200 text-sm py-2"
              disabled={loading || !!parsed || isCameraOpen}
            />
          </div>
          
          <div className="flex items-center space-x-1.5 pr-1">
            <button
              type="button"
              onClick={startListening}
              disabled={loading || !!parsed || isCameraOpen}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm ${
                isListening 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'bg-indigo-400 text-white hover:bg-indigo-300 active:scale-90 border border-white/20'
              }`}
              title="Voice Input"
            >
              <Mic className="w-6 h-6" />
            </button>
            <button 
              type="submit"
              disabled={loading || !input.trim() || !!parsed || isCameraOpen}
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-indigo-600 active:scale-90 transition-all disabled:opacity-50 shadow-sm"
              title="Send"
            >
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};