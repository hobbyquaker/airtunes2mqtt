module.exports = require('yargs')
    .env('AIRTUNES2MQTT')
    .usage('Usage: $0 [options]')
    .describe('verbosity', 'possible values: "error", "warn", "info", "debug"')
    .describe('name', 'instance name. used as mqtt client id and as prefix for connected topic')
    .describe('mqtt-url', 'mqtt broker url. May contain user/password')
    .describe('speaker', 'name:host:port or name:host:portStart:portEnd of speaker. May be repeated.')
    .describe('port', 'TCP Listen port for audio reception')
    .describe('loopback', 'Use Alsa loopback device instead of TCP listener')
    .describe('device', 'Alsa loopback device')
    .describe('help', 'show help')
    .alias({
        h: 'help',
        u: 'mqtt-url',
        s: 'speaker',
        n: 'name',
        v: 'verbosity',
        p: 'port',
        l: 'loopback',
        d: 'device'
    })
    .boolean('loopback')
    .default({
        'mqtt-url': 'mqtt://127.0.0.1',
        name: 'airtunes',
        verbosity: 'info',
        p: 12346,
        d: 'hw:Loopback,1'
    })
    .demand('speaker')
    .version()
    .help('help')
    .argv;
