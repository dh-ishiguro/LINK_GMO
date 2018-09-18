'use strict'

var GetCardInfo     = require('~/cartridge/scripts/gmo/GetCardInfo');
var Logger          = require('dw/system/Logger');
/**
 * Get Card list from GMO service
 * @returns {Object}
 */
function getCardList(basket) {
    var logger = Logger.getLogger('GMO');

    // ScriptFile gmo/GetCardInfo.ds
    // CurrentCustomer.profile.customerNo
    let customerProfile       = customer.getProfile();
    let customerNo            = customerProfile.getCustomerNo();
    let pDictObj = {
        CustomerNo : customerNo,
        CardList: null
    };
    if(GetCardInfo.execute(pDictObj) == PIPELET_ERROR){
        return {};
    }

    // Assign
    let gmoCreditCard = {};

    let number  = null;
    let type    = null;
    let month   = null;
    let year    = null;

    // expression Basket.paymentInstrument!= null
    if(basket.paymentInstrument != null){
        logger.debug("PAYMENT INSTRUMENT IS ***NOT*** NULL!!!!");
        // Assign
        // Basket.paymentInstrument.creditCardNumber
        number  = basket.paymentInstrument.creditCardNumber;
        // Basket.paymentInstrument.creditCardType
        type    = basket.paymentInstrument.creditCardType;
        // Basket.paymentInstrument.creditCardExpirationMonth
        month   = basket.paymentInstrument.creditCardExpirationMonth;
        // Basket.paymentInstrument.creditCardExpirationYear
        year    = basket.paymentInstrument.creditCardExpirationYear;

    }else{
        logger.debug("PAYMENT INSTRUMENT IS NULL!!!!");
        // expression ApplicableCreditCards!=null
        if(pDictObj.CardList != null){
            // Get first card to show billing as default
            // Asign
            // ApplicableCreditCards[0].creditCardNumber
            number  = pDictObj.CardList[0].creditCardNumber;
            // ApplicableCreditCards[0].creditCardType
            type    = pDictObj.CardList[0].creditCardType;
            // ApplicableCreditCards[0].creditCardExpirationMonth
            month   = pDictObj.CardList[0].creditCardExpirationMonth;
            // ApplicableCreditCards[0].creditCardExpirationYear
            year    = pDictObj.CardList[0].creditCardExpirationYear;
        }
    }
    gmoCreditCard = {
        number  : number,
        type    : type,
        month   : month,
        year    : year
    };
    return {
    	gmoCreditCard: gmoCreditCard,
    	applicableCreditCards: pDictObj.CardList
    }
}

exports.getCardList         = getCardList;
exports.getCardList.public = false;