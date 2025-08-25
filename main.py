from dotenv import load_dotenv
load_dotenv()
import os
import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import google.generativeai as genai

# Load Gemini API key
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Use Gemini Flash model
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

app = FastAPI(title="Career & Skill Development Advisor", version="0.1.0")
origins = [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "null" # Often needed for local file:// access
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserProfile(BaseModel):
    name: Optional[str] = None
    background: Optional[str] = None
    skills: Optional[List[str]] = Field(default=None, description="List of current skills")
    interests: Optional[List[str]] = Field(default=None, description="Areas of interest")
    goals: Optional[List[str]] = Field(default=None, description="Short-term goals")
    experience_level: Optional[str] = Field(default=None, description="e.g., beginner, intermediate, advanced")
    time_per_week_hours: Optional[int] = Field(default=None, description="Hours available per week to learn")

SYSTEM_PROMPT = """
You are a Career & Skill Development Advisor. Provide practical, actionable career guidance.

IMPORTANT: Return ONLY valid JSON. Your entire response must be a single JSON object.

Example Output Format:
{
  "career_paths": [
    {
      "title": "Software Engineer",
      "match": 90,
      "why_fit": "Your programming skills and experience in web dev align well with this role. It's a high-demand field in the tech industry.",
      "salary": "95,000 - 150,000 USD",
      "growth": "High - 21% expected growth"
    }
  ],
  "next_skills": [
    {
      "skill": "React",
      "why": "Essential for modern frontend development, building on your existing web dev skills."
    }
  ],
  "resources": [
    {
      "title": "freeCodeCamp React Course",
      "url": "https://www.freecodecamp.org/learn/front-end-development-libraries/",
      "why": "A free, comprehensive, project-based curriculum perfect for mastering React.",
      "type": "Course"
    },
    {
      "title": "The Official React Documentation",
      "url": "https://react.dev/",
      "why": "The best place to find up-to-date information and core concepts, straight from the source.",
      "type": "Documentation"
    }
  ],
  "plan_30_60_90": {
    "days_0_30": {
        "title": "Foundation Building",
        "tasks": ["Complete React basics course", "Build a small project like a to-do list with components"]
    },
    "days_31_60": {
        "title": "Skill Development",
        "tasks": ["Learn a state management library (e.g., Redux Toolkit)", "Build a multi-page portfolio website using React Router"]
    },
    "days_61_90": {
        "title": "Advanced Growth",
        "tasks": ["Contribute to an open-source React project", "Prepare for technical interviews by solving React-specific coding challenges", "Apply for 5 frontend positions weekly"]
    }
  }
}

Focus on:
- Real, accessible resources with working URLs.
- Specific, measurable action items.
- Current industry trends and demands, including realistic salary and growth data.
- Practical project suggestions.
"""


@app.get("/health")
def health():
    return {"ok": True, "model": GEMINI_MODEL}

@app.post("/career-advice")
def career_advice(profile: UserProfile):
    user_json = profile.model_dump()
    
    # Build the input prompt for Gemini
    prompt = f"{SYSTEM_PROMPT}\nUser profile: {json.dumps(user_json)}"
    
    try:
        model = genai.GenerativeModel(GEMINI_MODEL)
        response = model.generate_content(prompt)
        
        content = response.text.strip()
        
        # More robustly clean the response - remove markdown formatting
        if content.startswith("```json"):
            content = content[7:-3].strip()
        elif content.startswith("```"):
            content = content[3:-3].strip()
        
        # Parse JSON
        data = json.loads(content)
        
        return data
    
    except json.JSONDecodeError as e:
        print(f"JSON parsing error: {e}")
        print(f"Content that failed to parse: {content}")
        return { "error": "Model returned invalid JSON", "raw": content }
    except Exception as e:
        print(f"General error: {e}")
        return { "error": str(e) }

class ChatMessage(BaseModel):
    role: str
    parts: List[str]

class ChatRequest(BaseModel):
    history: List[ChatMessage]
    new_message: str

CHATBOT_PROMPT = """
You are a helpful and friendly Career & Skill Development Advisor. 
The user has just received a career plan from you. Now, they want to chat and ask follow-up questions. 
Keep your answers concise and directly related to their career questions.
"""

@app.post("/chat")
def chat(request: ChatRequest):
    try:
        chat_model = genai.GenerativeModel(GEMINI_MODEL)
        
        # Format the history for the model
        history_for_model = []
        for msg in request.history:
            history_for_model.append({
                "role": msg.role,
                "parts": msg.parts
            })
            
        # Start a chat session with the existing history
        # If history is empty, prepend the system prompt
        if not history_for_model:
             history_for_model.insert(0, {"role": "user", "parts": [CHATBOT_PROMPT]})
             history_for_model.insert(1, {"role": "model", "parts": ["Understood! I am ready to help the user with their career questions."]})


        chat_session = chat_model.start_chat(history=history_for_model)
        
        # Send the new message
        response = chat_session.send_message(request.new_message)
        
        return {"reply": response.text}

    except Exception as e:
        print(f"Chat error: {e}")
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)