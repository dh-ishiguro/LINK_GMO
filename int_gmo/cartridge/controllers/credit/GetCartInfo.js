'use strict'

/**
 * Get list cards from GMO
 * @returns {Object}
 */
function getCartInfo() {

    // ds module
    let getCardInfo = require('~/cartridge/scripts/gmo/GetCardInfo');

    // Login
    var customerProfile = customer.getProfile();
    if(customerProfile == null){
        return {error:true};
    }

    let customerNo = customerProfile.getCustomerNo();
    var pDictObj = {
            CustomerNo : customerNo,
            CardList: null,
        };
    if(getCardInfo.execute(pDictObj) == PIPELET_ERROR) {
        return {error : true};
    }
    return {ApplicableCreditCards : pDictObj.CardList};
}

exports.getCartInfo = getCartInfo;
exports.getCartInfo.public = false;
