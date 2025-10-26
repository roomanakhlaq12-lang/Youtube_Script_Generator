# main.py
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import google.generativeai as genai
from groq import Groq

# ------------------------
# Load API keys from .env
# ------------------------
load_dotenv()  # load environment variables from .env file

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GOOGLE_API_KEY or not GROQ_API_KEY:
    raise ValueError("API keys not found in .env file")

# Configure APIs
genai.configure(api_key=GOOGLE_API_KEY)
groq = Groq(api_key=GROQ_API_KEY)

# ------------------------
# FastAPI setup
# ------------------------
app = FastAPI(title="Soft UI YouTube Script Generator")

# Serve static files (CSS, JS)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Serve the frontend HTML
@app.get("/")
def root():
    return FileResponse(os.path.join("static", "index.html"))

# ------------------------
# Models
# ------------------------
class TopicRequest(BaseModel):
    topic: str

class IdeaRequest(BaseModel):
    idea: str

# ------------------------
# Helper functions
# ------------------------
def generate_ideas_func(topic: str):
    """Generate 4 YouTube script ideas from Gemini."""
    model = genai.GenerativeModel("gemini-2.5-flash")
    prompt = f"Create four YouTube script ideas about {topic}. Each idea must be on one line only."
    response = model.generate_content(prompt)
    # Split by lines and clean
    ideas = [line.strip("-• ") for line in response.text.strip().split("\n") if line.strip()]
    # Fallback if less than 4
    while len(ideas) < 4:
        ideas.append(f"Example idea {len(ideas)+1} for {topic}")
    return ideas[:4]

def generate_script_func(idea: str):
    """Generate a YouTube script using Groq."""
    prompt = (
        f"Write a YouTube script for {idea}. "
        f"Include an engaging title at the top. "
        f"The script must be emotional, story-driven, under 3000 characters, "
        f"and contain no music cues, brackets, or scene descriptions."
    )
    completion = groq.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=[{"role": "user", "content": prompt}],
        max_completion_tokens=3000,
        temperature=1,
        stream=True,  # Stream chunks for performance
    )

    # Collect chunks into a single string
    script_text = ""
    for chunk in completion:
        script_text += chunk.choices[0].delta.content or ""
    return script_text.strip()

# ------------------------
# Routes
# ------------------------
@app.post("/generate-ideas")
def generate_ideas(req: TopicRequest):
    try:
        ideas = generate_ideas_func(req.topic)
        return {"ideas": ideas}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-script")
def generate_script(req: IdeaRequest):
    try:
        script = generate_script_func(req.idea)
        return {"script": script}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
