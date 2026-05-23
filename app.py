from threading import Lock, Timer

from flask import Flask, jsonify, render_template, request

import ffmpeg
from config import config
from radio import ATCRadio, Radio
from utils import build_icecast_stream_url

app = Flask(__name__)

radio_lock = Lock()
live_radio: Radio | None = None
off_timer: Timer | None = None

##### Route handling #####

@app.route('/')
def index():
    params = {
        'stream_url': build_icecast_stream_url(config.atc_radio.icecast),
        'freqs': config.atc_radio.freqs,
        'api_url': f'http://{config.host}:{config.port}'
    }
    return render_template('radio.html', **params)

@app.get('/api/status')
def get_status():
    with radio_lock:
        reset_timer()
        return jsonify(current_status())

@app.post('/api/control/on')
def post_control_on():
    with radio_lock:
        create_or_replace_radio(request.get_json())
    return '', 204

@app.post('/api/control/off')
def post_control_off():
    with radio_lock:
        turn_radio_off()
    return '', 204

##### Handler for inactivity timer #####

def off_timer_handle():
    print('off timer triggered')
    global off_timer

    off_timer = None
    with radio_lock:
        turn_radio_off()

##### Aux functions which must be called holding `radio_lock` #####

def current_status() -> dict | None:
    global live_radio
    return None if live_radio is None else {
        'frequencies': live_radio.freqs,
        'type': live_radio.kind(),
    }

def create_or_replace_radio(data: dict):
    print(f'upserting radio')
    global live_radio, off_timer

    if live_radio:
        live_radio.teardown()
    freqs = data['frequencies']
    live_radio = ATCRadio(freqs)

    reset_timer()

def reset_timer():
    print('resetting timer')
    global off_timer

    if off_timer:
        off_timer.cancel()

    off_timer = Timer(config.max_inactivity, off_timer_handle)
    off_timer.daemon = True
    off_timer.start()

def turn_radio_off():
    print('turning radio off')
    global live_radio, off_timer

    if live_radio:
        live_radio.teardown()
        live_radio = None
    if off_timer:
        off_timer.cancel()
        off_timer = None

###################################################################################

if __name__ == '__main__':
    ffmpeg.start_silence_feed(config.atc_radio.icecast, bitrate='8k', stereo=False)
    app.run(
        host=config.host,
        port=config.port,
        threaded=True,
    )
