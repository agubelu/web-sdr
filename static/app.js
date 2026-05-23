// State management
const radioState = {
    isOn: false,
    selectedFrequencies: [],
    isLoading: false,
    // This prevents the periodic API status check from overwriting user inputs
    // if they are in the process of selecting different frequencies when loadStateFromAPI is called
    userChanges: false,
};

const fmRadioState = {
    isOn: false,
    selectedFrequency: '104.3',
    isLoading: false,
    userChanges: false,
};

// DOM elements
const powerToggle = document.getElementById('powerToggle');
const refreshBtn = document.getElementById('refreshBtn');
const frequenciesGrid = document.getElementById('frequenciesGrid');
const statusText = document.getElementById('statusText');
const selectedCount = document.getElementById('selectedCount');
const audioContainer = document.getElementById('audioContainer');

const fmPowerToggle = document.getElementById('fmPowerToggle');
const fmRefreshBtn = document.getElementById('fmRefreshBtn');
const fmStatusText = document.getElementById('fmStatusText');
const fmFrequencyInput = document.getElementById('fmFrequencyInput');
const fmUpBtn = document.getElementById('fmUpBtn');
const fmDownBtn = document.getElementById('fmDownBtn');
const fmInputGroup = fmFrequencyInput.parentElement;
const fmAudioContainer = document.getElementById('fmAudioContainer');

// Initialize the UI
function init() {
    renderFrequencies();
    attachEventListeners();
    attachFmEventListeners();
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

    if (newState) {
        await turnOffFmRadio();
        updateUI();
        await onRadioOn();
    } else {
        await onRadioOff();
    }
}

// Attach event listeners
function attachEventListeners() {
    powerToggle.addEventListener('change', handlePowerToggle);
    refreshBtn.addEventListener('click', handleRefresh);
}

// FM Radio Functions
function validateFmFrequency(freqStr) {
    const freq = parseFloat(freqStr);
    if (isNaN(freq)) return false;
    if (freq < 87.5 || freq > 108.0) return false;
    const rounded = Math.round(freq * 10) / 10;
    return Math.abs(freq - rounded) < 0.01;
}

function formatFmFrequency(freq) {
    const num = parseFloat(freq);
    if (isNaN(num)) return fmRadioState.selectedFrequency;
    const clamped = Math.max(87.5, Math.min(108.0, num));
    const rounded = Math.round(clamped * 10) / 10;
    return rounded.toFixed(1);
}

function handleFmFrequencyInput(e) {
    const value = e.target.value.trim();
    if (value === '') return;

    fmRadioState.userChanges = true;
    const formatted = formatFmFrequency(value);

    if (validateFmFrequency(formatted)) {
        fmRadioState.selectedFrequency = formatted;
        fmFrequencyInput.classList.remove('invalid');
        fmInputGroup.classList.remove('invalid');
    } else {
        fmFrequencyInput.classList.add('invalid');
        fmInputGroup.classList.add('invalid');
    }
    updateFmUI();
}

function handleFmUp() {
    fmRadioState.userChanges = true;
    const current = parseFloat(fmRadioState.selectedFrequency);
    const next = Math.min(108.0, Math.round((current + 0.1) * 10) / 10);
    fmRadioState.selectedFrequency = next.toFixed(1);
    fmFrequencyInput.value = fmRadioState.selectedFrequency;
    fmFrequencyInput.classList.remove('invalid');
    fmInputGroup.classList.remove('invalid');
    updateFmUI();
}

function handleFmDown() {
    fmRadioState.userChanges = true;
    const current = parseFloat(fmRadioState.selectedFrequency);
    const next = Math.max(87.5, Math.round((current - 0.1) * 10) / 10);
    fmRadioState.selectedFrequency = next.toFixed(1);
    fmFrequencyInput.value = fmRadioState.selectedFrequency;
    fmFrequencyInput.classList.remove('invalid');
    fmInputGroup.classList.remove('invalid');
    updateFmUI();
}

async function handleFmPowerToggle(e) {
    const newState = e.target.checked;

    if (newState) {
        if (!validateFmFrequency(fmRadioState.selectedFrequency)) {
            e.target.checked = false;
            alert('Please enter a valid FM frequency (87.5 - 108.0 MHz)');
            return;
        }

        fmRadioState.userChanges = false;

        fmRadioState.isOn = true;
        fmRadioState.isLoading = true;

        await turnOffAtcRadio();
        updateFmUI();

        await onFmRadioOn();
    } else {
        fmRadioState.userChanges = false;
        fmRadioState.isOn = false;
        fmRadioState.isLoading = true;
        updateFmUI();

        await onFmRadioOff();
    }
}

async function handleFmRefresh() {
    if (!fmRadioState.isOn) return;

    fmRadioState.userChanges = false;
    fmRadioState.isLoading = true;
    updateFmUI();

    await onFmRadioOn();
}

async function turnOffAtcRadio() {
    if (radioState.isOn) {
        radioState.isOn = false;
        powerToggle.checked = false;
        audioContainer.innerHTML = '';
        await fetch(`${API_BASE_URL}/api/control/off`, {method: 'POST'});
        updateUI();
    }
}

async function turnOffFmRadio() {
    if (fmRadioState.isOn) {
        fmRadioState.isOn = false;
        fmPowerToggle.checked = false;
        fmAudioContainer.innerHTML = '';
        await fetch(`${API_BASE_URL}/api/control/off`, {method: 'POST'});
        updateFmUI();
    }
}

async function onFmRadioOn() {
    console.log('FM Radio turned ON, frequency:', fmRadioState.selectedFrequency);

    const payload = {
        frequency: fmRadioState.selectedFrequency,
    };

    await fetch(`${API_BASE_URL}/api/control/on`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    const audio = document.createElement('audio');
    audio.id = 'fmRadioPlayer';
    audio.controls = true;
    const cacheBuster = Math.random().toString(36).substring(2, 15);
    audio.src = `${STREAM_URL}?nocache=${cacheBuster}`;
    fmAudioContainer.innerHTML = '';
    fmAudioContainer.appendChild(audio);

    fmRadioState.isLoading = false;
    updateFmUI();
}

async function onFmRadioOff() {
    console.log('FM Radio turned OFF');
    fmAudioContainer.innerHTML = '';
    await fetch(`${API_BASE_URL}/api/control/off`, {method: 'POST'});
    fmRadioState.isLoading = false;
    updateFmUI();
}

function updateFmUI() {
    fmPowerToggle.checked = fmRadioState.isOn;
    fmPowerToggle.disabled = fmRadioState.isLoading;

    fmStatusText.textContent = fmRadioState.isOn ? 'FM Radio ON' : 'FM Radio OFF';
    fmStatusText.className = 'status-text ' + (fmRadioState.isOn ? 'radio-on' : 'radio-off');

    fmRefreshBtn.disabled = !fmRadioState.isOn || fmRadioState.isLoading;

    const isValid = validateFmFrequency(fmRadioState.selectedFrequency);
    fmUpBtn.disabled = !isValid || parseFloat(fmRadioState.selectedFrequency) >= 108.0 || fmRadioState.isLoading;
    fmDownBtn.disabled = !isValid || parseFloat(fmRadioState.selectedFrequency) <= 87.5 || fmRadioState.isLoading;

    fmFrequencyInput.value = fmRadioState.selectedFrequency;
}

function attachFmEventListeners() {
    fmPowerToggle.addEventListener('change', handleFmPowerToggle);
    fmRefreshBtn.addEventListener('click', handleFmRefresh);
    fmUpBtn.addEventListener('click', handleFmUp);
    fmDownBtn.addEventListener('click', handleFmDown);
    fmFrequencyInput.addEventListener('input', handleFmFrequencyInput);
}

// Update UI based on current state
function updateUI() {
    // Update power toggle
    powerToggle.checked = radioState.isOn;
    powerToggle.disabled = radioState.isLoading;

    // Update status text
    statusText.textContent = radioState.isOn ? 'ATC Radio ON' : 'ATC Radio OFF';
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

// Handler hook for radio ON
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

    // Create and attach audio element only after server confirms
    const audio = document.createElement('audio');
    audio.id = 'radioPlayer';
    audio.controls = true;
    const cacheBuster = Math.random().toString(36).substring(2, 15);
    audio.src = `${STREAM_URL}?nocache=${cacheBuster}`;
    audioContainer.innerHTML = '';
    audioContainer.appendChild(audio);

    radioState.isLoading = false;
    updateUI();
}

// Handler hook for radio OFF
async function onRadioOff() {
    console.log('Radio turned OFF');
    audioContainer.innerHTML = '';
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

    if (radioState.userChanges || fmRadioState.userChanges) {
        // The user is selecting other options, don't overwrite their changes
        return;
    }

    if (data === null || data.type === null) {
        radioState.isOn = false;
        fmRadioState.isOn = false;
        audioContainer.innerHTML = '';
        fmAudioContainer.innerHTML = '';
    } else if (data.type === 'atc') {
        radioState.isOn = true;
        radioState.selectedFrequencies = data['frequencies'];
        fmRadioState.isOn = false;
        fmAudioContainer.innerHTML = '';
    } else if (data.type === 'fm') {
        fmRadioState.isOn = true;
        fmRadioState.selectedFrequency = data['frequency'];
        radioState.isOn = false;
        audioContainer.innerHTML = '';
    }
    updateUI();
    updateFmUI();
}

async function getAPIStatus() {
    let resp = await fetch(`${API_BASE_URL}/api/status`);
    let data = await resp.json();
    return data;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);
