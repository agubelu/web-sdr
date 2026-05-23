'use strict';

function createAudioElement(url) {
    const audio = document.createElement('audio');
    audio.controls = true;
    const cacheBuster = Math.random().toString(36).substring(2, 15);
    audio.src = `${url}?nocache=${cacheBuster}`;
    return audio;
}

export { createAudioElement };
