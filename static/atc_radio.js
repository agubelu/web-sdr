'use strict';
import { createAudioElement } from './utils.js';

// DOM elements
const powerToggle = document.getElementById('atcPowerToggle');
const refreshBtn = document.getElementById('atcRefreshBtn');
const frequenciesGrid = document.getElementById('atcFrequenciesGrid');
const statusText = document.getElementById('atcStatusText');
const selectedCount = document.getElementById('atcSelectedCount');
const audioContainer = document.getElementById('atcAudioContainer');

const ATCRadio = {
    init() {
        this.isOn = false;
        this.selectedFrequencies = [];
        this.isLoading = false;
        this.userChanges = false;

        powerToggle.addEventListener('change', ev => this._handlePowerToggle(ev));
        refreshBtn.addEventListener('click', ev => this._handleRefreshButton(ev));
        this._renderFrequencies();
        this.redraw();
    },

    redraw() {
        // Update power toggle
        powerToggle.checked = this.isOn;
        powerToggle.disabled = this.isLoading;

        // Update status text
        statusText.textContent = this.isOn ? 'ATC Radio ON' : 'ATC Radio OFF';
        statusText.className = 'status-text ' + (this.isOn ? 'radio-on' : 'radio-off');

        // Update selected count
        const count = this.selectedFrequencies.length;
        selectedCount.textContent = `${count} selected`;

        // Update refresh button state
        refreshBtn.disabled = !this.isOn || this.isLoading;

        // Update frequency button states
        document.querySelectorAll('.frequency-btn').forEach((btn, index) => {
            const freq = FREQUENCIES[index];
            const freqString = freq.mhz.toString();
            const isSelected = this.selectedFrequencies.includes(freqString);

            if (isSelected) {
                btn.classList.add('selected');
            } else {
                btn.classList.remove('selected');
            }
        });
    },

    async turnOn() {
        let frequenciesToSend = this.selectedFrequencies;
        const payload = {
            frequencies: frequenciesToSend,
            type: 'atc',
        };

        // Turn off other radios if they are currently active
        for (let r of this.otherRadios ?? []) {
            await r.turnOff();
        }

        await fetch(`${API_BASE_URL}/api/atc/on`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        // Create and attach audio element only after server confirms
        await this.showPlayer();

        this.isLoading = false;
        this.isOn = true;
        this.redraw();
        console.log('ATC Radio turned ON with frequencies', this.selectedFrequencies);
    },

    async turnOff() {
        if (!this.isOn) return;

        powerToggle.checked = false;
        this.hidePlayer();

        await fetch(`${API_BASE_URL}/api/atc/off`, { method: 'POST' });
        this.isOn = false;
        this.isLoading = false;
        this.redraw();

        console.log('ATC Radio turned OFF');
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

    _renderFrequencies() {
        frequenciesGrid.innerHTML = '';
        FREQUENCIES.forEach((freq, index) => {
            const btn = document.createElement('button');
            btn.className = 'frequency-btn';
            btn.dataset.index = index;
            btn.innerHTML = `
                <div class="frequency-value">${freq.mhz} MHz</div>
                <div class="frequency-name">${freq.name}</div>
            `;
            btn.addEventListener('click', ev => this._handleFrequencyToggle(ev));
            frequenciesGrid.appendChild(btn);
        });
    },

    _handleFrequencyToggle(ev) {
        const index = parseInt(ev.currentTarget.dataset.index);
        const freq = FREQUENCIES[index];
        const freqString = freq.mhz.toString();
        this.userChanges = true;

        if (this.selectedFrequencies.includes(freqString)) {
            this.selectedFrequencies = this.selectedFrequencies.filter(
                f => f !== freqString
            );
        } else {
            this.selectedFrequencies.push(freqString);
        }

        this.redraw();
    },

    async _handlePowerToggle(ev) {
        const newState = ev.target.checked;

        // Can't turn ON without at least one frequency selected
        if (newState && this.selectedFrequencies.length === 0) {
            ev.target.checked = false;
            alert('Please select at least one frequency before turning ON the radio');
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

    async _handleRefreshButton(ev) {
        if (this.isOn && this.selectedFrequencies.length === 0) {
            alert('Error: Cannot refresh while radio is ON with no frequencies selected');
            return;
        }

        // Power button and refresh flush user changes
        this.userChanges = false;
        this.isLoading = true;

        await this.turnOn();
    },
};

export { ATCRadio };
