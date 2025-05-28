sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"Jaf/JaforaMasofon/model/models"
], function (UIComponent, Device, models) {
	"use strict";

	return UIComponent.extend("Jaf.JaforaMasofon.Component", {

		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function () {
			var Lang = localStorage.getItem("Language");
			if (!Lang) {
				localStorage.setItem("Language", "he");
				Lang = localStorage.getItem("Language");
			}
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			sap.ui.getCore().getConfiguration().setLanguage(Lang);
			// enable routing
			this.getRouter().initialize();
			this.getRouter().navTo("homePage", {}, true); // `true` reloads the route

			// set the device model
			this.setModel(models.createDeviceModel(), "device");
		}
	});
});