'use strict'

var Site			= require('dw/system/Site');
var PaymentMgr		= require('dw/order/PaymentMgr');
var Transaction		= require('dw/system/Transaction');
var ISML			= require('dw/template/ISML');
var Logger			= require('dw/system/Logger');
var app				= require('~/cartridge/scripts/app');
var Encoding		= require('dw/crypto/Encoding');
var Bytes			= require('dw/util/Bytes');
var MessageDigest	= require('dw/crypto/MessageDigest');
/* Script Modules */
var app				= require('~/cartridge/scripts/app');

/**
 * Authorizes a payment using a GMO Postpay
 * @param    {Object}    args
 *               {Order}             args.Order
 *               {PaymentInstrument} args.PaymentInstrument
 * @param    {Function}  memberSaveCallback
 * @returns {Object}
 */
function authorize(args) {
    var logger = Logger.getLogger('GMO');
    let paymentInstrument = args.PaymentInstrument;
    let order             = args.Order;
    let gmoPayment = app.getController('GMO_PAYMENT');
    let pDictObj = { OrderID : order.getOrderNo(), Details : null };
    let parameterMap = request.getHttpParameterMap();
    let gmoAccessID;

    let isEnable = gmoPayment.IsEnableGMO();
    if (isEnable.isEnableSMS == false) {
        let controller = app.getController('GMO_POSTPAY');

        // Assign
        let result = controller.MakeDetails(order);
        let xmlstring = controller.CreateXMLfromDetail(result);

        //httpInfo
        let topevel = XML('<top><httpInfo><httpHeader/><deviceInfo/></httpInfo></top>');
        let httpHeaders = controller.MakeHttpheaders();

        topevel.httpInfo.httpHeader = httpHeaders;
        topevel.httpInfo.deviceInfo = parameterMap.get('fraudbuster').getValue();

        let prettyPrinting = XML.prettyPrinting;
        XML.prettyPrinting = false;
        pDictObj.Details = '<request>'+xmlstring+topevel.httpInfo.toString()+'</request>';
        XML.prettyPrinting = prettyPrinting;

        // ScriptFile    gmo-ps/PostPayTran.ds
        let execTran = require('~/cartridge/scripts/gmo-ps/PostPayTran');
        if(execTran.execute(pDictObj) == PIPELET_ERROR){
            return {error: true};
        }
        gmoAccessID = pDictObj.AccessID;
    } else {
        logger.warn('postpay/Authorize.authorize() SMS authed');
        let JsonResult = parameterMap.get('gmoJsonResult').getValue();
        let JsonError = parameterMap.get('gmoJsonError').getValue();
        let JsonAuthorResult = parameterMap.get('gmoJsonAuthorResult').getValue();
        let JsonChksumRes = parameterMap.get('gmoJsonChksumRes').getValue();
        if ( JsonResult !== 'OK') {
            logger.warn('postpay/Authorize.authorize() JsonResult '+JsonResult);
            logger.warn('postpay/Authorize.authorize() gmoJsonError '+JsonError);
            updateShopTransactionId(args)
            return {error: true};
        }
        logger.warn('postpay/Authorize.authorize() JsonResult');
        gmoAccessID = parameterMap.get('gmoJsonGmoTransactionId').getValue();
        let checksumbase = dw.system.Site.getCurrent().getCustomPreferenceValue('gmo_postpay_shopcode') +
                dw.system.Site.getCurrent().getCustomPreferenceValue('gmo_postpay_connectpwd') +
                gmoAccessID + JsonAuthorResult;
        logger.warn('checksumbase = '+checksumbase);
        let digestObj = new MessageDigest("SHA-256");
        let ChksumRes = Encoding.toBase64(digestObj.digestBytes(new Bytes(checksumbase)));
        if (!ChksumRes.equals(JsonChksumRes)) {
            logger.warn('postpay/Authorize.authorize() JsonChksumRes '+JsonChksumRes+' != '+ChksumRes);
            updateShopTransactionId(args)
            return {error: true};
        }
        logger.warn('postpay/Authorize.authorize() JsonChksumRes');
        if ( JsonAuthorResult === 'NG' ) {
            logger.warn('postpay/Authorize.authorize() JsonAuthorResult '+JsonAuthorResult);
            logger.warn('postpay/Authorize.authorize() gmoJsonError '+JsonError);
            updateShopTransactionId(args)
            return {error: true};
        }
        logger.warn('postpay/Authorize.authorize() JsonAuthorResult');

    }

    // GetPaymentProcessor
    let paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod()).getPaymentProcessor();
    // Assign
    Transaction.wrap(function () {
        order.getCustom().gmoAccessID         = gmoAccessID;
        order.getCustom().gmoIsAuthorization  = true;
        paymentInstrument.paymentTransaction.transactionID    = order.getOrderNo();
        paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
        session.getCustom().gmoSelectedCard                   = "";
    });

    session.getCustom().creditCardToken  = null;
    session.getCustom().creditCardToken1 = null;
    session.getCustom().hiddenCardSeq    = null;
    session.getCustom().authorizeFailedFlg = null;

    return {authorized: true};
}

/**
 * Update ShopTransactionID.
 * @param args
 * @returns void
 */
function updateShopTransactionId(args) {
	var logger = Logger.getLogger('GMO');
	logger.info('postpay/Authorize.updateShopTransactionId() Try! TargetOrderID:'+args.Order.getOrderNo());
	let controller = app.getController('GMO_POSTPAY');
	let obj = {
			Basket: null,
			Order: args.Order,
	};
	session.getCustom().authorizeFailedFlg = true;
	controller.Handle(obj);
	session.getCustom().authorizeFailedFlg = null;
	logger.info('postpay/Authorize.updateShopTransactionId() shopTransactionId Updated!');
}

exports.authorize            = authorize;
exports.authorize.public    = false;
