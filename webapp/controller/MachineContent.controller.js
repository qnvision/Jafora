sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/format/DateFormat",
	"sap/m/MessageToast"

], function (Controller, DateFormat, MessageToast) {
	"use strict";

	return Controller.extend("Jaf.JaforaMasofon.controller.MachineContent", {

		onInit: function () {

			this.appModel = this.getOwnerComponent().getModel("appData");
			this.appModel.setProperty("/selectedMachine", null);
			this.getOwnerComponent().getRouter().getRoute("MachineContent").attachPatternMatched(this._onRouteMatched, this);
			this.scanHistorySet = [];
			this.appModel.setProperty("/scanResult", " ");

			var oInput = this.byId("productInput");
			oInput.setEditable(false);

			// Attach the global click event
			document.addEventListener("keydown", this.onKeyDown.bind(this));
			document.addEventListener("keyup", this.onKeyUp.bind(this));

		},
		onKeyDown: function (oEvent) {
			var oInput = this.byId("productInput");
			oInput.setEditable(true);
			oInput.focus();

			oInput.attachLiveChange(function () {
				var materialScanResult = oInput.getValue().trim(); // Get the value of the input field

				if (materialScanResult) {
					this.onScanSuccess(materialScanResult); // Execute function when input has value
					oInput.setEditable(false);
				}
			}.bind(this));
		},

		onKeyUp: function (oEvent) {
			// Handle keyup event and set the input as non-editable
			var oInput = this.byId("productInput");
						var oInput = this.byId("productInput");
			oInput.setEditable(false);
			// var materialScanResult = oInput.getValue(); // Get the value of the input field
			// if (materialScanResult) {
			// 	this.onScanSuccess(materialScanResult);
			// }
			// oInput.setEditable(false);
		},

		_onRouteMatched: function () {
			this.onValueLiveChange();
						var oInput = this.byId("productInput");
			oInput.setEditable(false);
		},

		onScanSuccess: function (materialScanResult) {

			var that = this;
			var oODataModel = this.getOwnerComponent().getModel();
			// var materialScanResult = oEvent.getParameter("value") || "";
			materialScanResult = materialScanResult.trim();
			// Optionally, remove all spaces (including inside the string)
			var oList = this.getView().byId("materialList"); // Assuming this is the list of materials

			console.log(materialScanResult)
				// Remove the "correctItem" style from all list items at the start
			oList.getItems().forEach(function (oListItem) {
				var oFlexBox = oListItem.getContent()[0];
				oFlexBox.removeStyleClass("correctItem");
			});
			// Continue with scan logic
			if (/^[A-Za-z]/.test(materialScanResult)) {
				var oFilter = new sap.ui.model.Filter("Workcenter", "EQ", materialScanResult);
				oODataModel.read("/MachineScanSet", {
					filters: [oFilter],
					urlParameters: {
						"$expand": "AllowedSkuNav"
					},
					success: function (oData) {
						that.appModel.setProperty("/CurrentMachineScanned", materialScanResult);

						var allowedSkuResults = oData.results[0].AllowedSkuNav.results;
						that.appModel.setProperty("/originalWorkcenter", oData.results[0].Workcenter);
						oData.results.forEach(function (item) {
							if (item.Workcenter) {
								item.Workcenter = item.Workcenter.replace(/\D/g, ''); // Keep only numbers
							}
						});
						if (oData.results.length === 0 || !oData.results[0].Workcenter) {

							that.openUserMsgDialog3();
							that.appModel.setProperty("/scannedMachine", "");
							that.appModel.setProperty("/allowedSKUs", "");
						} else {
							that.appModel.setProperty("/scannedMachine", oData.results);
							that.appModel.setProperty("/allowedSKUs", allowedSkuResults);
						}
						that.appModel.setProperty("/scanResult", " ");
					},
					error: function (oError) {
						console.error("OData request failed:", oError);
					}
				});
				// If material scanned
			} else if (/^[0-9]/.test(materialScanResult)) {
				var workCenter = this.appModel.getProperty("/originalWorkcenter");
				var userId = this.appModel.getProperty("/CurrentUser");
				var sentLanguage = this.appModel.getProperty("/sentLanguage");
				var oFilter2 = new sap.ui.model.Filter("Workcenter", "EQ", workCenter);
				var oFilter3 = new sap.ui.model.Filter("Materialnumber", "EQ", materialScanResult);
				var oFilter4 = new sap.ui.model.Filter("EmpNumber", "EQ", userId);
				var oFilter5 = new sap.ui.model.Filter("InLanguage", "EQ", sentLanguage);

				oODataModel.read("/MaterialCheckSet", {
					filters: [oFilter2, oFilter3, oFilter4, oFilter5],
					success: function (oData) {
						if (Array.isArray(oData.results) && oData.results.length > 0) {
							that.appModel.setProperty("/MaterialCheck", oData.results);
							var materialData = that.appModel.getProperty("/MaterialCheck");
							var suitableMaterial = materialData[0].OutColor;
							var matchedItem = materialData[0].Message;
							that.appModel.setProperty("/MaterialMessage", matchedItem);
							var materialExist = materialData.some(function (item) {
								if (item.Materialnumber === materialScanResult) {
									// Find the index of the material in the allowedSKUs
									var outMakat = item.OutMakat;
									var allowedSKUs = that.appModel.getProperty("/allowedSKUs");
									var materialIndex = allowedSKUs.findIndex(function (sku) {
										return sku.Material === outMakat;

									});
									if (materialIndex !== -1) {
										var allowedSKUs = that.appModel.getProperty("/allowedSKUs");
										var correctItem = allowedSKUs.splice(materialIndex, 1)[0];
										allowedSKUs.unshift(correctItem);
										that.appModel.setProperty("/allowedSKUs", allowedSKUs);
										var oListItem = oList.getItems()[0];
										var oFlexBox = oListItem.getContent()[0];

										if (suitableMaterial === "GREEN") {
											var successSound = new Audio("sounds/success-soundJ.mp3");
											successSound.play();
											oFlexBox.addStyleClass("correctItem");

											setTimeout(function () {
												// Your code to execute after 5 seconds
												oFlexBox.removeStyleClass("correctItem");
											}, 5000); // 5000 milliseconds = 5 seconds
										}
									}
									if (suitableMaterial === "YELLOW") {
										var errorSound = new Audio("sounds/Error-soundJ.mp3");
										errorSound.play();
										if (navigator.vibrate) {
											navigator.vibrate(5000);
										}
										that.appModel.setProperty("/scanResult", materialScanResult);
										that.openUserMsgDialog();
									} else if (suitableMaterial === "RED") {
										var errorSound = new Audio("sounds/Error-soundJ.mp3");
										errorSound.play();
										if (navigator.vibrate) {
											navigator.vibrate(5000);
										}
										that.appModel.setProperty("/scanResult", materialScanResult);
										that.openUserMsgDialog2();
									}

								}
							});
						}
					}
				});
			}
			var oInput = this.byId("productInput");
			if (oInput) {
				oInput.setValue(""); // Reset input value to empty
				oInput.focus(); // Set focus back to the input field
			}
		},

		// else if (/^[0-9]/.test(materialScanResult)) {
		// 				var workCenter = this.appModel.getProperty("/scannedMachine/0/Workcenter");
		// 				var userId = this.appModel.getProperty("/CurrentUser");
		// 				var sentLanguage = this.appModel.getProperty("/sentLanguage");
		// 				var oFilter2 = new sap.ui.model.Filter("Workcenter", "EQ", workCenter);
		// 				var oFilter3 = new sap.ui.model.Filter("Materialnumber", "EQ", materialScanResult);
		// 				var oFilter4 = new sap.ui.model.Filter("EmpNumber", "EQ", userId);
		// 				var oFilter5 = new sap.ui.model.Filter("InLanguage", "EQ", sentLanguage);

		// 				oODataModel.read("/MaterialCheckSet", {
		// 					filters: [oFilter2, oFilter3, oFilter4, oFilter5],
		// 					success: function (oData) {
		// 						if (Array.isArray(oData.results) && oData.results.length > 0) {
		// 							that.appModel.setProperty("/MaterialCheck", oData.results);
		// 							var materialData = that.appModel.getProperty("/MaterialCheck");
		// 							var suitableMaterial = materialData[0].OutColor;
		// 							var matchedItem = materialData[0].Message;
		// 							that.appModel.setProperty("/MaterialMessage", matchedItem);
		// 							var materialExist = materialData.some(function (item) {
		// 								if (item.Materialnumber === materialScanResult) {
		// 									// Find the index of the material in the allowedSKUs
		// 									var outMakat = item.OutMakat;
		// 									var allowedSKUs = that.appModel.getProperty("/allowedSKUs");
		// 									var materialIndex = allowedSKUs.findIndex(function (sku) {
		// 										return sku.Material === outMakat;

		// 									});
		// 									if (materialIndex !== -1) {
		// 										// Handle the GREEN case
		// 										var oListItem = oList.getItems()[materialIndex]; // Get the correct list item
		// 										var oFlexBox = oListItem.getContent()[0];

		// 										if (suitableMaterial === "GREEN") {
		// 											var successSound = new Audio("sounds/success-sound.mp3");
		// 											successSound.play();
		// 											oFlexBox.addStyleClass("correctItem");
		// 										setTimeout(function () {
		// 											// Your code to execute after 5 seconds
		// 											oFlexBox.removeStyleClass("correctItem");
		// 										}, 5000); // 5000 milliseconds = 5 seconds
		// 										}
		// 									}
		// 									if (suitableMaterial === "YELLOW") {
		// 										var errorSound = new Audio("sounds/Error-sound.mp3");
		// 										errorSound.play();
		// 										if (navigator.vibrate) {
		// 											navigator.vibrate([1000, 500, 1000]);
		// 										}
		// 										that.appModel.setProperty("/scanResult", materialScanResult);
		// 										that.openUserMsgDialog();
		// 									} else if (suitableMaterial === "RED") {
		// 										var errorSound = new Audio("sounds/Error-sound.mp3");
		// 										errorSound.play();
		// 										if (navigator.vibrate) {
		// 											navigator.vibrate([1000, 500, 1000]);
		// 										}
		// 										that.appModel.setProperty("/scanResult", materialScanResult);
		// 										that.openUserMsgDialog2();
		// 									}

		// 								}
		// 							});
		// 						}
		// 					}
		// 				});
		// 			}
		// Reusable method for opening dialogs
		_openDialog: function (sDialogId, sFragmentName) {
			var oDialog = sap.ui.getCore().byId(sDialogId);
			if (!oDialog) {
				oDialog = sap.ui.xmlfragment(sFragmentName, this);
				this.getView().addDependent(oDialog);
			}
			oDialog.open();
		},

		// Reusable method for closing dialogs
		_closeDialog: function (sDialogId) {
			var oDialog = sap.ui.getCore().byId(sDialogId);
			if (oDialog) {
				oDialog.close();
			}
			this.appModel.setProperty("/scanResult", " ");

		},

		openUserMsgDialog: function () {
			this._openDialog("userMessageDialog", "Jaf.JaforaMasofon.fragments.errorMessage");
		},

		closeUserMsgDialog: function () {
			this._closeDialog("userMessageDialog");
		},
		MoreHistoryDetails: function (oEvent) {
			var sPath = oEvent.getSource().getBindingContext("appData").getPath();
			var oScanHistory = this.getView().getModel("appData").getProperty(sPath);
			this.getView().getModel("appData").setProperty("/MoreHistoryMaterial", oScanHistory);
			this._openDialog("MoreHistoryDialog", "Jaf.JaforaMasofon.fragments.MoreHistoryDialog");
		},

		openHistoryDialog: function () {
			var that = this;
			var curretMach = this.appModel.getProperty("/CurrentMachineScanned");
			var oODataModel1 = this.getOwnerComponent().getModel();
			var oFilter1 = new sap.ui.model.Filter("Arbpl", "EQ", curretMach);
			var oFilter2 = new sap.ui.model.Filter("Werks", "EQ", '3000');

			oODataModel1.read("/ScanHistorySet", {
				filters: [oFilter1, oFilter2],
				success: function (oData) {
					// Loop through ScanHistory results and update Result1 to a boolean
					oData.results.forEach(function (item) {
						if (item.Result1) {
							// Replace the value of Result1 with true or false
							if (item.Result1.includes('1')) {
								item.Result1 = true; // Set Result1 to true if it contains '1'
							} else if (item.Result1.includes('2')) {
								item.Result1 = false; // Set Result1 to false if it contains '2'
							}
						}
					});

					// Set the updated data to the ScanHistory model
					that.appModel.setProperty("/ScanHistory", oData.results);
				},
				error: function (oError) {
					console.error("OData request failed:", oError);
				}
			});
			this._openDialog("historyDialog", "Jaf.JaforaMasofon.fragments.historyDialog");
		},

		closeHistoryDialog: function () {
			this._closeDialog("historyDialog");
			var oInput = this.byId("productInput");
			if (oInput) {
				setTimeout(function () {
					oInput.focus();
				}, 500);
			}
		},
		closeMoreHistoryDialog: function () {
			this._closeDialog("MoreHistoryDialog");
		},

		openUserMsgDialog2: function () {
			this._openDialog("userMessageDialog2", "Jaf.JaforaMasofon.fragments.errorMessage2");
		},

		closeUserMsgDialog2: function () {
			this._closeDialog("userMessageDialog2");
		},

		openAreYouSure: function () {
			this._openDialog("areYouSure", "Jaf.JaforaMasofon.fragments.areYouSure");
		},

		closeAreYouSure: function () {
			this._closeDialog("areYouSure");
			this.navToHomePage();
		},

		closeAreYouSure2: function () {
			this._closeDialog("areYouSure");
		},

		openUserMsgDialog3: function () {
			this._openDialog("userMessageDialog3", "Jaf.JaforaMasofon.fragments.scanMachineError");
		},

		closeUserMsgDialog3: function () {
			this._closeDialog("userMessageDialog3");
			// this.navToMachinePage();
		},

		onValueLiveChange: function () {
			var sValue = this.appModel.getProperty("/scanResult");
			var aMachineScanSet = this.appModel.getProperty("/machineScanSet");

			var oMatchingMachine = aMachineScanSet.find(function (oMachine) {
				return oMachine.machineId === sValue;
			});

			this.appModel.setProperty("/inputValue", sValue);
			this.appModel.setProperty("/isButtonEnabled", !!oMatchingMachine);

			if (oMatchingMachine) {
				this.appModel.setProperty("/selectedMachine", oMatchingMachine);
			} else {
				this.appModel.setProperty("/selectedMachine", null);
			}
			var oInput = this.byId("productInput");
			if (oInput) {
				setTimeout(function () {
					oInput.focus();
				}, 500);
			}
		},

		navToHomePage: function () {
			var router = this.getOwnerComponent().getRouter();
			router.navTo("homePage");
			this.appModel = this.getOwnerComponent().getModel("appData");
			this.appModel.setProperty("/scanResult", "")
			this.appModel.setProperty("/isBarcodeVisible", false)
			this.appModel.setProperty("/inputValue", "")
			this.appModel.setProperty("/isButtonEnabled", false)
				// Reload the page after a short delay to allow navigation to complete
				// setTimeout(function () {
				// 	location.reload();
				// }, 100);
		},

		navToMachinePage: function () {
			this.appModel.setProperty("/scanResult", "");
			this.appModel.setProperty("/isBarcodeVisible", false);
			var router = this.getOwnerComponent().getRouter();
			router.navTo("MachinePage");
		},

		navToMachineContent: function () {
			var router = this.getOwnerComponent().getRouter();
			router.navTo("MachineContent");
		},
		formatTime: function (oTime) {
			if (!oTime || !oTime.ms) return ""; // Return empty if no time data is provided

			// Convert milliseconds to seconds
			const seconds = Math.floor(oTime.ms / 1000);
			const hours = Math.floor(seconds / 3600);
			const minutes = Math.floor((seconds % 3600) / 60);
			const remainingSeconds = seconds % 60;

			// Format the time as HH:mm:ss
			return `${this.padZero(hours)}:${this.padZero(minutes)}:${this.padZero(remainingSeconds)}`;
		},

		padZero: function (num) {
			return num < 10 ? '0' + num : num; // Add leading zero if the number is less than 10
		},

		formatDate: function (sDate) {
			if (!sDate) return ""; // Return empty if no date is provided

			// Create a Date object from the date string
			const date = new Date(sDate);

			// Format the date to a readable format (e.g., "dd/MM/yyyy")
			const oDateFormat = DateFormat.getDateInstance({
				pattern: "dd/MM/yyyy"
			});
			return oDateFormat.format(date);
		},
		_handleGlobalClick: function () {
			var oInput = this.byId("productInput");

			// Ensure the input regains focus
			setTimeout(function () {
				if (oInput) {
					oInput.focus();
				}
			}, 0);
		},

		onExit: function () {
			document.removeEventListener("keydown", this.onKeyDown);
			document.removeEventListener("keyup", this.onKeyUp);
		},

	});
});



						// var allowedSkuResults = oData.results[0].AllowedSkuNav.results;
						// oData.results.forEach(function (item) {
						// 	if (item.Workcenter) {
						// 		item.Workcenter = item.Workcenter.replace(/\D/g, ''); // Keep only numbers
						// 	}
						// });
			// var workcenterNumbers;

			// 			var allowedSkuResults = oData.results[0].AllowedSkuNav.results;
			// 			oData.results.forEach(function (item) {
			// 				if (item.Workcenter) {
			// 					workcenterNumbers = item.Workcenter.match(/\d+/g); // Extract only numbers
			// 					workcenterNumbers = workcenterNumbers ? workcenterNumbers.join('') : ''; // Join the numbers into a single string or set to empty if null
			// 					console.log("Extracted numbers:", workcenterNumbers);
			// 					// You can use 'workcenterNumbers' as needed without modifying 'item.Workcenter'
			// 					that.appModel.setProperty("/workcenterNumbers", workcenterNumbers);
			// 				}

			// 			});
			// 			if (oData.results.length === 0 || !workcenterNumbers) {