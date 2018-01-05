#!/usr/bin/env node

/* eslint-disable unicorn/no-process-exit */

const spawn = require('child_process').spawn;
const net = require('net');

const airtunes = require('airtunes');
const Mqtt = require('mqtt');
const log = require('yalm');

const pkg = require('./package.json');
const config = require('./config.js');

log.setLevel(config.verbosity);

if (typeof config.speaker === 'string') {
    config.speaker = [config.speaker];
}

const speakers = {};
let count = 0;
let connected = false;

log.info(pkg.name, pkg.version, 'starting');

const mqtt = Mqtt.connect(config.mqttUrl, {will: {topic: config.name + '/connected', payload: '0', retain: true}});

config.speaker.forEach(speaker => {
    let port;
    let [name, host, portStart, portEnd] = speaker.split(':');
    if (typeof portEnd === 'undefined') {
        port = portStart;
        portStart = undefined;
    }
    if (name && host && (port || (portStart && portEnd))) {
        speakers[name] = {host, port, portStart, portEnd};
        mqttPub(config.name + '/status/' + name + '/enable', '0', {retain: true});
    } else {
        console.error('invalid speaker config', speaker);
        process.exit(1);
    }
});

mqtt.on('connect', () => {
    log.info('mqtt connected', config.mqttUrl);

    mqttPub(config.name + '/connected', connected ? '2' : '1', {retain: true});

    const topic = config.name + '/set/#';
    log.info('mqtt subscribe ' + topic);
    mqtt.subscribe(topic);
});

mqtt.on('close', () => {
    log.info('mqtt closed ' + config.mqttUrl);
});

mqtt.on('error', err => {
    log.error('mqtt', err.toString());
});

mqtt.on('offline', () => {
    log.error('mqtt offline');
});

mqtt.on('reconnect', () => {
    log.info('mqtt reconnect');
});

mqtt.on('message', (topic, message) => {
    message = message.toString();
    log.debug('mqtt < ', topic, message);
    const [, , speaker, command] = topic.split('/');
    if (!speakers[speaker]) {
        log.info('unknown speaker', speaker);
        return;
    }

    let obj;

    switch (command) {
        case 'enable':
            if (message === 'false' || message === '0') {
                stop(speaker);
            } else if (message === 'true' || parseInt(message, 10) > 0) {
                add(speaker);
            } else {
                try {
                    obj = JSON.parse(message);
                    if (obj.val) {
                        add(speaker);
                    } else {
                        stop(speaker);
                    }
                } catch (err) {
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
                    obj = JSON.parse(message);
                    setVolume(speaker, obj.val);
                } catch (err) {

                }
            } else {
                setVolume(speaker, parseInt(message, 10));
            }
            break;
        default:
    }
});

airtunes.on('buffer', status => {
    log.debug('buffer', status);
});

startPipe();

function add(speaker, volume, nosearch) {
    log.debug('add', speaker, {host: speakers[speaker].host, port: speakers[speaker].port, portStart: speakers[speaker].portStart, portEnd: speakers[speaker].portEnd});
    if (speakers[speaker].portStart && !nosearch) {
        findport(speakers[speaker].host, speakers[speaker].portStart, speakers[speaker].portEnd, p => {
            if (p) {
                speakers[speaker].port = p;
                log.debug('found port', speaker, p);
                add(speaker, volume, true);
            } else {
                speakers[speaker].connected = false;

                mqttPub(config.name + '/status/' + speaker + '/enable', '0', {retain: true});
            }
        });
        return;
    }

    if (speakers[speaker] && speakers[speaker].device) {
        log.warn('speaker', speaker, 'already added');
        return;
    }

    volume = volume || 20;

    log.info('add ' + speaker + ' ' + speakers[speaker].host + ':' + speakers[speaker].port);

    mqttPub(config.name + '/status/' + speaker + '/connected', '1', {retain: true});

    speakers[speaker].device = airtunes.add(speakers[speaker].host, {
        port: speakers[speaker].port,
        volume,
        password: speakers[speaker].password
    });

    speakers[speaker].device.on('status', status => {
        log.info('status', speaker, status);
        if (status === 'ready') {
            speakers[speaker].connected = true;
            activeSpeakers();
            mqttPub(config.name + '/status/' + speaker + '/enable', '1', {retain: true});
        } else if (status === 'stopped') {
            delete speakers[speaker].device;
            speakers[speaker].connected = false;
            activeSpeakers();

            mqttPub(config.name + '/status/' + speaker + '/enable', '0', {retain: true});
        }
    });

    speakers[speaker].device.on('error', err => {
        log.error('error', speaker, err);
        delete speakers[speaker].device;
        speakers[speaker].connected = false;
        activeSpeakers();

        mqttPub(config.name + '/status/' + speaker + '/enable', '0', {retain: true});
    });
}

function activeSpeakers() {
    for (const s in speakers) {
        if (speakers[s].connected === true) {
            count += 1;
        }
    }
    mqttPub(config.name + '/status/activeSpeakers', String(count), {retain: true});
}

function stop(speaker) {
    if (!speakers[speaker] || !speakers[speaker].device) {
        log.warn('cant stop', speaker);
        return;
    }

    speakers[speaker].enabled = false;
    speakers[speaker].device.stop(() => {
        log.info('removed', speaker);
        delete speakers[speaker].device;
        speakers[speaker].connected = false;
        activeSpeakers();
    });
}

function setVolume(speaker, volume) {
    if (!speakers[speaker] || !speakers[speaker].device) {
        return;
    }
    log.debug('volume', speaker, volume);
    speakers[speaker].device.setVolume(volume);
    mqttPub(config.name + '/status/' + speaker + '/volume', String(volume), {retain: true});
}

let arecord;

function startPipe() {
    if (config.loopback) {
        arecord = spawn('/usr/bin/arecord', ['-f', 'cd', '-D', config.device]);
        arecord.stdout.pipe(airtunes);
        connected = true;
        log.info('Loopback connected');
        mqttPub(config.name + '/connected', '2', {retain: true});
        arecord.on('exit', () => {
            connected = false;
            log.info('Loopback disconnected');
            mqttPub(config.name + '/connected', '1', {retain: true});
        });
    } else {
        const server = net.createServer(c => {
            log.info('tcp client', c.remoteAddress + ':' + c.remotePort, 'connected');
            mqttPub(config.name + '/connected', '2', {retain: true});

            c.on('end', () => {
                connected = false;
                log.info('tcp client disconnected');
                c.end();
                mqttPub(config.name + '/connected', '1', {retain: true});
            });

            c.pipe(airtunes, {end: false});
            connected = true;
        });

        server.listen(config.port, () => {
            log.info('tcp listener bound on port', config.port);
        });
    }
}

function findport(host, start, end, cb) {
    const timeout = setTimeout(() => {
        cb(null);
        cb = null;
    }, 5000);
    for (let p = start; p <= end; p++) {
        const client = net.connect({host, port: p}, () => {
            clearTimeout(timeout);
            if (cb) {
                cb(p);
            }
            cb = null;
            client.end();
        });
        client.on('error', () => {});
    }
}

function mqttPub(topic, payload, options) {
    log.debug('mqtt >', topic, payload);
    mqtt.publish(topic, payload, options);
}
