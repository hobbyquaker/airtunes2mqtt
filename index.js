var pkg = require('./package.json');

var spawn = require('child_process').spawn;

var net = require('net');

var config = {
    prefix: 'airtunes',
    url: 'mqtt://localhost'
};


var mqtt = require('mqtt').connect(config.url, {will: {topic: config.prefix + '/connected', payload: '0'}});

mqtt.publish(config.prefix + '/connected', '2');

var topic = config.prefix + '/set/#';
console.log('mqtt subscribe ' + topic);
mqtt.subscribe(topic);

mqtt.on('message', function (topic, message) {
    console.log('mqtt < ', topic, message);
    var parts = topic.split('/');
    var speaker = parts[2];
    var command = parts[3];
    if (!speakers[speaker]) {
        console.log('unknown speaker', speaker);
        return;
    }

    switch (command) {
        case 'enable':
            if (message === 'false') {
                stop(speaker);
            } else if (message === 'true') {
                add(speaker);
            } else {
                try {
                    var obj = JSON.parse(message);
                    if (typeof obj.val !== undefined) {
                        console.log('obj.val=', obj.val);
                        if (obj.val) {
                            add(speaker);
                        } else {
                            stop(speaker);
                        }
                    }
                } catch (e) {
                    add(speaker);
                }
            }
            break;
        case 'disable':
            stop(speaker);
            break;
        case 'volume':
            if (isNaN(message)) {
                try {
                    var obj = JSON.parse(message);
                    setVolume(speaker, obj.val);
                } catch (e) {

                }
            } else {
                setVolume(speaker, parseInt(message, 10));
            }
            break;
    }
});


var airtunes = require('airtunes');

airtunes.on('buffer', function (status) {
    console.log('buffer', status);
});

var pipeActive;
startPipe();

// TODO remove hardcoded speaker config and load from json config file.
var speakers = {
    'Hobbyraum': {
        host: '172.16.23.103',
        port: 5000
    },
    'SoundFly': {
        host: '172.16.23.136',
        port: 1024
    },
    'Treppenhaus': {
        host: '172.16.23.124',
        port: 5002
    },
    'Waschküche': {
        host: '172.16.23.139',
        port: 5002
    }
};

function add(speaker, volume) {

    if (speakers[speaker] && speakers[speaker].device) {
        console.log('speaker', speaker, 'already added');
        return;
    }

    volume = volume || 20;
    console.log('add ' + speakers[speaker].host + ':' + speakers[speaker].port);

    console.log('mqtt >', config.prefix + '/status/' + speaker + '/connected', 1);
    mqtt.publish(config.prefix + '/status/' + speaker + '/connected', '1', {retain: true});

    speakers[speaker].device = airtunes.add(speakers[speaker].host, {
        port: speakers[speaker].port,
        volume: volume,
        password: speakers[speaker].password
    });

    speakers[speaker].device.on('status', function (status) {
        console.log('status', speaker, status);
        if (status === 'ready') {
            speakers[speaker].connected = true;

            console.log('mqtt >', config.prefix + '/status/' + speaker + '/connected', 2);
            mqtt.publish(config.prefix + '/status/' + speaker + '/connected', '2', {retain: true});
        } else if (status === 'stopped') {
            delete speakers[speaker].device;
            speakers[speaker].connected = false;


            console.log('mqtt >', config.prefix + '/status/' + speaker + '/connected', 0);
            mqtt.publish(config.prefix + '/status/' + speaker + '/connected', '0', {retain: true});
        }
    });

    speakers[speaker].device.on('error', function (err) {
        console.log('error', speaker, err);
        delete speakers[speaker].device;
        speakers[speaker].connected = false;

        console.log('mqtt >', config.prefix + '/status/' + speaker + '/connected', 0);
        mqtt.publish(config.prefix + '/status/' + speaker + '/connected', '0', {retain: true});

    });

}

function stop(speaker) {
    if (!speakers[speaker] || !speakers[speaker].device) {
        console.log('cant stop', speaker);
        return;
    }

    speakers[speaker].enabled = false;
    speakers[speaker].device.stop(function () {
        console.log('removed', speaker);
        delete speakers[speaker].device;
        speakers[speaker].connected = false;
    });
}

function setVolume(speaker, volume) {
    if (!speakers[speaker] || !speakers[speaker].device) return;
    console.log('volume', speaker, volume);
    speakers[speaker].device.setVolume(volume);
    mqtt.publish(config.prefix + '/status/' + speaker + '/volume', '' + volume, {retain: true});
}

var arecord;

function startPipe(loopback) {

    pipeActive = true;


    if (loopback) {

        arecord = spawn('/usr/bin/arecord', ['-f', 'cd', '-D', 'hw:Loopback,1']);
        arecord.stdout.pipe(airtunes);

    } else {

        var server = net.createServer(function(c) {
            console.log("Server connected");

            c.on('end', function() {
                console.log("Server disconnected");
                c.end();
            });

            c.pipe(airtunes, {end: false});

            /*
            c.on('data', function() {

            });
             */

        });

        server.listen(12346, function() {
            console.log("Server bound on port 12346");
        });

    }

}


