'use strict';

var app         = require('~/cartridge/scripts/app');

/**
 * Creates a payment instrument to 'RakutenID'
 * @param    {Object}    args
 *             {Basket}   args.Basket    use to create PaymentInstrument
 * @returns {Object}
 */
function Handle(args) {
	let controller = app.getController('/rakutenid/Handle');
	return controller.handle(args);
}

/**
 * Authorizes payment using a RakutenID
 * @param    {Object}    args
 *               {Order}             args.Order
 *               {PaymentInstrument} args.PaymentInstrument
 * @param    {Function}  memberSaveCallback
 * @returns {Object}
 */
function Authorize(args) {
	let controller = app.getController('/rakutenid/Authorize');
	return controller.authorize(args);
}

exports.Handle = Handle;
exports.Handle.public = false;

exports.Authorize = Authorize;
exports.Authorize.public    = false;
