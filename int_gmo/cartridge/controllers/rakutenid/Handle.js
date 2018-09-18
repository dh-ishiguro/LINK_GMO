'use strict';

/* API Includes */
var Transaction = require('dw/system/Transaction');

/* Script Modules */
var app         = require('~/cartridge/scripts/app');

/**
 * Creates a payment instrument to 'RakutenID'
 * @param    {Object}    args
 *             {Basket}   args.Basket    use to create PaymentInstrument
 * @returns {Object}
 */
function handle(args) {
    let pDictObj = {};
    let lineItemCtnr = args.Basket != null ? args.Basket : args.Order;
    let paymentInstrument;
    Transaction.wrap(function() {
        /*--- ScriptFile checkout/CreatePaymentInstrument.ds ---*/
        let createPaymentInstrument = app.getAppCoreModule('cartridge/scripts/checkout/CreatePaymentInstrument');
        pDictObj = {
                LineItemCtnr        : lineItemCtnr,
                PaymentType         : 'RAKUTENID',
                RemoveExisting      : true,
                PaymentInstrument   : null
        };
        paymentInstrument = createPaymentInstrument.execute(pDictObj);
    })

	return {success: true};
}

exports.handle = handle;
exports.handle.public = false;
