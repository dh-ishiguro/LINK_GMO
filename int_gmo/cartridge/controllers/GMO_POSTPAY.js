'use strict';

var app         = require('~/cartridge/scripts/app');

/**
 * Creates a payment instrument to 'Postpay'
 * @param    {Object}    args
 *             {Basket}   args.Basket    use to create PaymentInstrument
 * @returns {Object}
 */
function Handle(args) {
    let controller = app.getController('/postpay/Handle');
    return controller.handle(args);
}

/**
 * Authorizes payment using a Postpay
 * @param    {Object}    args
 *               {Order}             args.Order
 *               {PaymentInstrument} args.PaymentInstrument
 * @param    {Function}  memberSaveCallback
 * @returns {Object}
 */
function Authorize(args) {
    let controller = app.getController('/postpay/Authorize');
    return controller.authorize(args);
}

/**
 * Create Details infomation from Oder(or Basket)
 * @param    {Order|Basket}    args
 * @returns {Object}
 */
function MakeDetails(args) {
    let controller = app.getController('/postpay/MakeDetails');
    return controller.makeDetails(args);
}

/**
 * Create HttpHeaders infomation from Oder(or Basket)
 * @param    {Order|Basket}    args
 * @returns {Object}
 */
function MakeHttpheaders(args) {
    let controller = app.getController('/postpay/MakeHttpheaders');
    return controller.makeHttpheaders(args);
}

/**
 * Create XMLstring from Details
 * @param    MakeDetails()'s-returnvalue    args
 * @returns {Object}
 */
function CreateXMLfromDetail(args) {
    let controller = app.getController('/postpay/CreateXMLfromDetail');
    return controller.createXMLfromDetail(args);
}

exports.Handle = Handle;
exports.Handle.public = false;

exports.Authorize = Authorize;
exports.Authorize.public    = false;

exports.MakeDetails = MakeDetails;
exports.MakeDetails.public = true;

exports.MakeHttpheaders = MakeHttpheaders;
exports.MakeHttpheaders.public = true;

exports.CreateXMLfromDetail = CreateXMLfromDetail;
exports.CreateXMLfromDetail.public = true;
