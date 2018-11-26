/* global io, document, customElements */
/* eslint-disable import/extensions, import/no-unassigned-import */

import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';

import './airtunes-speaker';

class AirtunesApp extends PolymerElement {
    static get template() {
        return html`
        <style>
            :host {
                --paper-slider-knob-color: #3b8183;
                --paper-slider-active-color: #3b8183;
                --paper-slider-pin-color: #3b8183;
            
                --paper-toggle-button-checked-bar-color: #424b4b;
                --paper-toggle-button-checked-button-color: white;
                --paper-toggle-button-checked-ink-color: white;
                --paper-toggle-button-unchecked-bar-color: #ffffff;
                --paper-toggle-button-unchecked-button-color: #424b4b;
                --paper-toggle-button-unchecked-ink-color: #424b4b;
            }

            #container {
                padding: 6px;
                display: flex;
                flex-direction: row;
                justify-content: space-between;
            }
            
            #content {
                flex: 1 1 auto;
                min-width: 200px;
                max-width: 400px;
            }
            
            .fill {
                flex: 0 0 auto;
            }
            
           
        </style>
        <div id="container">
            <div class="fill"></div>
            <div id="content"></div>
            <div class="fill"></div>
        </div>
        `;
    }

    static get properties() {
        return {

        };
    }

    connectedCallback() {
        super.connectedCallback();
        const socket = io.connect();

        const {content} = this.$;
        const speakers = {};

        socket.on('connect', () => {
            socket.emit('speakers', config => {
                content.innerHTML = '';
                Object.keys(config).forEach(name => {
                    name = name.split(':')[0];

                    const el = document.createElement('airtunes-speaker');
                    el.name = name;
                    el.volume = config[name].volume || 0;
                    el.enabled = Boolean(config[name].enabled);

                    content.append(el);

                    el.addEventListener('volume-changed', data => {
                        socket.emit('volume', {name, volume: data.detail.value});
                    });

                    el.addEventListener('enabled-changed', data => {
                        socket.emit('enabled', {name, enabled: data.detail.value});
                    });

                    speakers[name] = el;
                });
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
    }
}

customElements.define('airtunes-app', AirtunesApp);
