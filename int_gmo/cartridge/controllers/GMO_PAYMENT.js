'use strict';

var app         = require('~/cartridge/scripts/app');

/**
 * Verify credit card for new card
 * @param    {Object}    args
 *             {Basket}    args.Basket    use to create PaymentInstrument
 *             {Order}        args.Order  use to create PaymentInstrument
 * @returns {Object}
 */
function Handle(args) {
	var controller = app.getController('/credit/Handle');
	return controller.handle(args);
}

/**
 * Authorizes a payment using a credit card
 * @param    {Object}    args
 *               {Order}             args.Order
 *               {PaymentInstrument} args.PaymentInstrument
 * @param    {Function}  memberSaveCallback
 * @returns {Object}
 */
function Authorize(args) {
	var controller = app.getController('/credit/Authorize');
	return controller.authorize(args);
}

/**
 * Handle for adding new card for member
 *   - check user is existed
 *   - send new card info to GMO to register a new card
 *
 * @param {dw.order.PaymentInstrument}	paymentInstrument	PaymentInstrument.
 * @param {string}						accessID
 * @param {string}						accessPass
 * @param {dw.order.Order}				Order
 * @returns {Object}
 */
function AddCard(paymentInstrument, accessID, accessPass, Order) {
	var controller = app.getController('/credit/AddCard');
	return controller.addCard(paymentInstrument, accessID, accessPass, Order);
}

/**
 * Check on/off GMO catridge
 * @returns {Object}
 */
function IsEnableGMO() {
	var controller = app.getController('/credit/IsEnableGMO');
	return controller.isEnableGMO();
}

/**
 * Get Card list from GMO service
 * @returns {Object}
 */
function GetCardList(basket) {
	var controller = app.getController('/credit/GetCardList');
	return controller.getCardList(basket);
}

/**
 * Get Card Pay Info from GMO service
 * @returns {Object}
 */
function GetCardPayInfo(basket) {
	var controller = app.getController('/credit/GetCardPayInfo');
	return controller.getCardPayInfo(basket);
}

/**
 * Get list cards from GMO
 * @returns {Object}
 */
function GetCartInfo() {
	var controller = app.getController('/credit/GetCartInfo');
	return controller.getCartInfo();
}

/**
 * Get credit card payment method information
 * @returns {Object}
 */
function GetCreditCardPaymentsInfo() {
	var controller = app.getController('/credit/GetCreditCardPaymentsInfo');
	return controller.getCreditCardPaymentsInfo();
}

/**
 * Delete card
 * @returns util/jsonMesg, Message on successful deletion of card information
 */
function DeleteCardInfo() {
	var controller = app.getController('/credit/DeleteCardInfo');
	return controller.deleteCardInfo();
}

/**
 * Verify card infomation
 * @returns {Object}
 */
function VerifyCreditCard() {
	var controller = app.getController('/credit/VerifyCreditCard');
	return controller.verifyCreditCard();
}

/**
 * Execute settlement after authentication
 * @returns {Object}
 */
function SecureTran(args) {
	var controller = app.getController('/credit/SecureTran');
	return controller.SecureTran(args);
}

exports.AddCard = AddCard;
exports.AddCard.public	= true;

exports.Authorize = Authorize;
exports.Authorize.public = true;

exports.DeleteCardInfo         = DeleteCardInfo;
exports.DeleteCardInfo.public = true;

exports.GetCardList = GetCardList;
exports.GetCardList.public = true;

exports.GetCardPayInfo = GetCardPayInfo;
exports.GetCardPayInfo.public = true;

exports.GetCartInfo = GetCartInfo;
exports.GetCartInfo.public = true;

exports.GetCreditCardPaymentsInfo = GetCreditCardPaymentsInfo;
exports.GetCreditCardPaymentsInfo.public = true;

exports.Handle = Handle;
exports.Handle.public = true;

exports.IsEnableGMO = IsEnableGMO;
exports.IsEnableGMO.public    = true;

exports.VerifyCreditCard         = VerifyCreditCard;
exports.VerifyCreditCard.public = true;

exports.SecureTran = SecureTran;
exports.SecureTran.public = true;

