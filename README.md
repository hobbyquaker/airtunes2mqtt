# airtunes2mqtt

[![mqtt-smarthome](https://img.shields.io/badge/mqtt-smarthome-blue.svg)](https://github.com/mqtt-smarthome/mqtt-smarthome)
[![NPM version](https://badge.fury.io/js/airtunes2mqtt.svg)](http://badge.fury.io/js/airtunes2mqtt)
[![Dependency Status](https://img.shields.io/gemnasium/hobbyquaker/airtunes2mqtt.svg?maxAge=2592000)](https://gemnasium.com/github.com/hobbyquaker/airtunes2mqtt)
[![License][mit-badge]][mit-url]

This is a little daemon that can retrieve an audio stream via TCP socket or from a Alsa Loopback device and stream it 
to Airplay/Airtunes compatible receivers. Via MQTT you can control the receivers volume and enable/disable the receivers.

Based on [lperrins](https://github.com/lperrin) [node_airtunes](https://github.com/lperrin/node_airtunes) - all credits belong to him.

This is a work in progress, a better Readme will follow asap. Right now the speaker config is hardcoded in index.js (see
Line 81).


## Getting started

Needs Node.js/npm

```
sudo npm -g airtunes2mqtt
airtunes2mqtt --help
```

## Topics

* airtunes/set/&lt;speaker&gt;/enable
* airtunes/set/&lt;speaker&gt;/disable
* airtunes/set/&lt;speaker&gt;/volume (payload is a number between 0 and 100)


## License

Copyright (c) 2015 Sebastian 'hobbyquaker' Raff <hq@ccu.io>

[mit-badge]: https://img.shields.io/badge/License-MIT-blue.svg?style=flat
[mit-url]: LICENSE
