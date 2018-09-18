'use strict';

/**
 * @module int_gmo
 */
var cartridgeName = "int_gmo"

/**
 * Returns the controller with the given name.
 */
exports.getController = function (controllerName) {
    return require('~/../'+cartridgeName+'/cartridge/controllers/' + controllerName);
};
