import signal
import subprocess
import sys

from config import IcecastConfig
from utils import build_icecast_mount_url

proc = None

def start_silence_feed(ic_config: IcecastConfig, sample_rate: int, bitrate: str, stereo: bool):
    global proc
    stop_silence_feed()  # Terminate existing feed if it exists

    icecast_url = build_icecast_mount_url(ic_config, silence=True)
    channel = 'stereo' if stereo else 'mono'

    # Sample rate can remain fixed at 8000 because it doesn't matter for silence
    proc = subprocess.Popen([
        'ffmpeg', '-re',
        '-f', 'lavfi', '-i', f'anullsrc=r={sample_rate}:cl={channel}',
        '-c:a', 'libmp3lame', '-b:a', bitrate,
        '-f', 'mp3', icecast_url
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print('started silence feed')

def stop_silence_feed():
    global proc
    if proc:
        print('terminating active silence feed')
        proc.terminate()
        proc.wait()

def handle_sigterm(_sig, _frame):
    stop_silence_feed()
    sys.exit(0)

signal.signal(signal.SIGTERM, handle_sigterm)
signal.signal(signal.SIGINT, handle_sigterm)
