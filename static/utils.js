'use strict';

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

    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: 'Live Radio',
            artist: 'SDR',
        });

        // These handlers are required on some browsers to keep the session alive
        navigator.mediaSession.setActionHandler('play', () => audio.play());
        navigator.mediaSession.setActionHandler('pause', () => audio.pause());
    }

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
