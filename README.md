# airtunes2mqtt

[![mqtt-smarthome](https://img.shields.io/badge/mqtt-smarthome-blue.svg)](https://github.com/mqtt-smarthome/mqtt-smarthome)
[![NPM version](https://badge.fury.io/js/airtunes2mqtt.svg)](http://badge.fury.io/js/airtunes2mqtt)
[![Dependency Status](https://img.shields.io/gemnasium/hobbyquaker/airtunes2mqtt.svg?maxAge=2592000)](https://gemnasium.com/github.com/hobbyquaker/airtunes2mqtt)
[![Build Status](https://travis-ci.org/hobbyquaker/airtunes2mqtt.svg?branch=master)](https://travis-ci.org/hobbyquaker/airtunes2mqtt)
[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)
[![License][mit-badge]][mit-url]

> MQTT controlled Multi-Room Audio based on Airplay/Airtunes 

This is a little daemon that can retrieve an audio stream via TCP socket or from a Alsa Loopback device and stream it 
to Airplay/Airtunes compatible receivers. Via MQTT you can control the receivers volume and enable/disable the 
receivers. I'm using it in conjunction with [Mopidy](https://www.mopidy.com/) to create a MultiRoom SmartHome-integrated
audio playback system with several Airplay Speakers.

Based on [lperrins](https://github.com/lperrin) [node_airtunes](https://github.com/lperrin/node_airtunes) - all credits 
belong to him. Also thanks to [Adam Duncan](https://github.com/microadam) for creating a 
[fork]((https://github.com/microadam/node_airtunes) that works with recent´versions of Node.js.


## Installation

Prerequisite: Node.js >= 6

```
$ sudo npm install -g airtunes2mqtt
$ airtunes2mqtt --help
```


## Command Line Options

```
Usage: airtunes2mqtt [options]

Options:
  --version        Show version number                                 [boolean]
  -h, --help       Show help                                           [boolean]
  -u, --mqtt-url   mqtt broker url. May contain user/password
                                                   [default: "mqtt://127.0.0.1"]
  -s, --speaker    name:host:port or name:host:portStart:portEnd of speaker. May
                   be repeated.                                       [required]
  -n, --name       instance name. used as mqtt client id and as prefix for
                   connected topic                         [default: "airtunes"]
  -v, --verbosity  possible values: "error", "warn", "info", "debug"
                                                               [default: "info"]
  -p, --port       TCP Listen port for audio reception          [default: 12346]
  -l, --loopback   Use Alsa loopback device instead of TCP listener    [boolean]
  -d, --device     Alsa loopback device               [default: "hw:Loopback,1"]

```


### Example Command Line

```
$ airtunes2mqtt -s LivingRoom:192.168.2.100:5000 Kitchen:192.168.2.103:5000 -s SoundFly:192.168.2.105:1024:1032 -v debug

```

### Example Mopidy Configuration

```
[audio]
output = audioconvert ! audio/x-raw,format=S16LE,rate=44100,channels=2,layout=interleaved ! tcpclientsink host=127.0.0.1 port=12346
```

## Topics

### subscribed

* `airtunes/set/<speaker-name>/enable` - Enable or disable a speaker (payload can be `true`, `false`, `0` or `1)
* `airtunes/set/<speaker-name>/disable` - Disable a speaker (payload is irrelevant)
* `airtunes/set/<speaker-name>/volume` - Set a speakers volume (payload has to be a number between `0` and `100`)

### published

* `airtunes/connected` - Publishes `1` after airtunes2mqtt started, `2` when a client is connected via tcp socket 
respectively when the alsa loopback device is connected and `0` as last will.
* `airtunes/status/activeSpeakers` - Number of currently enables speakers.
* `airtunes/status/speaker/enable` - Actual speaker state.
* `airtunes/status/speaker/volume` - Actual speaker volume.

## License

Copyright (c) 2015-2018 Sebastian 'hobbyquaker' Raff <hq@ccu.io>

[mit-badge]: https://img.shields.io/badge/License-MIT-blue.svg?style=flat
[mit-url]: LICENSE
