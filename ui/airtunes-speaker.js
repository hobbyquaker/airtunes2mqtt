/* global CustomEvent, customElements */
/* eslint-disable import/extensions, import/no-unassigned-import */

import {Element as PolymerElement} from '../node_modules/@polymer/polymer/polymer-element.js';

import '../node_modules/@polymer/paper-toggle-button/paper-toggle-button.js';
import '../node_modules/@polymer/paper-slider/paper-slider.js';

class AirtunesSpeaker extends PolymerElement {

    static get template() {
        return `<style>
                    paper-toggle-button {display: inline-block; vertical-align: middle;}
                    div.container {margin: 16px 0 16px;}
                    paper-slider {width: 100%}
                </style>
                <div class="container">
                    <paper-toggle-button checked="{{enabled}}"></paper-toggle-button>
                    <span class="title">[[name]]</span>
                    <paper-slider pin></paper-slider>
                </div>`;
    }

    connectedCallback() {
        super.connectedCallback();

        this.__slider = this.shadowRoot.querySelector('paper-slider');
        this.__slider.addEventListener('immediate-value-change', () => {
            this.volume = this.__slider.immediateValue;
            if (!this.__suppressEvent) {
                this.dispatchEvent(new CustomEvent('volume-changed', {detail: {volume: this.volume}}));
            }
        });
        this.__slider.addEventListener('value-changed', () => {
            this.volume = this.__slider.value;
            if (!this.__suppressEvent) {
                this.dispatchEvent(new CustomEvent('volume-changed', {detail: {volume: this.volume}}));
            }
        });

        this.__toggle = this.shadowRoot.querySelector('paper-toggle-button');
        this.__toggle.addEventListener('change', () => {
            this.enabled = this.__toggle.checked;
            this.dispatchEvent(new CustomEvent('enabled-changed', {detail: {enabled: this.enabled}}));
        });
    }

    _volumeChange(volume) {
        if (!this.__slider) {
            setTimeout(() => {
                this._volumeChange(volume);
            }, 100);
            return;
        }
        if (!this.__slider.pressed) {
            clearTimeout(this.__suppressTimeout);
            this.__suppressEvent = true;
            this.__slider.value = volume;
            this.__suppressTimeout = setTimeout(() => {
                this.__suppressEvent = false;
            }, 400);
        }
    }

    static get properties() {
        return {
            name: String,
            volume: Number,
            enabled: {
                type: Boolean,
                notify: true,
                readonly: false
            }
        };
    }

    static get observers() {
        return [
            '_volumeChange(volume)'
        ];
    }

}

customElements.define('airtunes-speaker', AirtunesSpeaker);
