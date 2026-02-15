
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Priority, Task, AIActionType, Subtask } from "../types";

const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const ensureProModelAccess = async () => {
  const win = window as any;
  if (win.aistudio && typeof win.aistudio.hasSelectedApiKey === 'function') {
    const hasKey = await win.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await win.aistudio.openSelectKey();
    }
  }
};

export const analyzeNewTask = async (title: string, description: string, imageBase64?: string) => {
  const ai = getAIClient();
  const now = new Date();
  const localDate = now.toISOString().split('T')[0];
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });

  const parts: any[] = [
    { text: `Analyze this task creation request. 
    Context: Today is ${dayName}, ${localDate}.
    
    1. Assign Priority (Low, Medium, High, Critical).
    2. Breakdown into 3-5 actionable subtasks.
    3. Extract deadlines (convert to YYYY-MM-DD format).
    4. Extract or suggest relevant tags.
    5. Estimate duration for the WHOLE task and EACH subtask in minutes.
    6. If an image is provided, parse it for context.
    
    Request: "${title}"
    Description: "${description}"` }
  ];

  if (imageBase64) {
    const mimeType = imageBase64.match(/data:([^;]+);base64/)?.[1] || "image/jpeg";
    parts.push({
      inlineData: {
        mimeType: mimeType,
        data: imageBase64.split(',')[1] || imageBase64
      }
    });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          priority: { type: Type.STRING, enum: ["Low", "Medium", "High", "Critical"] },
          estimation: { type: Type.INTEGER, description: "Total task estimation in minutes" },
          subtasks: {
            type: Type.ARRAY,
            items: { 
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                aiAction: { type: Type.STRING, enum: ["content", "code", "image", "none"] },
                estimation: { type: Type.INTEGER, description: "Subtask estimation in minutes" }
              },
              required: ["title", "aiAction", "estimation"]
            }
          },
          deadline: { type: Type.STRING, nullable: true },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          cleanedTitle: { type: Type.STRING },
          cleanedDescription: { type: Type.STRING }
        },
        required: ["priority", "estimation", "subtasks", "cleanedTitle", "cleanedDescription", "tags"]
      }
    }
  });
  
  const json = JSON.parse(response.text || "{}");
  return {
    priority: (json.priority as Priority) || Priority.Medium,
    estimation: json.estimation || 30,
    subtasks: Array.isArray(json.subtasks) ? json.subtasks : [],
    deadline: json.deadline || null,
    tags: Array.isArray(json.tags) ? json.tags : [],
    cleanedTitle: json.cleanedTitle || title,
    cleanedDescription: json.cleanedDescription || description
  };
};

export const suggestSubtasks = async (title: string, description: string): Promise<any[]> => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview", 
    contents: `Break down the following task into 3-5 subtasks with time estimations in minutes.
    Task: ${title}
    Context: ${description}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
             title: { type: Type.STRING },
             aiAction: { type: Type.STRING, enum: ["content", "code", "image", "none"] },
             estimation: { type: Type.INTEGER }
          },
          required: ["title", "aiAction", "estimation"]
        }
      }
    }
  });

  return JSON.parse(response.text || "[]");
};

export const processMeetingNotes = async (rawText: string) => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Process meeting notes into HTML and extract tasks with priorities, deadlines, and time estimations in minutes.
    Notes: "${rawText}"`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          html: { type: Type.STRING },
          extractedTasks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                deadline: { type: Type.STRING },
                priority: { type: Type.STRING, enum: ["Low", "Medium", "High", "Critical"] },
                estimation: { type: Type.INTEGER }
              },
              required: ["title", "priority", "estimation"]
            }
          }
        },
        required: ["html", "extractedTasks"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

export const chatWithCoach = async (task: Task, chatHistory: any[], newMessage: string) => {
  const ai = getAIClient();
  const contents = chatHistory.map(item => ({
    role: item.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: item.content }]
  }));

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: contents,
    config: {
      tools: [{ googleSearch: {} }],
      systemInstruction: `You are an elite productivity coach for "${task.title}". 
      Use Google Search to provide up-to-date resources. 
      Help the user manage their ${task.remainingTime} minutes remaining for this mission.`
    }
  });
  
  const grounding = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const sources = grounding
    .map((chunk: any) => chunk.web ? { title: chunk.web.title, uri: chunk.web.uri } : null)
    .filter(Boolean);

  return {
    text: response.text || "Error communicating with AI.",
    sources
  };
};

export const generateSubtaskContent = async (task: Task, subtask: Subtask): Promise<string> => {
  await ensureProModelAccess();
  const ai = getAIClient();
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Write a detailed, professional draft for: "${subtask.title}". 
    Project Context: ${task.title}.`
  });
  return response.text || "Draft could not be generated.";
};

export const synthesizeProjectHTML = async (task: Task): Promise<string> => {
  const ai = getAIClient();
  const subtasksData = task.subtasks.filter(s => s.content).map(s => `Title: ${s.title}\nContent: ${s.content}`).join('\n---\n');
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Synthesize findings for project: "${task.title}".\n${subtasksData}`,
  });
  return response.text || "<h1>Error</h1>";
};

export const magicFillDescription = async (title: string, currentDesc: string) => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Improve this description for "${title}": ${currentDesc}`,
  });
  return response.text || currentDesc;
};
