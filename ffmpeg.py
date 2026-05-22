from config import config
import subprocess, signal, sys

proc = None

def start_silence_feed():
    global proc

    icecast_config = config['icecast_config']
    host = icecast_config['host']
    port = icecast_config['port']
    username = icecast_config['username']
    password = icecast_config['password']
    mountpoint = icecast_config['silence_mountpoint']

    proc = subprocess.Popen([
        'ffmpeg', '-re',
        '-f', 'lavfi', '-i', 'anullsrc=r=8000:cl=mono',
        '-c:a', 'libmp3lame', '-b:a', '8k',
        '-f', 'mp3', f'icecast://{username}:{password}@{host}:{port}/{mountpoint}'
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
