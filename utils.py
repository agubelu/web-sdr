def build_icecast_mount_url(icecast_config: dict, *, silence: bool = False) -> str:
    username = icecast_config['username']
    password = icecast_config['password']
    host = icecast_config['host']
    port = icecast_config['port']

    mountpoint_key = 'silence_mountpoint' if silence else 'live_mountpoint'
    mountpoint = icecast_config[mountpoint_key]

    return f'icecast://{username}:{password}@{host}:{port}/{mountpoint}'

def build_icecast_stream_url(icecast_config: dict) -> str:
    host = icecast_config['host']
    port = icecast_config['port']
    mountpoint = icecast_config['live_mountpoint']

    return f'http://{host}:{port}/{mountpoint}'
