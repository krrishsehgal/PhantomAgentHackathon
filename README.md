LAKSHYA: AI POWERED CAREER AND SKILL DEVELOPMENT AI AGENT

FastAPI backend + simple HTML frontend that suggests career paths, next skills to learn, curated resources, and a 30/60/90-day plan based on a user's profile.

## 1) Prerequisites
- Python 3.10+
- An OpenAI API key

## 2) Setup (Local, quickest)

bash
# 1) Clone or unzip this project
cd career_advisor_mvp

# 2) Create & activate a virtual env (recommended)
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# 3) Install deps
pip install -r requirements.txt

# 4) Configure environment
cp .env.example .env
# edit .env to add your OPENAI_API_KEY and (optional) OPENAI_MODEL

# 5) Run API
python main.py
# or: uvicorn main:app --reload


Backend runs at: http://127.0.0.1:8000  
Interactive docs: http://127.0.0.1:8000/docs

## 3) Frontend (Static HTML)
Open static/index.html in your browser. It will call http://127.0.0.1:8000/career-advice.

If your browser blocks CORS from file:// origin, serve the static folder with a simple server:

bash
# Option A: Python's simple server (from /static folder)
cd static
python -m http.server 5500
# Then open: http://127.0.0.1:5500/index.html

# Option B: VS Code Live Server extension


## 4) Example request (HTTP file for VS Code REST Client)
See test.http

## 5) Notes
- Model is set by OPENAI_MODEL in .env (default gpt-4o-mini).
- You can deploy the API to any host that can run Python. The static frontend can be hosted anywhere.
- For hackathon demos, keep inputs short and show the JSON results nicely in the UI.

## 5) Contributors
- Krrish Sehgal
- Khushal Garg
- Kartik Dubey
- Md. Arham Jawed
