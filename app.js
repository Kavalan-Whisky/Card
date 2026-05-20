// Application State Management
const AppState = {
    theme: localStorage.getItem('theme') || 'light',
    username: localStorage.getItem('username') || 'Developer Exec',
    apiCallCount: 0,
    // Baseline state tracking for incoming live feeds
    crypto: {
        bitcoin: { price: 0, change: 0 },
        ethereum: { price: 0, change: 0 },
        solana: { price: 0, change: 0 }
    }
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
    document.documentElement.setAttribute('data-theme', AppState.theme);
    welcomeUser.textContent = `Welcome, ${AppState.username}`;
    usernameInput.value = AppState.username;
    
    setupEventListeners();
    
    // Render placeholders immediately so layout doesn't flicker
    renderCryptoCards(); 
    
    // Fire up the high-frequency stream engine
    initCryptoWebSocket();
    
    // Keep the system clock precisely synced every half second
    setInterval(updateTimestamp, 500);
}

// Event Listeners Routing System
function setupEventListeners() {
    themeToggle.addEventListener('click', () => {
        AppState.theme = AppState.theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', AppState.theme);
        localStorage.setItem('theme', AppState.theme);
    });

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            const targetView = item.getAttribute('data-target');
            views.forEach(view => {
                view.classList.remove('active-view');
                if (view.id === `${targetView}-view`) {
                    view.classList.add('active-view');
                }
            });
        });
    });

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

// WebSocket Live Stream Engine (No API keys required, zero rate-limiting)
function initCryptoWebSocket() {
    // Binance public combined stream for real-time tickers
    const streamUrl = "wss://stream.binance.com:9443/stream?streams=btcusdt@ticker/ethusdt@ticker/solusdt@ticker";
    const socket = new WebSocket(streamUrl);

    socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        const streamName = message.stream;
        const data = message.data;

        // Map incoming live stream symbols to our local AppState
        let coinKey = "";
        if (streamName.includes("btc")) coinKey = "bitcoin";
        if (streamName.includes("eth")) coinKey = "ethereum";
        if (streamName.includes("sol")) coinKey = "solana";

        if (coinKey) {
            AppState.crypto[coinKey].price = parseFloat(data.c);  // 'c' = Current Closing Price
            AppState.crypto[coinKey].change = parseFloat(data.P); // 'P' = 24h Price Change %
            
            AppState.apiCallCount++; 
            apiCounterEl.textContent = AppState.apiCallCount;
            updateTimestamp();
            
            // Re-render UI with new micro-movements
            renderCryptoCards();
        }
    };

    socket.onerror = (error) => {
        console.error("WebSocket Error: ", error);
    };

    // Auto-reconnect handler if the user's internet drops out
    socket.onclose = () => {
        console.warn("WebSocket closed. Attempting secure reconnection in 2 seconds...");
        setTimeout(initCryptoWebSocket, 2000);
    };
}

// Render Engine for UI
function renderCryptoCards() {
    cryptoContainer.innerHTML = ''; 
    
    Object.keys(AppState.crypto).forEach(coin => {
        const coinData = AppState.crypto[coin];
        const isLive = coinData.price !== 0;
        
        // Format parameters cleanly
        const priceText = isLive ? `$${coinData.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Streaming...';
        const change = isLive ? coinData.change.toFixed(2) : '0.00';
        const changeClass = change >= 0 ? 'online' : 'offline';
        const arrow = change >= 0 ? '▲' : '▼';
        const accentColor = change >= 0 ? '#10b981' : '#ef4444';
        
        const cardHTML = `
            <div class="card">
                <h3 style="text-transform: capitalize;">${coin}</h3>
                <p class="metric-value">${priceText}</p>
                <p class="status-indicator ${changeClass}" style="color: ${isLive ? accentColor : 'var(--text-muted)'}">
                    ${isLive ? `${arrow} ${change}% (24h)` : 'Synchronizing market...'}
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

// Initialize system execution setup
document.addEventListener('DOMContentLoaded', init);
