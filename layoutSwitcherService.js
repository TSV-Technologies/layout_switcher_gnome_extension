import Gio from 'gi://Gio';
import {getInputSourceManager} from 'resource:///org/gnome/shell/ui/status/keyboard.js';

const BUS_NAME = 'com.tsv.LayoutSwitcher';
const OBJECT_PATH = '/com/tsv/LayoutSwitcher';

const IFACE_XML = `
<node>
  <interface name="com.tsv.LayoutSwitcher">
    <method name="SetLayout">
      <arg name="layout" type="s" direction="in"/>
      <arg name="success" type="b" direction="out"/>
    </method>
    <method name="GetCurrentLayout">
      <arg name="layout" type="s" direction="out"/>
    </method>
    <method name="ListLayouts">
      <arg name="layouts" type="as" direction="out"/>
    </method>
  </interface>
</node>`;

export class LayoutSwitcherService {
    constructor() {
        this._inputSourceManager = getInputSourceManager();

        this._dbusObject = Gio.DBusExportedObject.wrapJSObject(IFACE_XML, this);
        this._dbusObject.export(Gio.DBus.session, OBJECT_PATH);

        this._ownerId = Gio.bus_own_name(Gio.BusType.SESSION, BUS_NAME,
            Gio.BusNameOwnerFlags.NONE, null, null, null);
    }

    destroy() {
        Gio.bus_unown_name(this._ownerId);
        this._ownerId = 0;

        this._dbusObject.unexport();
        this._dbusObject = null;

        this._inputSourceManager = null;
    }

    _getInputSources() {
        return Object.values(this._inputSourceManager.inputSources);
    }

    SetLayout(layout) {
        const source = this._getInputSources().find(s => s.id === layout);
        if (!source)
            return false;

        source.activate(true);
        return true;
    }

    GetCurrentLayout() {
        return this._inputSourceManager.currentSource?.id ?? '';
    }

    ListLayouts() {
        return this._getInputSources().map(s => s.id);
    }
}