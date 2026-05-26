from config_base import IcecastConfig


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
