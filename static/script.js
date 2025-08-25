document.addEventListener('DOMContentLoaded', () => {
    // --- Element Selectors ---
    const views = document.querySelectorAll('.view');
    const form = document.getElementById('profileForm');
    const careerPathsEl = document.getElementById('career_paths');
    const nextSkillsEl = document.getElementById('next_skills');
    const resourcesEl = document.getElementById('resources');
    const planEl = document.getElementById('plan');
    const userNameEl = document.getElementById('userName');
    const chatbot = document.getElementById('chatbot');
    const chatHistory = document.getElementById('chatHistory');
    const chatForm = document.getElementById('chatForm');
    const chatInput = document.getElementById('chatInput');
    const clearBtn = document.getElementById('clearBtn');
    const trySampleBtn = document.getElementById('trySampleBtn');

    let conversationHistory = [];
    const API_BASE_URL = 'http://127.0.0.1:8000';

    // --- View Management ---
    const showView = (viewId) => {
        views.forEach(view => {
            view.classList.toggle('hidden', view.id !== viewId);
        });
        window.scrollTo(0, 0);
    };

    // --- Event Listeners ---
    document.body.addEventListener('click', (e) => {
        const action = e.target.closest('[data-action]')?.dataset.action;
        if (action) {
            e.preventDefault();
            if (action === 'start') showView('form-view');
            else if (action === 'home') showView('home-view');
            else if (action === 'form') showView('form-view');
        }
    });
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!document.getElementById('experience_level').value) {
            alert('Please select your experience level.');
            return;
        }

        const payload = getFormData();
        showView('loading-view');

        try {
            const data = await postAdvice(payload);
            if (data.error) throw new Error(data.raw || data.error);
            renderResults(data, payload.name);
            setupChatbot(payload);
            showView('results-view');
        } catch (err) {
            alert(`An error occurred: ${err.message}`);
            showView('form-view');
        }
    });

    clearBtn.addEventListener('click', () => form.reset());

    trySampleBtn.addEventListener('click', () => {
        setVal('name', 'Alex Chen');
        setVal('experience_level', 'intermediate');
        setVal('time_per_week_hours', '10');
        setVal('background', 'Software developer with 3 years of experience in JavaScript and Python. Worked on both frontend (React) and backend (Django) projects.');
        setVal('skills', 'JavaScript, React, Python, Django, SQL, Docker');
        setVal('interests', 'Machine Learning, System Design, Cloud Infrastructure');
        setVal('goals', 'Transition to a DevOps or Machine Learning Engineer role, improve system architecture skills');
    });

    // --- API Calls ---
    async function postAdvice(payload) {
        const res = await fetch(`${API_BASE_URL}/career-advice`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error('API error: ' + text);
        }
        return res.json();
    }

    // --- Rendering Logic ---
    function renderResults(data, name) {
        userNameEl.textContent = name || 'you';

        // Career Paths
        careerPathsEl.innerHTML = (data.career_paths || []).map(c => `
            <div class="career-card">
                <div class="career-card-header">
                    <h3>${c.title}</h3>
                    <span class="match-badge">${c.match}% match</span>
                </div>
                <div class="match-progress"><div class="match-progress-bar" style="width: ${c.match}%"></div></div>
                <p>${c.why_fit}</p>
                <div class="career-stats">
                    <div class="stat"><svg viewBox="0 0 24 24"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c2.15-.45 3.5-1.74 3.5-3.71 0-2.12-1.71-3.44-4.2-4.14z"></path></svg><span>Salary: ${c.salary}</span></div>
                    <div class="stat"><svg viewBox="0 0 24 24"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"></path></svg><span>Growth: ${c.growth}</span></div>
                </div>
            </div>
        `).join('');

        // Next Skills
        nextSkillsEl.innerHTML = (data.next_skills || []).map(s => `
            <div class="skill-item">
                <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path></svg>
                <span>${s.skill}</span>
            </div>
        `).join('');
        
        // Resources
        resourcesEl.innerHTML = (data.resources || []).map(r => `
            <div class="resource-card">
                <div class="resource-header">
                    <h4>${r.title}</h4>
                    <span class="resource-tag">${r.type}</span>
                </div>
                <p>${r.why}</p>
                <a href="${r.url}" target="_blank" rel="noopener noreferrer" class="resource-link">View Resource &rarr;</a>
            </div>
        `).join('');

        // 30/60/90 Day Plan
        const planData = data.plan_30_60_90 || {};
        planEl.innerHTML = Object.entries(planData).map(([key, value]) => {
            const dayMap = { 'days_0_30': 'Days 0–30', 'days_31_60': 'Days 31–60', 'days_61_90': 'Days 61–90' };
            return `
            <div class="plan-card">
                <h4>
                    <svg viewBox="0 0 24 24"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM7 12h5v5H7v-5z"></path></svg>
                    ${dayMap[key]}
                </h4>
                <p class="plan-subtitle">${value.title}</p>
                <ul>
                    ${(value.tasks || []).map(task => `<li><svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path></svg><span>${task}</span></li>`).join('')}
                </ul>
            </div>
        `}).join('');
    }

    // --- Chatbot Logic ---
    function setupChatbot(profile) {
        chatHistory.innerHTML = '';
        const primingPrompt = `My profile is as follows. Keep this context for all future questions: ${JSON.stringify(profile, null, 2)}`;
        conversationHistory = [
            { role: 'user', parts: [primingPrompt] },
            { role: 'model', parts: ["Got it. I have your profile details. I'm ready to answer your questions about the plan based on your profile."] }
        ];
        appendMessage('bot', "Hi! I'm your AI career advisor. I have your profile details and can answer questions about your career plan, suggest learning paths, or provide guidance on specific skills. What would you like to know?");
    }

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userMessage = chatInput.value.trim();
        if (!userMessage) return;

        appendMessage('user', userMessage);
        conversationHistory.push({ role: 'user', parts: [userMessage] });
        chatInput.value = '';
        chatInput.disabled = true;

        try {
            const res = await fetch(`${API_BASE_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    history: conversationHistory,
                    new_message: userMessage,
                }),
            });
            if (!res.ok) throw new Error('API returned an error');
            const data = await res.json();
            const botReply = data.reply || 'Sorry, I encountered an error.';
            appendMessage('bot', botReply);
            conversationHistory.push({ role: 'model', parts: [botReply] });
        } catch (err) {
            appendMessage('bot', 'Sorry, I couldn\'t connect to the advisor.');
        } finally {
            chatInput.disabled = false;
            chatInput.focus();
        }
    });

    function appendMessage(sender, message) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('chat-message', `${sender}-message`);
        let formattedMessage = message
            .replace(/</g, "&lt;").replace(/>/g, "&gt;") // Sanitize HTML
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/^\s*[\*-]\s/gm, '• ')
            .replace(/\n/g, '<br>');
        messageDiv.innerHTML = formattedMessage;
        chatHistory.appendChild(messageDiv);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    // --- Utility Functions ---
    function getFormData() {
        const timeHours = document.getElementById('time_per_week_hours').value;
        return {
            name: document.getElementById('name').value || null,
            experience_level: document.getElementById('experience_level').value,
            time_per_week_hours: timeHours ? Number(timeHours) : null,
            background: document.getElementById('background').value || null,
            skills: parseCSV(document.getElementById('skills').value),
            interests: parseCSV(document.getElementById('interests').value),
            goals: parseCSV(document.getElementById('goals').value),
        };
    }

    function parseCSV(input) {
        if (!input) return [];
        return input.split(',').map(s => s.trim()).filter(Boolean);
    }
    
    function setVal(id, value) {
        const el = document.getElementById(id);
        if (el) el.value = value;
    }

    // --- Initial State ---
    showView('home-view');
});