'use strict';

async function createAudioElement(url, container) {
    const cacheBuster = Math.random().toString(36).substring(2, 15);
    const urlNoCache = `${url}?nocache=${cacheBuster}`;

    // If the <audio> is created while the stream doesn't exist, it won't work
    container.innerHTML = 'Loading...';
    await pollUntilExists(urlNoCache);
    const audio = document.createElement('audio');
    audio.controls = true;
    audio.src = urlNoCache;

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
