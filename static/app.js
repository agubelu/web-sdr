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
    registerMediaSession();
    setInterval(syncWhenOff, 15000);
}

async function syncUI() {
    // This API call also lets the server know we're still listening so the radio isn't auto turned-off
    let data = await getApiStatus();

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

async function getApiStatus() {
    let resp = await fetch(`${API_BASE_URL}/api/status`);
    let data = await resp.json();
    return data;
}

async function syncWhenOff() {
    // This allows the radio status to be synced when both are off.
    // When at least one is on, status sync is bound to the audio player's timeupdate event,
    // which fires even when the browser is in the background on a mobile device.
    if (!ATCRadio.isOn && !FMRadio.isOn) {
        syncUI();
    }
}

function registerMediaSession() {
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: 'Live Radio',
            artist: 'SDR',
        });

        // These handlers are required on some browsers to keep the session alive
        navigator.mediaSession.setActionHandler('play', () => audio.play());
        navigator.mediaSession.setActionHandler('pause', () => audio.pause());
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

export { syncUI };
