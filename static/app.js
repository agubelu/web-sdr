'use strict';

import { ATCRadio } from './atc_radio.js';
import { FMRadio } from './fm_radio.js';

async function init() {
    ATCRadio.init();
    FMRadio.init();

    // Make radios aware of each other so turning one on turns all others off
    ATCRadio.registerOtherRadios([FMRadio]);
    FMRadio.registerOtherRadios([ATCRadio]);

    syncUI();
    setInterval(syncUI, 15 * 1000);
}

async function syncUI() {
    let resp = await fetch(`${API_BASE_URL}/api/status`);
    let data = await resp.json();

    if (data === null) {
        // Both radios OFF
        atcOff();
        fmOff();
    } else if (data.type == 'fm') {
        // ATC off, update FM freq if possible
        atcOff();
        fmOn();
        if (!FMRadio.userChanges) {
            FMRadio.selectedFrequency = data.frequencies[0];
            FMRadio.redraw();
        }
    } else if (data.type == 'atc') {
        atcOn();
        fmOff();
        if (!ATCRadio.userChanges) {
            ATCRadio.selectedFrequencies = data.frequencies;
            ATCRadio.redraw();
        }
    }
}

///////////////////////////////////////////////////////////////////////////////

// Convenience functions to visually turn on/off radios without using their .turnOn() / .turnOff() methods,
// because those make API calls that are undesirable here.

function atcOff() {
    if (!ATCRadio.isOn) return;
    ATCRadio.isOn = false;
    ATCRadio.hidePlayer();
    ATCRadio.redraw();
}

function atcOn() {
    if (ATCRadio.isOn) return;
    ATCRadio.isOn = true;
    ATCRadio.showPlayer();
    ATCRadio.redraw();
}

function fmOff() {
    if (!FMRadio.isOn) return;
    FMRadio.isOn = false;
    FMRadio.hidePlayer();
    FMRadio.redraw();
}

function fmOn() {
    if (FMRadio.isOn) return;
    FMRadio.isOn = true;
    FMRadio.showPlayer();
    FMRadio.redraw();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);
