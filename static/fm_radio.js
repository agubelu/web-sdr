'use strict';
import { createAudioElement } from './utils.js';

// DOM elements
const powerToggle = document.getElementById('fmPowerToggle');
const refreshBtn = document.getElementById('fmRefreshBtn');
const statusText = document.getElementById('fmStatusText');
const frequencyInput = document.getElementById('fmFrequencyInput');
const upBtn = document.getElementById('fmUpBtn');
const downBtn = document.getElementById('fmDownBtn');
const inputGroup = frequencyInput.parentElement;
const audioContainer = document.getElementById('fmAudioContainer');

const MIN_FREQ = 87.5;
const MAX_FREQ = 108.0;

const FMRadio = {
    init() {
        this.isOn = false;
        this.selectedFrequency = '95.9';
        this.isLoading = false;
        this.userChanges = false;

        this._attachListeners();
        this.redraw();
    },

    redraw() {
        powerToggle.checked = this.isOn;
        powerToggle.disabled = this.isLoading;

        statusText.textContent = this.isOn ? 'FM Radio ON' : 'FM Radio OFF';
        statusText.className = 'status-text ' + (this.isOn ? 'radio-on' : 'radio-off');

        refreshBtn.disabled = !this.isOn || this.isLoading;

        const isValid = validateFmFrequency(this.selectedFrequency);
        upBtn.disabled = !isValid || parseFloat(this.selectedFrequency) >= MAX_FREQ || this.isLoading;
        downBtn.disabled = !isValid || parseFloat(this.selectedFrequency) <= MIN_FREQ || this.isLoading;

        frequencyInput.value = this.selectedFrequency;
    },

    async turnOn() {
        const payload = {
            frequencies: [this.selectedFrequency],
            type: 'fm',
        };

        // Turn off other radios if they are currently active
        for (let r of this.otherRadios ?? []) {
            await r.turnOff();
        }

        await fetch(`${API_BASE_URL}/api/fm/on`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        // Create and attach audio element only after server confirms
        await this.showPlayer();

        this.isLoading = false;
        this.isOn = true;
        this.redraw();
        console.log('FM Radio turned ON with frequency', this.selectedFrequency);
    },

    async turnOff() {
        if (!this.isOn) return;

        powerToggle.checked = false;
        this.hidePlayer();

        await fetch(`${API_BASE_URL}/api/fm/off`, { method: 'POST' });
        this.isOn = false;
        this.isLoading = false;
        this.redraw();

        console.log('FM Radio turned OFF');
    },

    async showPlayer() {
        if (audioContainer.querySelector('audio') !== null) return;  // Player already exists
        await createAudioElement(STREAM_URL, audioContainer);
    },

    hidePlayer() {
        audioContainer.innerHTML = '';
    },

    registerOtherRadios(radios) {
        this.otherRadios = radios;
    },

    //////////////////////////////////////////////////////////////////////////////

    _attachListeners() {
        upBtn.addEventListener('click', ev => this._handleFmUp(ev));
        downBtn.addEventListener('click', ev => this._handleFmDown(ev));
        frequencyInput.addEventListener('change', ev => this._handleFmFrequencyInput(ev));
        powerToggle.addEventListener('change', ev => this._handlePowerToggle(ev));
        refreshBtn.addEventListener('click', ev => this._handleRefresh(ev));
    },

    _handleFmUp() {
        this.userChanges = true;
        const current = parseFloat(this.selectedFrequency);
        const next = Math.min(MAX_FREQ, Math.round((current + 0.1) * 10) / 10);
        this.selectedFrequency = next.toFixed(1);
        frequencyInput.value = this.selectedFrequency;
        frequencyInput.classList.remove('invalid');
        inputGroup.classList.remove('invalid');
        this.redraw();
    },

    _handleFmDown() {
        this.userChanges = true;
        const current = parseFloat(this.selectedFrequency);
        const next = Math.max(MIN_FREQ, Math.round((current - 0.1) * 10) / 10);
        this.selectedFrequency = next.toFixed(1);
        frequencyInput.value = this.selectedFrequency;
        frequencyInput.classList.remove('invalid');
        inputGroup.classList.remove('invalid');
        this.redraw();
    },

    _handleFmFrequencyInput(ev) {
        const value = ev.target.value.trim();
        if (value === '') return;

        this.userChanges = true;
        const formatted = this._formatFmFrequency(value);

        if (validateFmFrequency(formatted)) {
            this.selectedFrequency = formatted;
            frequencyInput.classList.remove('invalid');
            inputGroup.classList.remove('invalid');
        } else {
            frequencyInput.classList.add('invalid');
            inputGroup.classList.add('invalid');
        }
        this.redraw();
    },

    async _handlePowerToggle(ev) {
        const newState = ev.target.checked;

        if (newState && !validateFmFrequency(this.selectedFrequency)) {
            e.target.checked = false;
            alert('Please enter a valid FM frequency (87.5 - 108.0 MHz)');
            return;
        }

        // Power button and refresh flush user changes
        this.userChanges = false;
        this.isLoading = true;
        this.redraw();

        if (newState) {
            await this.turnOn();
        } else {
            await this.turnOff();
        }
    },

    async _handleRefresh() {
        if (!this.isOn) return;
        if (!validateFmFrequency(this.selectedFrequency)) {
            e.target.checked = false;
            alert(`Please enter a valid FM frequency (${MIN_FREQ} - ${MAX_FREQ} MHz)`);
            return;
        }

        this.userChanges = false;
        this.isLoading = true;
        await this.turnOn();
    },

    _formatFmFrequency(freq) {
        const num = parseFloat(freq);
        if (isNaN(num)) return this.selectedFrequency;
        const clamped = Math.max(MIN_FREQ, Math.min(MAX_FREQ, num));
        const rounded = Math.round(clamped * 10) / 10;
        return rounded.toFixed(1);
    },
};

function validateFmFrequency(freqStr) {
    const freq = parseFloat(freqStr);
    if (isNaN(freq)) return false;
    if (freq < MIN_FREQ || freq > MAX_FREQ) return false;
    const rounded = Math.round(freq * 10) / 10;
    return Math.abs(freq - rounded) < 0.01;
}

export { FMRadio };
