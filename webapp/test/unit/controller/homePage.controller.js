/*global QUnit*/

sap.ui.define([
	"Jaf/JaforaMasofon/controller/homePage.controller"
], function (Controller) {
	"use strict";

	QUnit.module("homePage Controller");

	QUnit.test("I should test the homePage controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});