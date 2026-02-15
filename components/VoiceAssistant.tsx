
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality, Type, LiveServerMessage } from '@google/genai';
import { Task, Priority, ColumnId } from '../types';
import { XIcon, MicIcon, SparklesIcon, CheckIcon, BrainCircuitIcon } from './Icons';

interface VoiceAssistantProps {
  onAddTasks: (tasks: Task[]) => void;
  onClose: () => void;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ onAddTasks, onClose }) => {
  const [isListening, setIsListening] = useState(false);
  const [extractedTasks, setExtractedTasks] = useState<any[]>([]);
  const [transcription, setTranscription] = useState('');
  const [status, setStatus] = useState<'idle' | 'listening' | 'processing'>('idle');
  const [error, setError] = useState<string | null>(null);
  
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const transcriptionRef = useRef('');

  const encode = (bytes: Uint8Array) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      const byte = bytes[i];
      if (byte !== undefined) {
        binary += String.fromCharCode(byte);
      }
    }
    return btoa(binary);
  };

  const createBlob = (data: Float32Array) => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      const sample = data[i];
      if (sample !== undefined) {
        int16[i] = sample * 32768;
      }
    }
    return {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  };

  const startListening = async () => {
    try {
      setError(null);
      setTranscription('');
      transcriptionRef.current = '';
      setExtractedTasks([]);
      setIsListening(true);
      setStatus('listening');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            audioContextRef.current = audioCtx;
            const source = audioCtx.createMediaStreamSource(stream);
            const scriptProcessor = audioCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
             if (message.serverContent?.inputTranscription) {
                const text = message.serverContent.inputTranscription.text;
                transcriptionRef.current += text;
                setTranscription(transcriptionRef.current);
             }
          },
          onerror: (e) => {
            console.error("Live Error:", e);
            setError("Connection lost. Please try again.");
            stopListening();
          },
          onclose: () => setIsListening(false)
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          systemInstruction: 'You are a task extraction engine. Transcribe accurately.'
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (e: any) {
      setError(e.message || "Failed to access microphone.");
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    if (audioContextRef.current) audioContextRef.current.close();
    if (sessionRef.current) sessionRef.current.close();
    setIsListening(false);
    const finalTranscript = transcriptionRef.current.trim();
    if (finalTranscript.length < 3) {
      setError("No tasks detected.");
      setStatus('idle');
      return;
    }
    setStatus('processing');
    handleFinalExtraction(finalTranscript);
  };

  const handleFinalExtraction = async (transcript: string) => {
    setStatus('processing');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `EXTRACT TASKS WITH ESTIMATIONS:
        TRANSCRIPT: "${transcript}"
        RULES: Return JSON array of {title, priority, deadline, estimation (min)}.`,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        priority: { type: Type.STRING, enum: ['Low', 'Medium', 'High', 'Critical'] },
                        deadline: { type: Type.STRING, nullable: true },
                        estimation: { type: Type.INTEGER }
                    },
                    required: ['title', 'priority', 'estimation']
                }
            }
        }
      });
      const tasks = JSON.parse(response.text || '[]');
      if (tasks.length === 0) setError("No tasks found.");
      setExtractedTasks(tasks);
    } catch (e) {
      setError("Analysis failed.");
    } finally {
      setStatus('idle');
    }
  };

  const handleCommit = () => {
    const finalTasks: Task[] = extractedTasks.map(t => {
      let p = Priority.Medium;
      if (t.priority === 'Low') p = Priority.Low;
      if (t.priority === 'High') p = Priority.High;
      if (t.priority === 'Critical') p = Priority.Critical;
      return {
        id: crypto.randomUUID(),
        title: t.title || "Untitled Mission",
        description: "Voice capture.",
        priority: p,
        columnId: ColumnId.Todo,
        subtasks: [],
        images: [],
        comments: [],
        attachments: [],
        tags: ['#voice'],
        deadline: t.deadline && t.deadline !== 'null' ? new Date(t.deadline).getTime() : undefined,
        createdAt: Date.now(),
        estimation: t.estimation || 30,
        remainingTime: t.estimation || 30
      };
    });
    onAddTasks(finalTasks);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[300] bg-stone-950 flex flex-col items-center justify-center p-8 animate-in fade-in duration-700 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.1),transparent_70%)]" />
      </div>
      <button onClick={onClose} className="absolute top-10 right-10 p-4 text-stone-600 hover:text-white transition-all z-50">
        <XIcon className="w-10 h-10" />
      </button>
      <div className="max-w-3xl w-full flex flex-col items-center gap-12 text-center z-10">
        <div className="h-20 flex items-center justify-center w-full">
            {transcription && (
                <div className="px-8 py-4 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 text-white/90 text-lg font-medium animate-in slide-in-from-bottom-2">
                    "{transcription}"
                </div>
            )}
        </div>
        <div className="relative w-64 h-64 flex items-center justify-center">
            <div className={`absolute inset-0 bg-indigo-500/20 blur-[100px] rounded-full transition-all duration-1000 ${isListening ? 'scale-150' : 'scale-100'}`} />
            <div className={`w-40 h-40 rounded-full flex items-center justify-center transition-all duration-700 relative overflow-hidden group shadow-[0_0_80px_rgba(79,70,229,0.3)] ${isListening ? 'scale-110' : 'scale-100'}`}
                style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #06B6D4 100%)', animation: isListening ? 'hueRotate 4s infinite linear' : 'none' }}>
                <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />
                <div className="relative z-10">
                    {status === 'processing' ? <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" /> : 
                     isListening ? <div className="flex items-center gap-1.5 h-12">
                        {[1,2,3,4,5,6,7].map(i => <div key={i} className="w-1.5 bg-white rounded-full animate-pulse" style={{ height: `${Math.random() * 50 + 20}%`, animationDuration: `${Math.random() * 0.5 + 0.5}s` }} />)}
                     </div> : <MicIcon className="w-14 h-14 text-white drop-shadow-lg" />}
                </div>
            </div>
            {isListening && <><div className="absolute inset-[-20px] border border-indigo-500/20 rounded-full animate-[spin_10s_linear_infinite]" /><div className="absolute inset-[-40px] border border-violet-500/10 rounded-full animate-[spin_15s_linear_infinite_reverse]" /></>}
        </div>
        <div className="space-y-4">
            <h2 className="text-5xl font-black text-white tracking-tight">
                {status === 'listening' ? 'Listening...' : status === 'processing' ? 'Calculating...' : 'Gemini Omni-Voice'}
            </h2>
            <p className="text-stone-500 text-xl font-medium">One or multiple tasks. Just say it.</p>
        </div>
        {error && <div className="px-8 py-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-3xl text-sm font-bold animate-in shake">{error}</div>}
        {extractedTasks.length > 0 && status === 'idle' && (
            <div className="w-full bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-10 space-y-8 animate-in slide-in-from-bottom-6 duration-700 shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/5 pb-6">
                    <div className="flex items-center gap-3">
                        <SparklesIcon className="w-5 h-5 text-indigo-400" />
                        <span className="text-[11px] font-black uppercase text-stone-400 tracking-[0.4em]">Ready to Sync</span>
                    </div>
                    <span className="px-4 py-1.5 bg-indigo-500/20 text-indigo-400 rounded-full text-xs font-black">{extractedTasks.length} Missions</span>
                </div>
                <div className="space-y-4 max-h-60 overflow-y-auto custom-scrollbar pr-4">
                    {extractedTasks.map((t, i) => (
                        <div key={i} className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5 transition-all hover:bg-white/10 group">
                            <div className="flex flex-col items-start gap-1">
                                <span className="text-lg font-bold text-white text-left group-hover:text-indigo-400 transition-colors">{t.title}</span>
                                <div className="flex items-center gap-3">
                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${t.priority === 'Critical' ? 'bg-rose-500/20 text-rose-400' : 'bg-stone-800 text-stone-500'}`}>{t.priority}</span>
                                    <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">Est: {t.estimation} min</span>
                                </div>
                            </div>
                            <CheckIcon className="w-6 h-6 text-emerald-500 opacity-50" />
                        </div>
                    ))}
                </div>
                <button onClick={handleCommit} className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm shadow-2xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-4">
                    <CheckIcon className="w-6 h-6" /> Commit Tasks to Board
                </button>
            </div>
        )}
        <div className="flex items-center gap-6">
            {!isListening ? <button onClick={startListening} disabled={status === 'processing'} className="px-16 py-6 bg-white text-stone-950 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-sm shadow-2xl hover:scale-110 transition-all flex items-center gap-4 disabled:opacity-50"><MicIcon className="w-6 h-6" /> Start Recording</button> : 
             <button onClick={stopListening} className="px-16 py-6 bg-rose-600 text-white rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-sm shadow-2xl hover:scale-110 transition-all flex items-center gap-4 animate-pulse"><div className="w-3 h-3 rounded-full bg-white" /> Stop & Sync</button>}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes hueRotate { 0% { filter: hue-rotate(0deg); } 100% { filter: hue-rotate(360deg); } } .custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }`}} />
    </div>
  );
};
