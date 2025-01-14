/* L.Map.mergeOptions({
 editControl: true
 }); */
/**
 * @class L.EditToolbar
 * @aka EditToolbar
 */
L.EditToolbar = L.Toolbar.extend({
  statics: {
    TYPE: "edit"
  },

  options: {
    edit: {
      selectedPathOptions: {
        dashArray: "10, 10",

        fill: true,
        fillColor: "#fe57a1",
        fillOpacity: 0.1,

        // Whether to user the existing layers color
        maintainColor: false
      }
    },
    remove: {},
    poly: null,
    featureGroup: null /* REQUIRED! TODO: perhaps if not set then all layers on the map are selectable? */
  },

  // @method intialize(): void
  initialize(options) {

    // Need to set this manually since null is an acceptable value here
    if (options.edit) {
      if (typeof options.edit.selectedPathOptions === "undefined") {
        options.edit.selectedPathOptions = this.options.edit.selectedPathOptions;
      }
      options.edit.selectedPathOptions = L.extend({}, this.options.edit.selectedPathOptions, options.edit.selectedPathOptions);
    }

    if (options.remove) {
      options.remove = L.extend({}, this.options.remove, options.remove);
    }

    if (options.poly) {
      options.poly = L.extend({}, this.options.poly, options.poly);
    }

    this._toolbarClass = "leaflet-draw-edit";
    L.Toolbar.prototype.initialize.call(this, options);

    this._selectedFeatureCount = 0;
  },

  // @method getModeHandlers(): object
  // Get mode handlers information
  getModeHandlers(map) {
    let {featureGroup} = this.options;

    return [
      {
        enabled: this.options.edit,
        handler: new L.EditToolbar.Edit(map, {
          featureGroup,
          selectedPathOptions: this.options.edit.selectedPathOptions,
          poly: this.options.poly
        }),
        title: L.drawLocal.edit.toolbar.buttons.edit
      },
      {
        enabled: this.options.remove,
        handler: new L.EditToolbar.Delete(map, {
          featureGroup
        }),
        title: L.drawLocal.edit.toolbar.buttons.remove
      }
    ];
  },

  // @method getActions(): object
  // Get actions information
  getActions(handler) {
    let actions = [
      {
        type: "save",
        enabled: this._save,
        title: L.drawLocal.edit.toolbar.actions.save.title,
        text: L.drawLocal.edit.toolbar.actions.save.text,
        callback: this._save,
        context: this
      },
      {
        type: "cancel",
        enabled: this.disable,
        title: L.drawLocal.edit.toolbar.actions.cancel.title,
        text: L.drawLocal.edit.toolbar.actions.cancel.text,
        callback: this.disable,
        context: this
      }
    ];

    if (handler.removeAllLayers) {
      actions.push({
        type: "clearAll",
        enabled: this._clearAllLayers,
        title: L.drawLocal.edit.toolbar.actions.clearAll.title,
        text: L.drawLocal.edit.toolbar.actions.clearAll.text,
        callback: this._clearAllLayers,
        context: this
      });
    }

    return actions;
  },

  // @method addToolbar(map): L.DomUtil
  // Adds the toolbar to the map
  addToolbar(map) {
    let container = L.Toolbar.prototype.addToolbar.call(this, map);

    this._checkDisabled();

    this.options.featureGroup.on("layeradd layerremove", this._checkDisabled, this);

    return container;
  },

  // @method removeToolbar(): void
  // Removes the toolbar from the map
  removeToolbar() {
    this.options.featureGroup.off("layeradd layerremove", this._checkDisabled, this);

    L.Toolbar.prototype.removeToolbar.call(this);
  },

  // @method disable(): void
  // Disables the toolbar
  disable() {
    if (!this.enabled()) {
      return;
    }

    this._activeMode.handler.revertLayers();

    L.Toolbar.prototype.disable.call(this);
  },

  _save() {
    this._activeMode.handler.save();
    if (this._activeMode) {
      this._activeMode.handler.disable();
    }
  },

  _clearAllLayers() {
    this._activeMode.handler.removeAllLayers();
    if (this._activeMode) {
      this._activeMode.handler.disable();
    }
  },

  _checkDisabled() {
    let {featureGroup} = this.options;
    let hasLayers = featureGroup.getLayers().length !== 0;
    let button;

    if (this.options.edit) {
      if (this._modes[L.EditToolbar.Edit.TYPE].button) {
        button = this._modes[L.EditToolbar.Edit.TYPE].button;

        if (hasLayers) {
          L.DomUtil.removeClass(button, "leaflet-disabled");
        } else {
          L.DomUtil.addClass(button, "leaflet-disabled");
        }

        button.setAttribute(
          "title",
          hasLayers ?
            L.drawLocal.edit.toolbar.buttons.edit
            : L.drawLocal.edit.toolbar.buttons.editDisabled
        );
      }
    }

    if (this.options.remove) {
      if (this._modes[L.EditToolbar.Delete.TYPE].button) {
        button = this._modes[L.EditToolbar.Delete.TYPE].button;

        if (hasLayers) {
          L.DomUtil.removeClass(button, "leaflet-disabled");
        } else {
          L.DomUtil.addClass(button, "leaflet-disabled");
        }

        button.setAttribute(
          "title",
          hasLayers ?
            L.drawLocal.edit.toolbar.buttons.remove
            : L.drawLocal.edit.toolbar.buttons.removeDisabled
        );
      }
    }
  }
});
