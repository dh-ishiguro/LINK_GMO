'use strict'

var InvalidatePaymentCardFormElements    = require('~/cartridge/scripts/checkout/InvalidatePaymentCardFormElements');
var system                               = require('dw/system');
var PaymentMgr                           = require('dw/order/PaymentMgr');

/**
 * Verify card infomation
 * @returns {Object}
 */
function verifyCreditCard() {
    // VerifyPaymentCard
    let cardForm        = session.getForms().paymentinstruments.creditcards.newcreditcard;
    // CurrentForms.paymentinstruments.creditcards.newcreditcard.expiration.year.value
    let expiresYear     = cardForm.expiration.year.value;
    // CurrentForms.paymentinstruments.creditcards.newcreditcard.expiration.month.value
    let expiresMonth    = cardForm.expiration.month.value;
    // CurrentForms.paymentinstruments.creditcards.newcreditcard.number.value
    let cardNumber      = cardForm.number.value;
    // CurrentForms.paymentinstruments.creditcards.newcreditcard.cvn.value
    let csc             = cardForm.cvn.value;
    // dw.order.PaymentMgr.getPaymentCard(CurrentForms.paymentinstruments.creditcards.newcreditcard.type.value)
    let paymentCard     = PaymentMgr.getPaymentCard(cardForm.type.value);
    let verifyPaymentCardResult = paymentCard.verify(expiresMonth, expiresYear, cardNumber, csc);

    if (verifyPaymentCardResult.error !== true) {
        // expression !isNaN(CurrentForms.paymentinstruments.creditcards.newcreditcard.cvn.value)
        if (!isNaN(csc)) {
            return {ok : true};
        }else{
            //Assign
            var Status = system.Status(1,"CREDITCARD_INVALID_SECURITY_CODE");
        }
    }

    // Script checkout/InvalidatePaymentCardFormElements.ds
    let pDictObj = {
            //CurrentForms.paymentinstruments.creditcards.newcreditcard
            CreditCardForm    : cardForm,
            //Status
            Status            : Status
    };
    InvalidatePaymentCardFormElements.execute(pDictObj);

    return {error : true};
}

exports.verifyCreditCard         = verifyCreditCard;
exports.verifyCreditCard.public = false;