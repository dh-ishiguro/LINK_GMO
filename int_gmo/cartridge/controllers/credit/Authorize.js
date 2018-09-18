'use strict'

var Site        = require('dw/system/Site');
var PaymentMgr  = require('dw/order/PaymentMgr');
var Transaction = require('dw/system/Transaction');
var ISML        = require('dw/template/ISML');

/**
 * Authorizes a payment using a credit card
 * @param    {Object}    args
 *               {Order}             args.Order
 *               {PaymentInstrument} args.PaymentInstrument
 * @param    {Function}  memberSaveCallback
 * @returns {Object}
 */
function authorize(args) {

    let paymentInstrument = args.PaymentInstrument;
    let order             = args.Order;
    let isNotGmoOnly      = Site.getCurrent().getCustomPreferenceValue("gmo_authorization_mode_only") === false;
    let URLUtils          = require('dw/web/URLUtils');

    let is3dSecure = paymentInstrument.custom.is3dSecure;
    let tdFlag = is3dSecure ? "1" : "0";

    // ScriptFile    gmo/EntryTran.ds
    let entryTran = require('~/cartridge/scripts/gmo/EntryTran');
    let jobCd = isNotGmoOnly ? "CAPTURE" : "AUTH";
    let pDictObj = {
            JobCd              : jobCd,
            Order              : order,
            TdFlag             : tdFlag,
            AccessID           : null,
            AccessPass         : null,
            HttpAccept         : null,
            HttpUserAgent      : null,
            DeviceCategory     : null,
            PaymentInstruments : paymentInstrument,
    };
    if(entryTran.execute(pDictObj) == PIPELET_ERROR){
        return {error: true};
    }

    if(is3dSecure){
        pDictObj.HttpAccept     = request.httpHeaders.accept;
        pDictObj.HttpUserAgent  = request.httpUserAgent;
        pDictObj.DeviceCategory = 0;
    }

    pDictObj.OrderID            = order.getOrderNo();
    pDictObj.PaymentInstruments = paymentInstrument;
    if(isNotGmoOnly){
        // Assign
        let memberId = (customer.authenticated) ? customer.getProfile().getCustomerNo() : "";
        // ScriptFile    gmo/ExecTran.ds
        let execTran = require('~/cartridge/scripts/gmo/ExecTran');
        pDictObj.MemberID = memberId;
        pDictObj.payment  = true;
        if(execTran.execute(pDictObj) == PIPELET_ERROR){
            return {error: true};
        }
    }else{
        // ScriptFile    gmo/ExecTranAuth.ds
        let execTranAuth = require('~/cartridge/scripts/gmo/ExecTranAuth');
        pDictObj.MemberID = order.getCustomerNo();
        if(execTranAuth.execute(pDictObj) == PIPELET_ERROR){
            return {error: true};
        }
        // Assign
        Transaction.wrap(function () {
            order.getCustom().gmoAccessID         = pDictObj.AccessID;
            order.getCustom().gmoAccessPass       = pDictObj.AccessPass;
            order.getCustom().gmoIsAuthorization  = true;
        });
    }

    let acs = pDictObj.resultPayment["ACS"];
    if(acs == "1") {
        session.getCustom().OrderID = order.getOrderNo();

        pDictObj.ACSUrl  = pDictObj.resultPayment["ACSUrl"];
        pDictObj.PaReq   = pDictObj.resultPayment["PaReq"];
        pDictObj.TermUrl = URLUtils.https('COPlaceOrder-GmoCreditSubmit');
        pDictObj.MD      = pDictObj.resultPayment["MD"];

        ISML.renderTemplate('payment/gmocreditredirect', pDictObj);

        return {WaitResult: true};

    } else {

        // GetPaymentProcessor
        let paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod()).getPaymentProcessor();
        // Assign
        Transaction.wrap(function () {
            paymentInstrument.paymentTransaction.transactionID    = order.getOrderNo();
            paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
            session.getCustom().gmoSelectedCard                   = "";
        });

        // GMO_PAYMENT-MemberSaveCard
        if(paymentInstrument.getCustom().memberIsSaveCard == true){
            session.getCustom().memberSaveCard = true;
            return {memberSaveCard: true};
        }

        session.getCustom().creditCardToken  = null;
        session.getCustom().creditCardToken1 = null;
        session.getCustom().hiddenCardSeq    = null;

        return {authorized: true};
    }
}

exports.authorize            = authorize;
exports.authorize.public    = false;