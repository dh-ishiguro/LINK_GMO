'use strict';

/* API Includes */
var Site        = require('dw/system/Site');
var Transaction = require('dw/system/Transaction');
var ISML        = require('dw/template/ISML');
var PaymentMgr  = require('dw/order/PaymentMgr');
var Logger      = require('dw/system/Logger');
var Bytes       = require('dw/util/Bytes');
var MessageDigest = require('dw/crypto/MessageDigest');
var Encoding    = require('dw/crypto/Encoding');

/**
 * Authorizes payment using a RakutenID
 * @param    {Object}    args
 *               {Order}             args.Order
 *               {PaymentInstrument} args.PaymentInstrument
 * @param    {Function}  memberSaveCallback
 * @returns {Object}
 */
function authorize(args) {
    let paymentInstrument = args.PaymentInstrument;
	let order             = args.Order;
	let isCaptureOrAuth   = Site.getCurrent().getCustomPreferenceValue("gmo_rakutenid_auth_mode_only") === false;
	let URLUtils          = require('dw/web/URLUtils');
	let productLineItems = order.productLineItems;
	let logger = Logger.getLogger('GMO');
	let digestObj = new MessageDigest("MD5");
    let itemSubId = (customer.authenticated) ? digestObj.digest( new Bytes( customer.getProfile().getCustomerNo(), "UTF-8" )) : "";

	// ScriptFile    gmo/EntryTranRakutenId.ds
	let entryTran = require('~/cartridge/scripts/gmo/EntryTranRakutenId');
	let jobCd = isCaptureOrAuth ? "CAPTURE" : "AUTH";
	let pDictObj = {
			JobCd              : jobCd,
			Order              : order,
			AccessID           : null,
			AccessPass         : null,
			PaymentInstruments : paymentInstrument
	};
	if(entryTran.execute(pDictObj) == PIPELET_ERROR){
		return {error: true};
	}

	// ScriptFile    gmo/ExecTranRakutenId.ds
	let execTran = require('~/cartridge/scripts/gmo/ExecTranRakutenId');
	let pExecDictObj = {
			OrderID       : order.getOrderNo(),
			AccessID      : pDictObj.AccessID,
			AccessPass    : pDictObj.AccessPass,
			JobCd         : jobCd,
			ItemId        : productLineItems[0].productID,
			ItemSubId     : itemSubId,
			ItemName      : productLineItems[0].productName,
			RetURL        : URLUtils.https('COPlaceOrder-RakutenIdSubmit'),
			ErrorRcvURL   : URLUtils.https('COPlaceOrder-RakutenIdFail'),
			resultPayment : null,
			Token         : null
	};
	if(execTran.execute(pExecDictObj) == PIPELET_ERROR){
		return {error: true};
	}

    let paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod()).getPaymentProcessor();

	// Assign
	Transaction.wrap(function () {
		order.getCustom().gmoAccessID         = pExecDictObj.AccessID;
		order.getCustom().gmoAccessPass       = pExecDictObj.AccessPass;
		order.getCustom().gmoIsAuthorization  = isCaptureOrAuth ? false : true;
		paymentInstrument.paymentTransaction.transactionID    = order.getOrderNo();
		paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
	});

	// RakutenId Payment start interface
	let pIsmlDictObj = {
		AccessID : pDictObj.AccessID,
		Token    : pExecDictObj.Token
	};

	ISML.renderTemplate('payment/rakutenidredirect', pIsmlDictObj);

	return {WaitResult: true};
}

exports.authorize = authorize;
exports.authorize.public    = false;
