import OpenAI from "openai";

const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
      "HTTP-Referer": "localhost:3000", // Optional. Site URL for rankings on openrouter.ai.
      "X-Title": "seo", // Optional. Site title for rankings on openrouter.ai.
    },
  });

export const callToAI = async (content: string) => {
    const completion = await openai.chat.completions.create({
        model: "google/gemma-3-1b-it:free",
        messages: [
          {
            "role": "user",
            "content": content
          }
        ],
        
      });
    
      console.log(completion.choices[0].message);
      return completion.choices[0].message;
  };