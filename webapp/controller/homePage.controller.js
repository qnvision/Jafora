sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageToast"

], function (Controller, Filter, FilterOperator, MessageToast) {
	"use strict";

	return Controller.extend("Jaf.JaforaMasofon.controller.homePage", {
		onInit: function () {

			this.appModel = this.getOwnerComponent().getModel("appData");
			this.appModel.setProperty("/inputValue", "")
			this.appModel.setProperty("/isButtonEnabled", false)
			console.log(this.appModel)
			var Language = localStorage.getItem("Language");
			var oHebrewButton = this.byId("hebrewButton");
			var oRussianButton = this.byId("russianButton");
			console.log(Language)
			if (Language === "he") {
				this.appModel.setProperty("/sentLanguage", "he")

				oHebrewButton.addStyleClass("HebrewButton");
				oHebrewButton.removeStyleClass("RussianButton");
				oRussianButton.addStyleClass("RussianButton");
				oRussianButton.removeStyleClass("HebrewButton");
			} else if (Language === "ru") {
				this.appModel.setProperty("/sentLanguage", "ru")

				oHebrewButton.addStyleClass("RussianButton");
				oHebrewButton.removeStyleClass("HebrewButton");
				oRussianButton.addStyleClass("HebrewButton");
				oRussianButton.removeStyleClass("RussianButton");
			}

			var oInput = this.byId("workerNumberInput");
			if (oInput) {
				setTimeout(function () {
					oInput.focus();
				}, 500);
			}

		},

		onKeyDown: function (oEvent) {
			// Display a message toast with "Hello" when any key is pressed
			MessageToast.show("Hello");
		},

		onValueLiveChange: function (oEvent) {
			// var sValue = oEvent.getParameter("newValue").trim(); 
			var sValue = oEvent.getParameters("suggest").suggestValue.trim()
			var oModel = this.getOwnerComponent().getModel("appData");
			if (!sValue) {
				oModel.setProperty("/filteredData", []);
				oModel.setProperty("/inputValue", "");
				oModel.setProperty("/isButtonEnabled", false);
				return;
			}
			var oODataModel = this.getOwnerComponent().getModel();
			var oFilter1 = new sap.ui.model.Filter("Zempoj", "EQ", sValue);
			var oFilter2 = new sap.ui.model.Filter("Zenamej", "EQ", sValue);
			// console.log(oFilter)
			oODataModel.read("/IdentificationSet", {
				filters: [oFilter1, oFilter2],
				success: function (oData) {
					console.log(oData.results)
					oModel.setProperty("/filteredData", oData.results);
				}
			});
			oModel.setProperty("/inputValue", sValue);
			oModel.setProperty("/isButtonEnabled", true);
		},

		onSuggestionItemSelected: function (oEvent) {
			var oSelectedItem = oEvent.getParameter("selectedItem");
			var sSelectedUser = oSelectedItem.getAdditionalText(); // Get the selected user
			var oModel = this.getOwnerComponent().getModel("appData");
			oModel.setProperty("/CurrentUser", sSelectedUser); // Save it in CurrentUser
		},

		onPressToMachineView: function () {

			var router = this.getOwnerComponent().getRouter();
			router.navTo("MachinePage");

		},
		onLanguageButtonPress: function (oEvent) {

			// Get the pressed button
			var oButton = oEvent.getSource();
			// Get references to both buttons
			var oHebrewButton = this.byId("hebrewButton");
			var oRussianButton = this.byId("russianButton");

			// Apply the selected class based on which button was pressed
			if (oButton === oHebrewButton) {
				localStorage.setItem("Language", "he");
				this.appModel.setProperty("/sentLanguage", "he")

				oHebrewButton.addStyleClass("HebrewButton");
				oHebrewButton.removeStyleClass("RussianButton");
				oRussianButton.addStyleClass("RussianButton");
				oRussianButton.removeStyleClass("HebrewButton");
				location.reload();

			} else if (oButton === oRussianButton) {
				localStorage.setItem("Language", "ru");
				this.appModel.setProperty("/sentLanguage", "ru")

				oHebrewButton.addStyleClass("RussianButton");
				oHebrewButton.removeStyleClass("HebrewButton");
				oRussianButton.addStyleClass("HebrewButton");
				oRussianButton.removeStyleClass("RussianButton");
				location.reload();
			}
		},


	});

});