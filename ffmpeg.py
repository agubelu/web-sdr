from config import config
import subprocess, signal, sys
from utils import build_icecast_mount_url

proc = None

def start_atc_silence_feed():
    global proc

    icecast_config = config['atc_radio']['icecast']
    icecast_url = build_icecast_mount_url(icecast_config, silence=True)

    proc = subprocess.Popen([
        'ffmpeg', '-re',
        '-f', 'lavfi', '-i', 'anullsrc=r=8000:cl=mono',
        '-c:a', 'libmp3lame', '-b:a', '8k',
        '-f', 'mp3', icecast_url
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print('started silence feed')
    signal.signal(signal.SIGTERM, shutdown_silence_feed)
    signal.signal(signal.SIGINT, shutdown_silence_feed)

def shutdown_silence_feed(sig, frame):
    global proc
    if proc:
        print('terminating silence feed')
        proc.terminate()
        proc.wait()
    sys.exit(0)
