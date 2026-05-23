// State management
const radioState = {
    isOn: false,
    selectedFrequencies: [],
    isLoading: false,
    // This prevents the periodic API status check from overwriting user inputs
    // if they are in the process of selecting different frequencies when loadStateFromAPI is called
    userChanges: false,
};

// DOM elements
const powerToggle = document.getElementById('powerToggle');
const refreshBtn = document.getElementById('refreshBtn');
const frequenciesGrid = document.getElementById('frequenciesGrid');
const statusText = document.getElementById('statusText');
const selectedCount = document.getElementById('selectedCount');

// Initialize the UI
function init() {
    renderFrequencies();
    attachEventListeners();
    loadStateFromAPI();

    // Periodically resync state, this also refreshes the inactivity timer
    setInterval(loadStateFromAPI, 15 * 1000);
}

// Render frequency buttons
function renderFrequencies() {
    frequenciesGrid.innerHTML = '';
    FREQUENCIES.forEach((freq, index) => {
        const btn = document.createElement('button');
        btn.className = 'frequency-btn';
        btn.dataset.index = index;
        btn.innerHTML = `
            <div class="frequency-value">${freq.mhz} MHz</div>
            <div class="frequency-name">${freq.name}</div>
        `;
        btn.addEventListener('click', handleFrequencyToggle);
        frequenciesGrid.appendChild(btn);
    });
}

// Handle frequency button click
function handleFrequencyToggle(e) {
    const index = parseInt(e.currentTarget.dataset.index);
    const freq = FREQUENCIES[index];
    const freqString = freq.mhz.toString();
    radioState.userChanges = true;

    if (radioState.selectedFrequencies.includes(freqString)) {
        radioState.selectedFrequencies = radioState.selectedFrequencies.filter(
            f => f !== freqString
        );
    } else {
        radioState.selectedFrequencies.push(freqString);
    }

    updateUI();
}

// Handle power toggle
async function handlePowerToggle(e) {
    const newState = e.target.checked;

    // Restriction: Can't turn ON without at least one frequency selected
    if (newState && radioState.selectedFrequencies.length === 0) {
        e.target.checked = false;
        alert('Please select at least one frequency before turning ON the radio');
        return;
    }

    // Power button and refresh flush user changes
    radioState.userChanges = false;

    radioState.isOn = newState;
    radioState.isLoading = true;
    updateUI();

    if (newState) {
        onRadioOn();
    } else {
        onRadioOff();
    }

    // Simulate server processing - re-enable after 3 seconds
    setTimeout(() => {
        radioState.isLoading = false;
        updateUI();
    }, 3000);
}

// Attach event listeners
function attachEventListeners() {
    powerToggle.addEventListener('change', handlePowerToggle);
    refreshBtn.addEventListener('click', handleRefresh);
}

// Update UI based on current state
function updateUI() {
    // Update power toggle
    powerToggle.checked = radioState.isOn;
    powerToggle.disabled = radioState.isLoading;

    // Update status text
    statusText.textContent = radioState.isOn ? 'Radio ON' : 'Radio OFF';
    statusText.className = 'status-text ' + (radioState.isOn ? 'radio-on' : 'radio-off');

    // Update selected count
    const count = radioState.selectedFrequencies.length;
    selectedCount.textContent = `${count} selected`;

    // Update refresh button state
    refreshBtn.disabled = !radioState.isOn || radioState.isLoading;

    // Update frequency button states
    document.querySelectorAll('.frequency-btn').forEach((btn, index) => {
        const freq = FREQUENCIES[index];
        const freqString = freq.mhz.toString();
        const isSelected = radioState.selectedFrequencies.includes(freqString);

        if (isSelected) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    });
}

// Handler hook for radio ON - will be expanded to connect to backend
async function onRadioOn() {
    console.log('Radio turned ON');

    let frequenciesToSend = radioState.selectedFrequencies;

    const payload = {
        frequencies: frequenciesToSend,
    };

    console.log('Currently selected frequencies:', frequenciesToSend);

    let resp = await fetch(`${API_BASE_URL}/api/control/on`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    radioState.isLoading = false;
    updateUI();
}

// Handler hook for radio OFF - will be expanded to connect to backend
async function onRadioOff() {
    console.log('Radio turned OFF');
    let resp = await fetch(`${API_BASE_URL}/api/control/off`, {method: 'POST'});
    radioState.isLoading = false;
    updateUI();
}

// Handle refresh button
async function handleRefresh() {
    const hasValidSelection = radioState.selectedFrequencies.length > 0;
    if (radioState.isOn && !hasValidSelection) {
        alert('Error: Cannot refresh while radio is ON with no frequencies selected');
        return;
    }

    // Power button and refresh flush user changes
    radioState.userChanges = false;

    radioState.isLoading = true;
    updateUI();

    console.log('Refresh button clicked');
    console.log('Current selected frequencies:', radioState.selectedFrequencies);

    onRadioOn();
}

// API Requests
async function loadStateFromAPI() {
    // The API call has to be made no matter what to tell the server we're still listening
    let data = await getAPIStatus();

    if (radioState.userChanges) {
        // The user is selecting other frequencies, don't overwrite their changes
        return;
    }

    if (data === null || data.type !== 'atc') {
        radioState.isOn = false;
    } else {
        radioState.isOn = true;
        radioState.selectedFrequencies = data['frequencies'];
    }
    updateUI();
}

async function getAPIStatus() {
    let resp = await fetch(`${API_BASE_URL}/api/status`);
    let data = await resp.json();
    return data;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);
