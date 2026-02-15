
import React from 'react';
// Added PlusIcon to imports to fix "Cannot find name 'PlusIcon'" error
import { XIcon, DownloadIcon, FileTextIcon, SparklesIcon, WandIcon, UsersIcon, LayoutGridIcon, ClockIcon, PlusIcon } from './Icons';

interface DocumentationModalProps {
  onClose: () => void;
}

export const DocumentationModal: React.FC<DocumentationModalProps> = ({ onClose }) => {
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>MindDrop - Elite Productivity Guide</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 60px; color: #1c1917; line-height: 1.7; max-width: 850px; margin: 0 auto; background: #fff; }
            h1 { color: #4f46e5; border-bottom: 4px solid #f5f5f4; padding-bottom: 20px; font-size: 36px; font-weight: 900; letter-spacing: -0.02em; }
            h2 { color: #1c1917; margin-top: 50px; border-left: 6px solid #4f46e5; padding-left: 20px; font-size: 26px; font-weight: 800; }
            h3 { color: #6366f1; margin-top: 30px; font-size: 20px; font-weight: 700; }
            p { font-size: 15px; margin-bottom: 20px; color: #44403c; }
            ul { padding-left: 25px; margin-bottom: 25px; }
            li { margin-bottom: 12px; font-size: 15px; }
            b { color: #000; font-weight: 700; }
            
            .badge { display: inline-block; background: #4f46e5; color: #fff; padding: 6px 14px; border-radius: 99px; font-size: 11px; font-weight: 900; text-transform: uppercase; margin-bottom: 20px; letter-spacing: 0.1em; }
            .figure { background: #fafaf9; border: 1px solid #e7e5e4; border-radius: 16px; padding: 24px; margin: 30px 0; position: relative; overflow: hidden; }
            .figure-label { position: absolute; top: 0; right: 0; background: #e7e5e4; padding: 4px 12px; font-size: 10px; font-weight: 800; text-transform: uppercase; color: #78716c; border-bottom-left-radius: 12px; }
            .screenshot-mock { background: #fff; border: 1px solid #d6d3d1; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); padding: 15px; }
            
            .sample-box { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 12px; margin: 20px 0; }
            .sample-title { font-weight: 800; color: #166534; font-size: 12px; text-transform: uppercase; margin-bottom: 10px; display: block; }
            
            .ai-chat-mock { display: flex; flex-direction: column; gap: 10px; }
            .bubble { padding: 10px 15px; border-radius: 12px; font-size: 13px; max-width: 80%; }
            .bubble.user { background: #4f46e5; color: #fff; align-self: flex-end; }
            .bubble.ai { background: #f3f4f6; color: #374151; align-self: flex-start; border: 1px solid #e5e7eb; }
            
            .footer { margin-top: 80px; font-size: 12px; color: #a8a29e; text-align: center; border-top: 2px solid #f5f5f4; padding-top: 40px; font-weight: 600; letter-spacing: 0.05em; }
            
            @media print {
                body { padding: 40px; }
                .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="badge">Master Systems Manual v3.0</div>
          <h1>MindDrop Elite: Full System Walkthrough</h1>
          <p>Welcome to the comprehensive guide for <b>MindDrop</b>, your AI-augmented project engine. This manual details every module, from intelligence-gathering to high-velocity execution.</p>
          
          <h2>1. Getting Started: The "Drop"</h2>
          <p>Task creation in MindDrop isn't just about typing text; it's about providing intent. Our <b>Gemini 3 Flash</b> engine handles the heavy lifting of organization.</p>
          
          <div class="figure">
            <div class="figure-label">Interactive Screenshot: Task Input</div>
            <div class="screenshot-mock">
              <div style="display:flex; align-items:center; gap:10px; border:1px solid #eee; padding:10px; border-radius:8px;">
                <span style="color:#a8a29e;">What's on your mind?</span>
                <div style="flex:1"></div>
                <div style="width:20px; height:20px; background:#4f46e5; border-radius:4px;"></div>
              </div>
            </div>
            <p style="margin-top:15px; font-size:13px; font-style:italic;">Use the <b>Image Icon</b> to upload photos of sketches, handwritten notes, or whiteboards for automatic OCR processing.</p>
          </div>

          <div class="sample-box">
            <span class="sample-title">Entry Scenario: "Magic" Extraction</span>
            <p style="margin-bottom:0;"><b>User Input:</b> "Fix the quarterly budget by next Tuesday #finance #work"</p>
            <p style="margin-top:10px; margin-bottom:0;"><b>AI Result:</b></p>
            <ul style="margin-top:5px;">
              <li><b>Priority:</b> Critical</li>
              <li><b>Deadline:</b> Set to [Upcoming Tuesday]</li>
              <li><b>Tags:</b> finance, work</li>
              <li><b>Subtasks:</b> 1. Audit current spend, 2. Identify 5% variance, 3. Sync with CFO.</li>
            </ul>
          </div>

          <h2>2. Workspace Execution: Kanban & Focus</h2>
          <p>Your tasks reside in a 3-column system: <b>Todo, Ongoing, Done</b>. This hierarchy ensures you never lose sight of active missions.</p>
          
          <h3>2.1. Focus Mode (The Deep Work Zone)</h3>
          <p>By clicking the <b>Wand Icon</b> in the header, the system identifies your highest-impact task and enters an immersive state.</p>
          <ul>
            <li><b>Pomodoro Timer:</b> Auto-cycles between 25m work and 5m recovery.</li>
            <li><b>Pulse Ambience:</b> Subtle visual animations to maintain cognitive flow.</li>
            <li><b>Subtask Tracking:</b> Check off roadmap items directly within the immersion view.</li>
          </ul>

          <h2>3. The Meeting Studio: Raw Data to Strategy</h2>
          <p>This is where "Minutes" become "Action." Paste any transcript or messy notes to generate a professional record.</p>

          <div class="figure">
            <div class="figure-label">Walkthrough: Meeting Synthesis</div>
            <div class="ai-chat-mock">
               <p style="font-size:12px; font-weight:800; color:#4f46e5;">STEP 1: PASTE NOTES</p>
               <div class="bubble ai" style="width:100%; font-family:monospace; font-size:11px;">
                 Dave said budget is tight. Sarah wants new hiring by Oct. Action: Sarah to email HR. We decided to cancel the Vegas retreat.
               </div>
               <p style="font-size:12px; font-weight:800; color:#4f46e5; margin-top:10px;">STEP 2: AI RESTRUCTURING</p>
               <div class="screenshot-mock" style="background:#fff; border-left:4px solid #4f46e5;">
                 <h4 style="margin:0; font-size:16px;">Quarterly Strategy Sync</h4>
                 <p style="font-size:12px;"><b>Decisions:</b> Retreat cancelled.</p>
                 <p style="font-size:12px;"><b>Action Items:</b> [ + ] Sarah: Email HR (Due: Friday)</p>
               </div>
            </div>
            <p style="margin-top:15px; font-size:13px; font-style:italic;">Click the <b>[ + ]</b> icon next to any extracted action to instantly sync it as a real task on your Kanban board.</p>
          </div>

          <h2>4. AI Productivity Coach</h2>
          <p>Every task has its own dedicated advisor. Powered by <b>Google Search Grounding</b>, the coach doesn't just "chat"—it researches.</p>
          
          <div class="sample-box" style="background:#eef2ff; border-color:#c7d2fe;">
            <span class="sample-title" style="color:#4338ca;">Coach Conversation Example</span>
            <div class="ai-chat-mock">
               <div class="bubble user">What are the current industry benchmarks for SaaS conversion rates?</div>
               <div class="bubble ai">
                 According to recent 2024 data (see source 1, 2), the average B2B SaaS conversion rate is currently 2.1-3.5%. For your "Marketing Task", I recommend optimizing the landing page CTA...
               </div>
            </div>
          </div>

          <h2>5. Advanced Planning View</h2>
          <p>Toggle to the <b>Timeline</b> view to see your workload spread across the month. Drag and drop tasks onto specific dates to reschedule them automatically.</p>
          <ul>
            <li><b>Automatic Reminders:</b> The system scans deadlines every 5 minutes and triggers a system-level notification 7 days before a task is due.</li>
            <li><b>High-Fidelity Export:</b> At any point, use the Print function to generate a PDF of your progress for reporting to stakeholders.</li>
          </ul>

          <div class="footer">
            CONFIDENTIAL | Generated by MindDrop Intelligence Studio | &copy; 2024
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 sm:p-8 animate-in fade-in duration-300" onClick={onClose}>
      <div className="bg-white dark:bg-stone-900 w-full max-w-5xl h-[92vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden border border-stone-200 dark:border-white/5" onClick={e => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-10 py-8 border-b border-stone-100 dark:border-white/5 bg-white dark:bg-stone-900 shrink-0">
          <div className="flex items-center gap-5">
             <div className="w-14 h-14 bg-indigo-600 rounded-2xl text-white shadow-xl flex items-center justify-center">
                <FileTextIcon className="w-8 h-8" />
             </div>
             <div>
                <h2 className="text-2xl font-black text-stone-900 dark:text-white tracking-tight">Systems Manual</h2>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-black bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 px-2 py-0.5 rounded-md uppercase tracking-wider">v3.0.4</span>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">High-Fidelity Product Specification</span>
                </div>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={handlePrint} className="flex items-center gap-3 px-8 py-4 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-[1.25rem] text-[12px] font-black uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all">
                <DownloadIcon className="w-5 h-5" /> Export PDF Guide
             </button>
             <button onClick={onClose} className="p-4 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-2xl text-stone-400 transition-all">
                <XIcon className="w-7 h-7" />
             </button>
          </div>
        </div>

        {/* The "Virtual Paper" container with enhanced UI-Mockups */}
        <div className="flex-1 overflow-y-auto bg-stone-100 dark:bg-stone-950 p-8 sm:p-16 flex justify-center no-scrollbar">
           <div className="bg-white dark:bg-stone-900 w-full max-w-[850px] min-h-full shadow-2xl rounded-xl p-12 sm:p-20 border border-stone-200 dark:border-white/5 prose prose-stone dark:prose-invert">
              
              <div className="flex justify-between items-start mb-12 border-b-2 border-stone-50 dark:border-white/5 pb-8">
                <div>
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.5em] mb-2 block">MindDrop Intelligence</span>
                    <h1 className="text-5xl font-black m-0 tracking-tighter">Product Guide</h1>
                </div>
                <div className="text-right text-[11px] font-bold text-stone-300 uppercase leading-relaxed">
                    Corporate Systems<br/>2024 v3.0 Release
                </div>
              </div>
              
              <h2 className="flex items-center gap-3"><SparklesIcon className="w-6 h-6 text-indigo-500" /> 1. AI Intent Analysis</h2>
              <p>MindDrop utilizes multi-modal analysis to reduce task fragmentation. Whether you paste a paragraph or upload a photo, the <b>Intelligence Layer</b> extracts structure from chaos.</p>
              
              <div className="not-prose bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-white/5 p-6 rounded-2xl my-8">
                 <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Sample entry: Vision OCR</span>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-stone-200 dark:bg-stone-900 rounded-lg aspect-square flex items-center justify-center text-stone-400 text-[10px] font-bold p-4 text-center border-2 border-dashed border-stone-300">
                        IMAGE UPLOAD:<br/>"Handwritten Sticky Note"
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="h-6 w-full bg-indigo-100 dark:bg-indigo-900/30 rounded"></div>
                        <div className="h-4 w-3/4 bg-stone-100 dark:bg-stone-800 rounded"></div>
                        <div className="mt-2 flex gap-2">
                           <div className="h-4 w-12 bg-emerald-100 dark:bg-emerald-900/30 rounded"></div>
                           <div className="h-4 w-12 bg-blue-100 dark:bg-blue-900/30 rounded"></div>
                        </div>
                    </div>
                 </div>
                 <p className="mt-4 text-[11px] text-stone-500 font-medium">Fig A. Handwriting detected: "Call Mike tomorrow regarding project alpha #urgent". AI auto-creates task with Tomorrow's date and Critical priority.</p>
              </div>

              <h2 className="flex items-center gap-3"><UsersIcon className="w-6 h-6 text-indigo-500" /> 2. Meeting Studio Walkthrough</h2>
              <p>Convert unstructured discussions into professional assets. The Meeting Studio is designed for consistency across your entire organization.</p>
              
              <div className="not-prose border-2 border-stone-100 dark:border-white/5 rounded-3xl p-8 my-8 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-5">
                    <UsersIcon className="w-20 h-20" />
                 </div>
                 <h3 className="text-xl font-black mt-0 mb-4">How to Generate Minutes:</h3>
                 <ol className="text-sm space-y-4">
                    <li><b>Navigate:</b> Click the <UsersIcon className="w-4 h-4 inline mx-1" /> icon in the top header.</li>
                    <li><b>Input:</b> Paste raw speaker transcripts or messy notes into the main text area.</li>
                    <li><b>Analyze:</b> Click "Process Meeting Minutes". AI generates a structured HTML document.</li>
                    <li><b>Sync:</b> Review "Extracted Actions" on the sidebar. Click <PlusIcon className="w-4 h-4 inline mx-1" /> to sync tasks to your Board.</li>
                 </ol>
              </div>

              <h2 className="flex items-center gap-3"><WandIcon className="w-6 h-6 text-indigo-500" /> 3. Deep Work & Focus</h2>
              <p>Eliminate cognitive residue using the integrated <b>Focus Mode</b>. This feature suppresses all system distractions, leaving only your roadmap and a countdown.</p>
              
              <div className="not-prose bg-stone-900 text-stone-100 p-8 rounded-3xl my-8 text-center shadow-2xl">
                 <div className="w-24 h-24 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin mx-auto mb-6"></div>
                 <h4 className="text-2xl font-black mb-2">24:59</h4>
                 <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-500">DEEP WORK IN PROGRESS</p>
                 <div className="mt-6 flex justify-center gap-4">
                    <div className="px-6 py-2 bg-indigo-600 rounded-full text-[10px] font-black uppercase">Current Mission: System Audit</div>
                 </div>
              </div>

              <h2 className="flex items-center gap-3"><LayoutGridIcon className="w-6 h-6 text-indigo-500" /> 4. Planning & Infrastructure</h2>
              <p>Toggle the <b>Timeline</b> <ClockIcon className="w-4 h-4 inline mx-1" /> view to access a professional grid-based calendar. Dragging tasks between days updates their persistence state across all synced devices via Firebase.</p>

              <div className="mt-20 pt-10 border-t-4 border-stone-100 dark:border-white/5 flex justify-between items-end">
                <div>
                   <p className="text-[10px] font-black uppercase text-stone-400 tracking-[0.3em] m-0">End of Specification</p>
                   <p className="text-[9px] font-bold text-stone-300 m-0 italic">Authorized Use Only</p>
                </div>
                <div className="w-12 h-12 bg-stone-100 dark:bg-stone-800 rounded-xl flex items-center justify-center">
                    <SparklesIcon className="w-6 h-6 text-stone-300" />
                </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
