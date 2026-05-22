from dataclasses import dataclass

@dataclass(frozen=True, slots=True)
class Frequency:
    mhz: str
    name: str
    squelch_snr: int = -1
    ampfactor: float = 2.0

config = {
    'host': 'localhost',
    'port': 8080,
    'max_inactivity': 60,
    'rtl_config_file': '/tmp/rtl_airband.conf',
    'device_config': {
        'gain': 29.7,
        'sample_rate': 1.024,
        'correction': -5,
        'fft_size': 512,
        'highpass': 100,
        'lowpass': 3000,
    },
    'icecast_config': {
        'host': 'localhost',
        'port': 8000,
        'username': 'source',
        'password': 'hackme',
        'live_mountpoint': 'feed.mp3',
        'silence_mountpoint': 'silence.mp3',
    },
    'freqs': [
        Frequency('118.105', 'LEZL TWR', squelch_snr=5),
        Frequency('121.700', 'LEZL GND', squelch_snr=0),
        Frequency('120.800', 'LEZL APP'),
        Frequency('118.180', 'LEZL ATIS', squelch_snr=0),

        Frequency('132.475', 'SVQ CTR'),
        Frequency('135.025', 'SVQ RDR 1'),
        Frequency('132.600', 'SVQ RDR 2'),
        Frequency('134.800', 'SVQ RDR 3'),

        Frequency('118.650', 'LEJR TWR'),
        Frequency('128.500', 'LEJR APP'),

        Frequency('121.500', 'GUARD'),
    ],
}
