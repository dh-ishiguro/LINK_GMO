'use strict'

var GetCardInfo     = require('~/cartridge/scripts/gmo/GetCardInfo');
var Logger          = require('dw/system/Logger');
/**
 * Get Card Pay Info from GMO service
 * @returns {Object}
 */
function getCardPayInfo(basket) {
    var logger = Logger.getLogger('GMO');

    // Assign
    let gmoCreditPayInfo = {};

    let payinfo = null;
    let paytime = null;

    // expression Basket.paymentInstrument!= null
    if(basket.paymentInstrument != null){
        logger.debug("PAYMENT INSTRUMENT IS ***NOT*** NULL!!!!");
        // Assign
        payinfo = basket.paymentInstrument.custom.creditCardPayInfo;
        // Basket.paymentInstrument.custom.creditCardPayTime
        paytime = basket.paymentInstrument.custom.creditCardPayTime;

    }
    gmoCreditPayInfo = {
        payinfo : payinfo,
    	paytime : paytime
    };
    return {
    	gmoCreditPayInfo: gmoCreditPayInfo
    }
}

exports.getCardPayInfo         = getCardPayInfo;
exports.getCardPayInfo.public = false;