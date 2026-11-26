import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import {LayoutSwitcherService} from './layoutSwitcherService.js';

export default class LayoutSwitcherExtension extends Extension {
    enable() {
        this._service = new LayoutSwitcherService();
    }

    disable() {
        this._service.destroy();
        this._service = null;
    }
}


