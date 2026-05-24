from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class ATCFrequency:
    mhz: str
    name: str
    squelch_snr: int = -1
    ampfactor: float = 2.0

@dataclass(frozen=True, slots=True)
class DeviceConfig:
    gain: float
    sample_rate: float
    correction: int
    fft_size: int
    highpass: int
    lowpass: int

@dataclass(frozen=True, slots=True)
class IcecastConfig:
    host: str
    port: int
    username: str
    password: str
    live_mountpoint: str
    silence_mountpoint: str

@dataclass(frozen=True, slots=True)
class ATCRadioConfig:
    enable: bool
    rtl_config_file: str
    device: DeviceConfig
    freqs: tuple[ATCFrequency, ...]

@dataclass(frozen=True, slots=True)
class FMRadioConfig:
    enable: bool
    gain: float
    sample_rate: int
    bitrate: str
    stereo: bool

@dataclass(frozen=True, slots=True)
class Config:
    host: str
    port: int
    max_inactivity: int
    icecast: IcecastConfig
    atc_radio: ATCRadioConfig
    fm_radio: FMRadioConfig

config = Config(
    host='localhost',
    port=8081,
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
            gain=29.7,
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
        gain=29.7,
        sample_rate=48000,
        bitrate='128k',
        stereo=True,
    )
)

rtlairband_config_file_template = '''
fft_size = {fft_size};
devices: (
  {{
    type = "rtlsdr";
    index = 0;
    gain = {gain};
    mode = "scan"
    sample_rate = {sample_rate};
    correction = {correction};
    channels:
    (
      {{
        freqs = ({freqs});
        squelch_snr_threshold = ({thresholds});
        ampfactor = ({ampfactors});
        highpass = {highpass};
        lowpass = {lowpass};
        label = "ATC";
        outputs: (
          {{
            type = "icecast";
            server = "{icecast_server}";
            port = {icecast_port};
            username = "{icecast_username}";
            password = "{icecast_password}";
            mountpoint = "{icecast_mount}";
          }}
        );
      }}
    );
  }}
);
'''