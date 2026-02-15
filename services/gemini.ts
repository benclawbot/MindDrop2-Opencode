
import { GoogleGenAI, Type, Chat } from "@google/genai";
import { AspectRatio, ImageSize, Priority, Task, AIActionType } from "../types";

// Helper to get the correct API client following guidelines
const getAIClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

interface SubtaskSuggestion {
  title: string;
  aiAction: AIActionType;
}

interface TaskAnalysisResult {
  priority: Priority;
  subtasks: SubtaskSuggestion[];
  deadline: string | null;
  tags: string[];
  cleanedTitle: string;
  cleanedDescription: string;
}

// Reusable schema configuration
const TASK_ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    priority: {
      type: Type.STRING,
      enum: ["Low", "Medium", "High", "Critical"]
    },
    subtasks: {
      type: Type.ARRAY,
      items: { 
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          aiAction: { type: Type.STRING, enum: ["content", "code", "image", "none"] }
        },
        required: ["title", "aiAction"]
      }
    },
    deadline: {
      type: Type.STRING,
      nullable: true,
      description: "YYYY-MM-DD format or null"
    },
    tags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "STRICTLY include words explicitly marked with a # in the input text. NEVER invent new tags based on context."
    },
    cleanedTitle: {
      type: Type.STRING,
      description: "Title with date mentions and hashtags removed"
    },
    cleanedDescription: {
      type: Type.STRING,
      description: "Description with date mentions and hashtags removed"
    }
  },
  required: ["priority", "subtasks", "cleanedTitle", "cleanedDescription", "tags"]
};

const getLocalDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export const analyzeNewTask = async (title: string, description: string): Promise<TaskAnalysisResult> => {
  try {
    const ai = getAIClient();
    const localDate = getLocalDate();

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the following task. 
      1. Assign a priority level (Low, Medium, High, or Critical).
      2. Break it down into 3-5 actionable subtasks.
      3. For EACH subtask, determine if AI can help generate the output.
      4. Extract any date or time mentions into YYYY-MM-DD format (today: ${localDate}).
      5. STRICTLY Extract tags ONLY if they are marked with a # in the input. DO NOT guess or create contextual tags like "work" or "personal" unless the user explicitly used #work or #personal.
      6. Return 'cleanedTitle' and 'cleanedDescription' with date mentions and hashtags REMOVED. 
      
      Task Title: "${title}"
      Task Description: "${description}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: TASK_ANALYSIS_SCHEMA
      }
    });
    
    // Fixed: response.text is a property, not a method
    const json = JSON.parse(response.text || "{}");
    return {
      priority: (json.priority as Priority) || Priority.Medium,
      subtasks: Array.isArray(json.subtasks) ? json.subtasks : [],
      deadline: json.deadline || null,
      tags: Array.isArray(json.tags) ? json.tags : [],
      cleanedTitle: json.cleanedTitle || title,
      cleanedDescription: json.cleanedDescription || description
    };
  } catch (error) {
    console.error("Task analysis failed:", error);
    return { 
        priority: Priority.Medium, 
        subtasks: [], 
        deadline: null, 
        tags: [],
        cleanedTitle: title, 
        cleanedDescription: description 
    }; 
  }
};

export const suggestSubtasks = async (title: string, description: string): Promise<SubtaskSuggestion[]> => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: `Break down the following task into 3-5 actionable subtasks.
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
               aiAction: { type: Type.STRING, enum: ["content", "code", "image", "none"] }
            },
            required: ["title", "aiAction"]
          }
        }
      }
    });

    // Fixed: response.text is a property
    const json = JSON.parse(response.text || "[]");
    return Array.isArray(json) ? json : [];
  } catch (error) {
    console.error("Subtask generation failed:", error);
    return [];
  }
};

export const generateTaskImage = async (
  prompt: string,
  aspectRatio: AspectRatio,
  imageSize: ImageSize
): Promise<string | null> => {
  try {
    const win = window as any;
    if (win.aistudio && win.aistudio.hasSelectedApiKey) {
      const hasKey = await win.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await win.aistudio.openSelectKey();
      }
    }

    const ai = getAIClient();

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
          imageSize: imageSize
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;

  } catch (error) {
    console.error("Image generation failed:", error);
    throw error;
  }
};

export const getTaskChatSession = (task: Task): Chat => {
  const ai = getAIClient();
  return ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: `You are a helpful AI project manager and productivity coach assisting with a specific task.
      
      Current Task Context:
      Title: ${task.title}
      Description: ${task.description}
      Priority: ${task.priority}
      Status: ${task.columnId}
      Subtasks: ${task.subtasks.map(s => `- ${s.title} (${s.completed ? 'Done' : 'Pending'})`).join('\n')}
      
      Provide concise, actionable advice. Help the user break down problems, suggest resources, or draft content.`,
    }
  });
};
