import json
import urllib.request

from config import IcecastConfig


def build_icecast_mount_url(icecast_config: IcecastConfig, *, silence: bool = False) -> str:
    username = icecast_config.username
    password = icecast_config.password
    host = icecast_config.host
    port = icecast_config.port

    mountpoint = icecast_config.silence_mountpoint if silence else icecast_config.live_mountpoint

    return f'icecast://{username}:{password}@{host}:{port}/{mountpoint}'

def build_icecast_stream_url(icecast_config: IcecastConfig) -> str:
    host = icecast_config.host
    port = icecast_config.port
    mountpoint = icecast_config.live_mountpoint

    return f'http://{host}:{port}/{mountpoint}'

def radio_has_listeners(icecast_config: IcecastConfig) -> bool:
    ''' Checks if someone is still listening to any of the streams '''
    url = f'http://{icecast_config.host}:{icecast_config.port}/status-json.xsl'
    with urllib.request.urlopen(url) as resp:
        data = json.loads(resp.read())['icestats']

    if not (sources := data.get('source')):
        return False  # No sources active

    if isinstance(sources, dict):
        sources = [sources]  # source is a dict instead of a list when only one source is active

    our_sources = (icecast_config.live_mountpoint, icecast_config.silence_mountpoint)
    return any(s['listeners'] > 0 and any(s['listenurl'].endswith(feed) for feed in our_sources)
               for s in sources)
