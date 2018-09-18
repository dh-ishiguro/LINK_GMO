'use strict'

/* API Includes */
var PaymentMgr         = require('dw/order/PaymentMgr');
var Status             = require('dw/system/Status');
var Transaction        = require('dw/system/Transaction');
var PaymentInstruments = require('dw/order/PaymentInstrument');

/* Script Modules */
var app                = require('~/cartridge/scripts/app');

/**
 * Verify credit card for new card
 * @param    {Object}    args
 *             {Basket}    args.Basket    use to create PaymentInstrument
 *             {Order}        args.Order  use to create PaymentInstrument
 * @returns {Object}
 */
function handle(args) {
    let parameterMap = request.getHttpParameterMap();

    /* Assign */
    session.getCustom().gmoSelectedCard = parameterMap.get('gmoPaymentCardList').getValue();

    // !(CurrentCustomer.authenticated && CurrentHttpParameterMap.gmoPaymentCardList.value!="AddNewCard")
    if( !(customer.authenticated && parameterMap.get('gmoPaymentCardList').getValue() != "AddNewCard") ){

        /* -- VerifyPaymentCard  ---*/
        // CurrentForms.billing.paymentMethods.creditCard.type.value
        let creditCard = session.forms.billing.paymentMethods.creditCard;

        let paymentCard      = PaymentMgr.getPaymentCard(creditCard.type.value);
        let cardNumber       = creditCard.number.value;
        let expirationMonth  = creditCard.expiration.month.value;
        let expirationYear   = creditCard.expiration.year.value;
        // Status
        let verifyPaymentCardResult = paymentCard.verify(expirationMonth, expirationYear, cardNumber);

        if (verifyPaymentCardResult.error === true) {
            return verifyError(creditCard, verifyPaymentCardResult, parameterMap);
        }

        if(creditCard.cvn.value === NaN){
            var creditCardStatus = new Status(1,"CREDITCARD_INVALID_SECURITY_CODE");
            return verifyError(creditCard, creditCardStatus, parameterMap);
        }
    }

    let pDictObj = {};
    let lineItemCtnr = args.Basket != null ? args.Basket : args.Order;
    let createPaymentInstrumentResult;
    Transaction.wrap(function() {
        /*--- ScriptFile checkout/CreatePaymentInstrument.ds ---*/
        let createPaymentInstrument = app.getAppCoreModule('cartridge/scripts/checkout/CreatePaymentInstrument');
        pDictObj = {
                LineItemCtnr        : lineItemCtnr,
                PaymentType         : PaymentInstruments.METHOD_CREDIT_CARD,
                RemoveExisting      : true,
                PaymentInstrument   : null
        };
        createPaymentInstrumentResult = createPaymentInstrument.execute(pDictObj);
    });

    if(createPaymentInstrumentResult == PIPELET_ERROR){
        return onError(parameterMap);
    }

    /* --- Assign --- */
    let paymentInstruments = pDictObj.PaymentInstrument;
    Transaction.wrap(function () {
        let creditCardToken = parameterMap.get('creditCardtoken').getStringValue();
        paymentInstruments.creditCardHolder            = "123";
        paymentInstruments.creditCardNumber            = parameterMap.get('hidCardNo').getStringValue();
        paymentInstruments.creditCardType              = parameterMap.get('hidCardType').getStringValue();
        paymentInstruments.creditCardExpirationMonth   = parameterMap.get('hidCardMonth').getStringValue();
        paymentInstruments.creditCardExpirationYear    = parameterMap.get('hidCardYear').getStringValue();
        paymentInstruments.custom.creditCardPayInfo    = parameterMap.get('hidCardPayInfo').getIntValue();
        paymentInstruments.custom.creditCardPayTime    = parameterMap.get('hidCardPayTime').getIntValue();
        let is3dSecure = (parameterMap.get('hidCard3dSecure').getIntValue() != 0) ? true : false;
        paymentInstruments.custom.is3dSecure           = is3dSecure;
        paymentInstruments.custom.creditCardSeq        = parameterMap.get('hidCardSeq').getStringValue();
        paymentInstruments.custom.creditCardToken      = creditCardToken;
        session.custom.creditCardToken                 = creditCardToken;
        let memberIsSaveCard = (parameterMap.get('dwfrm_billing_paymentMethods_creditCard_saveCard').booleanValue != null) ? true : false;
        paymentInstruments.custom.memberIsSaveCard     = memberIsSaveCard;
        paymentInstruments.custom.creditCardToken1     = parameterMap.get('creditCardtoken1').getStringValue();
    });

    /* --- Assign --- */
    session.custom.creditCardToken1 = parameterMap.get('creditCardtoken1').getStringValue();
    session.custom.hiddenCardSeq    = parameterMap.get('hidCardSeq').getStringValue();
    return {success: true};

}

/**
 * handling verify credit card error
 * @param {PaymentCard}    creditCard    verified card
 * @param {Status}            status        verify result status
 * @param {parameterMap}   HttpParameterMap formdata
 * @returns error object
 */
function verifyError(creditCard, status, parameterMap){
    // ScriptFile    checkout/InvalidatePaymentCardFormElements.ds
    let invalidatePaymentCardFormElements = app.getAppCoreModule('cartridge/scripts/checkout/InvalidatePaymentCardFormElements');
    let pDictObj = {CreditCardForm : creditCard, Status: status};
    invalidatePaymentCardFormElements.execute(pDictObj);
    return onError(parameterMap);
}

/**
 * handling all error
 * @param {parameterMap}   HttpParameterMap formdata
 * @returns eror object
 */
function onError(parameterMap){
    session.getCustom().gmoSelectedCard = parameterMap.get('hidCardSeq').getStringValue();
    return {error: true, gmoCreditCard : null, validateError : 1};
}

exports.handle = handle;
exports.handle.public = false;