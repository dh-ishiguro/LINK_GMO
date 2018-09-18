'use strict';

var STORE_FRONT_CORE       = "app_gmo_core";
var STORE_FRONT_CONTROLLER = "app_gmo_controllers";

/**
 * Returns the controller with the given name.
 */
exports.getController = function (controllerName) {
    return require('~/cartridge/controllers/' + controllerName);
};

/**
 * Returns the app core module with the given name.
 */
exports.getAppCoreModule = function (moduleName) {
    return require('~/../' + STORE_FRONT_CORE + '/' + moduleName);
};

/**
 * Returns the app controller module with the given name.
 */
exports.getAppControllerModule = function (moduleName) {
    return require('~/../' + STORE_FRONT_CONTROLLER + '/' + moduleName);
};
