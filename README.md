# airtunes2mqtt

This is a little daemon that can retrieve an audio stream via TCP socket or from a Alsa Loopback device and stream it 
to Airplay/Airtunes compatible receivers. Via MQTT you can control the receivers volume and enable/disable the receivers.


This is a work in progress, a better Readme will follow asap. Right now the speaker config is hardcoded in index.js (see
Line 81).


## Getting started

Needs Node.js/npm

```sudo npm -g airtunes2mqtt
airtunes2mqtt --help
```

## Topics

* airtunes/set/&lt;speaker&gt;/enable
* airtunes/set/&lt;speaker&gt;/disable
* airtunes/set/&lt;speaker&gt;/volume (payload is a number between 0 and 100)


## License

Copyright (c) 2015 Sebastian 'hobbyquaker' Raff <hq@ccu.io>