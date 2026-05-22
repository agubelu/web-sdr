from config import config, ATCFrequency, rtlairband_config_file_template
import subprocess

class ATCRadio:
    def __init__(self, freqs: list[str]):
        print(f'new radio with freqs {freqs}')
        self.freqs = freqs
        atc_config = config.atc_radio

        frequencies: list[ATCFrequency] = [f for f in atc_config.freqs if f.mhz in freqs]
        freqs_list = ', '.join(f.mhz for f in frequencies)
        thresholds_list = ', '.join(str(f.squelch_snr) for f in frequencies)
        ampfactors_list = ', '.join(str(f.ampfactor) for f in frequencies)

        device_config = atc_config.device
        icecast_config = atc_config.icecast

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
        print('tearing radio down')
        self.proc.terminate()
        self.proc.wait()
        if self.proc.returncode != 0:
            raise OSError(f'Return code {self.proc.returncode}')
