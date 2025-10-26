// DOM Elements
const topicInput = document.getElementById('topicInput');
const generateIdeasBtn = document.getElementById('generateIdeasBtn');
const ideasSection = document.getElementById('ideasSection');
const ideasContainer = document.getElementById('ideasContainer');
const scriptSection = document.getElementById('scriptSection');
const scriptContent = document.getElementById('scriptContent');
const copyScriptBtn = document.getElementById('copyScriptBtn');
const newScriptBtn = document.getElementById('newScriptBtn');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingText = document.getElementById('loadingText');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

// State
let currentIdeas = [];
let currentScript = '';

// Event Listeners
generateIdeasBtn.addEventListener('click', generateIdeas);
copyScriptBtn.addEventListener('click', copyScript);
newScriptBtn.addEventListener('click', startOver);
topicInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        generateIdeas();
    }
});

// Generate Ideas
async function generateIdeas() {
    const topic = topicInput.value.trim();
    
    if (!topic) {
        showToast('Please enter a topic first!', 'error');
        return;
    }
    
    showLoading('Generating creative ideas...');
    
    try {
        const response = await fetch('/generate-ideas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ topic }),
        });
        
        if (!response.ok) {
            throw new Error('Failed to generate ideas');
        }
        
        const data = await response.json();
        currentIdeas = data.ideas;
        displayIdeas(currentIdeas);
        hideLoading();
        
        // Show ideas section with animation
        ideasSection.classList.remove('hidden');
        ideasSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
    } catch (error) {
        hideLoading();
        showToast('Error generating ideas. Please try again.', 'error');
        console.error('Error:', error);
    }
}

// Display Ideas
function displayIdeas(ideas) {
    ideasContainer.innerHTML = '';
    
    ideas.forEach((idea, index) => {
        const ideaCard = document.createElement('div');
        ideaCard.className = 'idea-card';
        ideaCard.innerHTML = `
            <h3 style="font-size: 1.1rem; margin-bottom: 10px; color: inherit;">Idea ${index + 1}</h3>
            <p style="color: inherit; opacity: 0.9;">${idea}</p>
        `;
        
        ideaCard.addEventListener('click', () => selectIdea(idea, ideaCard));
        ideasContainer.appendChild(ideaCard);
        
        // Animate appearance
        setTimeout(() => {
            ideaCard.style.animation = 'fadeInUp 0.5s ease';
        }, index * 100);
    });
}

// Select Idea and Generate Script
async function selectIdea(idea, element) {
    // Update UI
    document.querySelectorAll('.idea-card').forEach(card => {
        card.classList.remove('selected');
    });
    element.classList.add('selected');
    
    showLoading('Creating your amazing script...');
    
    try {
        const response = await fetch('/generate-script', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ idea }),
        });
        
        if (!response.ok) {
            throw new Error('Failed to generate script');
        }
        
        const data = await response.json();
        currentScript = data.script;
        displayScript(currentScript);
        hideLoading();
        
        // Show script section
        scriptSection.classList.remove('hidden');
        scriptSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
    } catch (error) {
        hideLoading();
        showToast('Error generating script. Please try again.', 'error');
        console.error('Error:', error);
    }
}

// Display Script
function displayScript(script) {
    scriptContent.textContent = script;
    scriptContent.style.animation = 'fadeInUp 0.6s ease';
}

// Copy Script to Clipboard
async function copyScript() {
    try {
        await navigator.clipboard.writeText(currentScript);
        showToast('Script copied to clipboard!', 'success');
    } catch (error) {
        showToast('Failed to copy script', 'error');
    }
}

// Start Over
function startOver() {
    topicInput.value = '';
    ideasSection.classList.add('hidden');
    scriptSection.classList.add('hidden');
    currentIdeas = [];
    currentScript = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Loading Functions
function showLoading(text) {
    loadingText.textContent = text;
    loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
    loadingOverlay.classList.add('hidden');
}

// Toast Notification
function showToast(message, type = 'success') {
    toastMessage.textContent = message;
    toast.style.background = type === 'error' ? '#d63031' : 'var(--success-color)';
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}