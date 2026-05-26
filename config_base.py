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
