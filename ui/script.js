/* global document, io */

const socket = io.connect();

const content = document.querySelector('#content');
const speakers = {};

socket.on('speakers', config => {
    Object.keys(config).forEach(name => {
        name = name.split(':')[0];

        const el = document.createElement('airtunes-speaker');
        el.name = name;
        el.volume = config[name].volume || 0;
        el.enabled = Boolean(config[name].enabled);

        content.append(el);

        el.addEventListener('volume-changed', data => {
            socket.emit('volume', {name, volume: data.detail.volume});
        });

        el.addEventListener('enabled-changed', data => {
            socket.emit('enabled', {name, enabled: data.detail.enabled});
        });

        speakers[name] = el;
    });
});

socket.on('volume', data => {
    if (speakers[data.name]) {
        speakers[data.name].volume = data.volume;
    }
});

socket.on('enabled', data => {
    if (speakers[data.name]) {
        speakers[data.name].enabled = data.enabled;
    }
});
