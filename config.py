from config_base import (ATCFrequency, ATCRadioConfig, Config, DeviceConfig,
                         FMRadioConfig, IcecastConfig)

config = Config(
    host='localhost',
    port=8080,
    max_inactivity=60,

    icecast=IcecastConfig(
        host='localhost',
        port=8000,
        username='source',
        password='hackme',
        live_mountpoint='feed.mp3',
        silence_mountpoint='silence.mp3',
    ),

    atc_radio=ATCRadioConfig(
        enable=True,
        rtl_config_file='/tmp/rtl_airband.conf',
        device=DeviceConfig(
            gain=37.2,
            sample_rate=1.024,
            correction=-5,
            fft_size=512,
            highpass=100,
            lowpass=3000,
        ),
        freqs=(
            ATCFrequency('118.105', 'LEZL TWR', squelch_snr=5),
            ATCFrequency('121.700', 'LEZL GND', squelch_snr=0),
            ATCFrequency('120.800', 'LEZL APP'),
            ATCFrequency('118.180', 'LEZL ATIS', squelch_snr=0),

            ATCFrequency('132.475', 'SVQ CTR'),
            ATCFrequency('135.025', 'SVQ RDR 1'),
            ATCFrequency('132.600', 'SVQ RDR 2'),
            ATCFrequency('134.800', 'SVQ RDR 3'),

            ATCFrequency('118.650', 'LEJR TWR'),
            ATCFrequency('128.500', 'LEJR APP'),

            ATCFrequency('121.500', 'GUARD'),
        ),
    ),

    fm_radio=FMRadioConfig(
        enable=True,
        gain=0.0,
        sample_rate=48000,
        bitrate='128k',
        stereo=True,
    )
)
