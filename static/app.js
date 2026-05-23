'use strict';

import { ATCRadio } from './atc_radio.js';
import { FMRadio } from './fm_radio.js';

function init() {
    ATCRadio.init();
    FMRadio.init();

    // Make radios aware of each other so turning one on turns all others off
    ATCRadio.registerOtherRadios([FMRadio]);
    FMRadio.registerOtherRadios([ATCRadio]);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);
