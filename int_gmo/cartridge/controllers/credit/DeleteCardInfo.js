'use strict'

var DeleteCard              = require('~/cartridge/scripts/gmo/DeleteCard');
var RemoveProfileCardType   = require('~/cartridge/scripts/gmo/RemoveProfileCardType');
var Transaction             = require('dw/system/Transaction');
var ISML                    = require('dw/template/ISML');
var Logger          = require('dw/system/Logger');

/**
 * Delete card
 * @returns util/jsonMesg, Message on successful deletion of card information
 */
function deleteCardInfo() {

    //---debug---
    var logger = Logger.getLogger('GMO');
    logger.debug('credit/DeleteCardInfo.deleteCardInfo()');

    // Script gmo/DeleteCard.ds
    // CurrentCustomer.profile.customerNo
    let customerProfile     = customer.getProfile();
    let accountID           = customerProfile.getCustomerNo();
    // CurrentHttpParameterMap.CardNumber.stringValue
    let httpParameterMap    = request.getHttpParameterMap();
    let cardNumber          = httpParameterMap.get('CardNumber').getValue();
    // CurrentHttpParameterMap.CardSeq.stringValue
    let cardSeq             = httpParameterMap.get('CardSeq').getValue();
    let pDictObj = {
        AccountID    : accountID,
        CardNumber   : cardNumber,
        CardSeq      : cardSeq,
        Message      : null
    };

    //---debug---
    logger.debug('pDictObj --> {0}', JSON.stringify(pDictObj));

    if(DeleteCard.execute(pDictObj) == PIPELET_NEXT){

        //---debug---
        logger.debug('PIPELET_NEXT');

        Transaction.wrap(function() {
            // Script gmo/RemoveProfileCardType.ds
            pDictObj.cardSeq            = cardSeq;
            pDictObj.currentCustomer    = customer;
            pDictObj.profile = customerProfile;
            RemoveProfileCardType.execute(pDictObj);

            //---debug---
            logger.debug('RemoveProfileCardType');
        });
    }

    //---debug---
    logger.debug('pDictObj 2 --> {0}', JSON.stringify(pDictObj));

    // Template util/jsonMesg
    ISML.renderTemplate('util/jsonMesg', pDictObj);
}

exports.deleteCardInfo         = deleteCardInfo;
exports.deleteCardInfo.public = false;