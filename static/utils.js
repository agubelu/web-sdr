'use strict';

import { syncUI } from './app.js';

async function createAudioElement(url, container) {
    const cacheBuster = Math.random().toString(36).substring(2, 15);
    const urlNoCache = `${url}?nocache=${cacheBuster}`;

    // If the <audio> is created while the stream doesn't exist, it won't work
    container.innerHTML = 'Loading...';
    await pollUntilExists(urlNoCache);
    const audio = document.createElement('audio');
    audio.controls = true;
    audio.autoplay = true;
    audio.src = urlNoCache;

    // This allows the sync process and periodic ping to happen even when in the background on mobile devices
    audio.addEventListener('timeupdate', () => {
        // Throttle manually since timeupdate fires frequently
        const now = Date.now();
        if (!audio._lastPing || now - audio._lastPing > 15_000) {
            audio._lastPing = now;
            syncUI();
        }
    });

    container.innerHTML = '';
    container.appendChild(audio);
}

async function pollUntilExists(url, interval = 1000) {
    while (true) {
        const response = await fetch(url);
        if (response.status !== 404) return response;
        await new Promise(resolve => setTimeout(resolve, interval));
    }
}

export { createAudioElement };
