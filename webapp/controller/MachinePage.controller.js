sap.ui.define([
	"sap/ui/core/Element",
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageToast"
], function (Element, Controller, MessageToast) {
	"use strict";
	return Controller.extend("Jaf.JaforaMasofon.controller.MachinePage", {

		onInit: function () {

			this.appModel = this.getOwnerComponent().getModel("appData");
			this.appModel.setProperty("/scanResult", "");
			this.appModel.setProperty("/scannedMachine", "");
			this.appModel.setProperty("/isBarcodeVisible", false);
			this.getOwnerComponent().getRouter().getRoute("MachinePage").attachPatternMatched(this._onRouteMatched, this);

			var oInput = this.byId("productInput2");
			oInput.setEditable(false);

			// Attach the global click event
			// Store the bound reference to use later for removal
			this._onKeyDownBound = this.onKeyDown.bind(this);
			// this._onKeyUpBound = this.onKeyUp.bind(this);

			// Add the event listeners
			document.addEventListener("keydown", this._onKeyDownBound);
			// document.addEventListener("keyup", this._onKeyUpBound);

		},
		_onRouteMatched: function () {
			document.addEventListener("keydown", this._onKeyDownBound);
	
		},

		onKeyDown: function (oEvent) {
			// Handle kseydown event
			var oInput = this.byId("productInput2");
			oInput.setEditable(true);

			oInput.focus();
			var machineScan = oInput.getValue();
			// Get the value of the input field
			if (machineScan) {
				this.onScanSuccess(machineScan);
				oInput.setEditable(false);
				document.removeEventListener("keydown", this._onKeyDownBound);
			}

		},
		// onKeyUp: function (oEvent) {
		// 	// Handle keyup event and set the input as non-editable
		// 	var oInput = this.byId("productInput2");
		// 	// var machineScan = oInput.getValue(); // Get the value of the input field
		// 	// if (machineScan) {
		// 	// 	this.onScanSuccess(machineScan);
		// 	// }
		// 	oInput.setEditable(false);
		// },

		onScanSuccess: function (machineScan) {
			if (!machineScan) {
				return;
			}
			var that = this;
			var oODataModel = this.getOwnerComponent().getModel();
			var oFilter = new sap.ui.model.Filter("Workcenter", "EQ", machineScan);
			// Fetch the OData response
			oODataModel.read("/MachineScanSet", {
				filters: [oFilter],
				urlParameters: {
					"$expand": "AllowedSkuNav"
				},
				success: function (oData) {
					that.appModel.setProperty("/CurrentMachineScanned", machineScan);
					that.appModel.setProperty("/scannedMachine", oData.results);
					that.appModel.setProperty("/originalWorkcenter", oData.results[0].Workcenter);
					
					// to make linedesc a number 
					oData.results.forEach(function (item) {
						// Remove non-numeric characters from Linedesc
						if (item.Workcenter) {
							item.Workcenter = item.Workcenter.replace(/\D/g, ''); // Keep only numbers
						}
					});
					var allowedSkuResults = oData.results[0].AllowedSkuNav.results;
					that.appModel.setProperty("/allowedSKUs", allowedSkuResults);
					that.appModel.setProperty("/scanResult", machineScan);

					if (true) {
						var router = that.getOwnerComponent().getRouter();
						router.navTo("MachineContent");
						that.appModel.setProperty("/isBarcodeVisible", true);
					} else {
						that.appModel.setProperty("/isBarcodeVisible", false);
					}
				},
				error: function (oError) {
					console.error("OData request failed:", oError);
				}
			});
			this.appModel.setProperty("/scanResult", "");

		},

		onScanError: function (oEvent) {
			MessageToast.show("Scan failed: " + oEvent, {
				duration: 1000
			});
		},

		navToHomePage: function () {
			var router = this.getOwnerComponent().getRouter();
			router.navTo("homePage");
			this.appModel = this.getOwnerComponent().getModel("appData");
			this.appModel.setProperty("/scanResult", "");
			this.appModel.setProperty("/isBarcodeVisible", false);
			this.appModel.setProperty("/inputValue", "");
			this.appModel.setProperty("/isButtonEnabled", false);
		},

	});
});