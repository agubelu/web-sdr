import abc
import subprocess

from config import config
from config_base import ATCFrequency, rtlairband_config_file_template
from utils import build_icecast_mount_url


class Radio:
    def __init__(self, freqs: list[str]):
        self.freqs = freqs

    @abc.abstractmethod
    def teardown(self):
        ...

    @abc.abstractmethod
    def kind(self) -> str:
        ...

class ATCRadio(Radio):
    def __init__(self, freqs: list[str]):
        print(f'new ATC radio with freqs {freqs}')
        super().__init__(freqs)
        atc_config = config.atc_radio

        frequencies: list[ATCFrequency] = [f for f in atc_config.freqs if f.mhz in freqs]
        freqs_list = ', '.join(f.mhz for f in frequencies)
        thresholds_list = ', '.join(str(f.squelch_snr) for f in frequencies)
        ampfactors_list = ', '.join(str(f.ampfactor) for f in frequencies)

        device_config = atc_config.device
        icecast_config = config.icecast

        config_fmt = rtlairband_config_file_template.format(
            fft_size=device_config.fft_size,
            gain=device_config.gain,
            sample_rate=device_config.sample_rate,
            correction=device_config.correction,
            freqs=freqs_list,
            thresholds=thresholds_list,
            ampfactors=ampfactors_list,
            highpass=device_config.highpass,
            lowpass=device_config.lowpass,
            icecast_server=icecast_config.host,
            icecast_port=icecast_config.port,
            icecast_username=icecast_config.username,
            icecast_password=icecast_config.password,
            icecast_mount=icecast_config.live_mountpoint,
        )

        file_path = atc_config.rtl_config_file
        with open(file_path, 'w') as f:
            f.write(config_fmt)

        self.proc = subprocess.Popen(['rtl_airband', '-f', '-c', file_path],
                                     stdin=subprocess.PIPE,
                                     stdout=subprocess.DEVNULL,
                                     stderr=subprocess.DEVNULL)

    def teardown(self):
        print('tearing ATC radio down')
        self.proc.terminate()
        self.proc.wait()
        if self.proc.returncode != 0:
            raise OSError(f'Return code {self.proc.returncode}')

    def kind(self):
        return 'atc'

class FMRadio(Radio):
    def __init__(self, freqs: list[str]):
        assert len(freqs) == 1, 'only one frequency at a time is supported in FM radio'
        print(f'new FM radio with freq {freqs}')
        super().__init__(freqs)

        freq_hz = int(float(freqs[0]) * 1e6)
        softfm_args = [
            'softfm',
            '-f', str(freq_hz),
            '-g', str(config.fm_radio.gain),
            '-r', str(config.fm_radio.sample_rate),
            '-R', '-',
        ]

        ffmpeg_args = [
            'ffmpeg',
            '-hide_banner',
            '-nostats',
            '-f', 's16le',
            '-ar', str(config.fm_radio.sample_rate),
            '-ac', '2' if config.fm_radio.stereo else '1',
            '-i', 'pipe:0',
            '-codec:a', 'libmp3lame',
            '-b:a', config.fm_radio.bitrate,
            '-f', 'mp3',
            build_icecast_mount_url(config.icecast, silence=False)
        ]

        self.softfm_proc = subprocess.Popen(softfm_args,
                                            stdout=subprocess.PIPE,
                                            stderr=subprocess.DEVNULL)
        self.ffmpeg_proc = subprocess.Popen(ffmpeg_args,
                                            stdin=self.softfm_proc.stdout,
                                            stderr=subprocess.DEVNULL)
        # Allow softfm to receive SIGPIPE if ffmpeg exits early
        self.softfm_proc.stdout.close()  # type: ignore

    def teardown(self):
        print('tearing FM radio down')
        self.ffmpeg_proc.terminate();
        self.ffmpeg_proc.wait();
        if self.ffmpeg_proc.returncode not in (0, 15, 255):
            # 15: SIGTERM, 255: no data written (happens if radio is turned off very quickly)
            raise OSError(f'ffmpeg exit code {self.ffmpeg_proc.returncode}')

        self.softfm_proc.terminate();
        self.softfm_proc.wait();
        if self.softfm_proc.returncode not in (0, -13):
            # -13: consequence of SIGPIPE
            raise OSError(f'softfm exit code {self.softfm_proc.returncode}')

    def kind(self):
        return 'fm'
