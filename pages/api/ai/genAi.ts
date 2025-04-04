import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

const openai = (content: string) => ai.models.generateContent({
    model: "gemini-2.0-flash",
    // contents: content
    contents: `Hãy trả lời bằng tiếng Việt. Chấm điểm bài viết theo các tiêu chí chuẩn SEO thang điểm 10 cho bài viết: ` + 
    content + `
    nêu điểm số và lý do cho từng tiêu chí.`
  });

export const callToGenmini = async (content: string) => {
    const completion = await openai(content);
    
      console.log(completion.text);
      return completion.text;
  };