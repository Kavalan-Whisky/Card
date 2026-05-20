// Application State Management
const AppState = {
    theme: localStorage.getItem('theme') || 'light',
    username: localStorage.getItem('username') || 'Developer Exec',
    apiCallCount: 0,
    cryptoData: []
};

// DOM Elements
const themeToggle = document.getElementById('theme-toggle');
const navItems = document.querySelectorAll('.nav-item');
const views = document.querySelectorAll('.dashboard-view');
const welcomeUser = document.getElementById('welcome-user');
const usernameInput = document.getElementById('username-input');
const saveSettingsBtn = document.getElementById('save-settings-btn');
const apiCounterEl = document.getElementById('api-counter');
const timestampEl = document.getElementById('timestamp');
const cryptoContainer = document.getElementById('crypto-container');

// Initialize Application
function init() {
    // Set initial Theme
    document.documentElement.setAttribute('data-theme', AppState.theme);
    
    // Set initial configuration layouts
    welcomeUser.textContent = `Welcome, ${AppState.username}`;
    usernameInput.value = AppState.username;
    
    setupEventListeners();
    updateTimestamp();
    fetchCryptoData();
    
    // Auto-refresh crypto data every 60 seconds
    setInterval(fetchCryptoData, 60000);
}

// Event Listeners Routing System
function setupEventListeners() {
    // Theme Toggling Logic
    themeToggle.addEventListener('click', () => {
        AppState.theme = AppState.theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', AppState.theme);
        localStorage.setItem('theme', AppState.theme);
    });

    // Single Page Application View Router
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Toggle active navigation class
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // Switch current visible view block
            const targetView = item.getAttribute('data-target');
            views.forEach(view => {
                view.classList.remove('active-view');
                if (view.id === `${targetView}-view`) {
                    view.classList.add('active-view');
                }
            });
        });
    });

    // Save Settings Event
    saveSettingsBtn.addEventListener('click', () => {
        const newName = usernameInput.value.trim();
        if (newName) {
            AppState.username = newName;
            localStorage.setItem('username', newName);
            welcomeUser.textContent = `Welcome, ${AppState.username}`;
            alert('Preferences saved successfully.');
        }
    });
}

// Asynchronous Data Fetching Engine (Consuming Free Public API)
async function fetchCryptoData() {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,cardano&vs_currencies=usd&include_24hr_change=true');
        
        if (!response.ok) throw new Error('Network throttling/error occurred fetching data.');
        
        const data = await response.json();
        AppState.apiCallCount++;
        apiCounterEl.textContent = AppState.apiCallCount;
        updateTimestamp();
        
        renderCryptoCards(data);
    } catch (error) {
        console.error(error);
        cryptoContainer.innerHTML = `<div class="card" style="color: red;">Failed to retrieve real-time data. API limit may be reached.</div>`;
    }
}

// Render Engine for UI
function renderCryptoCards(data) {
    cryptoContainer.innerHTML = ''; // Clear loading element
    
    Object.keys(data).forEach(coin => {
        const price = data[coin].usd;
        const change = data[coin].usd_24h_change.toFixed(2);
        const changeClass = change >= 0 ? 'online' : 'offline';
        
        const cardHTML = `
            <div class="card">
                <h3 style="text-transform: capitalize;">${coin}</h3>
                <p class="metric-value">$${price.toLocaleString()}</p>
                <p class="status-indicator ${changeClass}" style="color: ${change >= 0 ? '#10b981' : '#ef4444'}">
                    ${change >= 0 ? '▲' : '▼'} ${change}% (24h)
                </p>
            </div>
        `;
        cryptoContainer.innerHTML += cardHTML;
    });
}

function updateTimestamp() {
    const now = new Date();
    timestampEl.textContent = now.toTimeString().split(' ')[0];
}

// Execute core sequence
document.addEventListener('DOMContentLoaded', init);