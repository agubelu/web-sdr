# web-sdr

Web-based player and control interface for live radio streaming using a RTL-SDR dongle.

Main features:
- Airband/ATC playback on one or more pre-defined frequencies at a time.
- High-quality FM stereo playback with a frequency selector.
- Low CPU requirements, suitable for Raspberry Pi and other embedded devices.
- Automatic radio shutdown after all listeners have disconnected.
- State sync across multiple simultaneous listeners.

![Screenshot](img/screenshot.png)

# Requirements
- Python + Flask
- FFmpeg
- A connection to an [icecast](https://icecast.org/) server
- [RTL-SDR drivers](https://github.com/osmocom/rtl-sdr) installed
- **For airband radio:** [RTLSDR-Airband](https://github.com/rtl-airband/RTLSDR-Airband)
- **For FM radio:** [SoftFM](https://github.com/zf-lab/SoftFM) (if you're using a headless device, consider using [this fork](https://github.com/agubelu/SoftFM) which removes the ALSA dependency)

# Disclaimer
Many jurisdictions forbid publicly rebroadcasting ATC communications. When using this software, please make sure to comply with all applicable local laws and regulations.
