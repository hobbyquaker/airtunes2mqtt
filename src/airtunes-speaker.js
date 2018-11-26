/* global CustomEvent, customElements */
/* eslint-disable import/extensions, import/no-unassigned-import */

import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';

import '@polymer/paper-toggle-button/paper-toggle-button.js';
import '@polymer/paper-slider/paper-slider.js';

class AirtunesSpeaker extends PolymerElement {
    static get template() {
        return html`
            <style>
                paper-toggle-button {display: inline-block; vertical-align: middle;}
                div.container {margin: 16px 0 16px;}
                paper-slider {width: 100%}
            </style>
            <div class="container">
                <paper-toggle-button></paper-toggle-button>
                <span class="title">[[name]]</span>
                <paper-slider pin></paper-slider>
            </div>`;
    }

    connectedCallback() {
        super.connectedCallback();
        const slider = this.shadowRoot.querySelector('paper-slider');
        slider.addEventListener('immediate-value-change', () => {
            this.dispatchEvent(new CustomEvent('volume-changed', {detail: {value: slider.immediateValue}}));
        });
        slider.addEventListener('change', () => {
            this.dispatchEvent(new CustomEvent('volume-changed', {detail: {value: slider.value}}));
        });
        const toggle = this.shadowRoot.querySelector('paper-toggle-button');
        toggle.addEventListener('checked-changed', event => {
            this.dispatchEvent(new CustomEvent('enabled-changed', {detail: {value: event.detail.value}}));
        });
    }

    _volumeChanged(volume) {
        const slider = this.shadowRoot.querySelector('paper-slider');
        if (!slider.dragging) {
            slider.value = volume;
        }
    }

    _checkedChanged(enabled) {
        const toggle = this.shadowRoot.querySelector('paper-toggle-button');
        if (enabled) {
            toggle.setAttribute('checked', '');
        } else {
            toggle.removeAttribute('checked');
        }
    }

    static get properties() {
        return {
            name: String,
            volume: {
                type: Number,
                observer: '_volumeChanged'
            },
            enabled: {
                type: Boolean,
                observer: '_checkedChanged'
            }
        };
    }
}

customElements.define('airtunes-speaker', AirtunesSpeaker);
