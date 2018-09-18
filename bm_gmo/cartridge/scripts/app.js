'use strict';

var int_gmo = require('~/../int_gmo/cartridge/scripts/app');

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
    return int_gmo.getAppCoreModule(moduleName);
};


/**
 * Returns the app controller module with the given name.
 */
exports.getAppControllerModule = function (moduleName) {
    return int_gmo.getAppControllerModule(moduleName);
};
