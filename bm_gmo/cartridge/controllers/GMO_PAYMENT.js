'use strict'

var Transaction    = require('dw/system/Transaction');
var Logger      = require('dw/system/Logger');

/**
 * Capture order authorization
 * @param   {Object} args
 *           {Order}  args.Order
 * @returns {Object} process result
 */
function salesCapture(args) {
    /*--- Assign ---*/
    let transactionType  = "1";
    let jobCd            = "SALES";
    return bmOrderHistoryGMOPayment(args, transactionType, jobCd);
}

/**
 * Cancel authorization
 * @param   {Object} args
 *           {Order}  args.Order
 * @returns {Object} process result
 */
function cancelAuthorization(args) {
    /*--- Assign ---*/
    let transactionType  = "2";
    let jobCd            = "VOID";
    return bmOrderHistoryGMOPayment(args, transactionType, jobCd);
}

/**
 * Set Order custom attr "gmoIsAuthorization" is false because It is capture
 * @param    {Object}    args
 *            {Order}     args.Order           order
 * @param    {String}    transactionType      transaction type string
 * @param    {String}    jobCd                job type string
 * @returns {Object} process result
 */
function bmOrderHistoryGMOPayment(args, transactionType, jobCd) {
    let logger = Logger.getLogger('GMO');
    let pDictObj = {
            JobCd                : jobCd,
            Order                : args.Order,
            transactionType      : transactionType,
            resultTransaction    : null
            };
    let alterTranResult = null;

    // ScriptFile    gmo/AlterTran.ds
    Transaction.wrap(function () {
        let alterTran = require('~/../int_gmo/cartridge/scripts/gmo/AlterTran');
        alterTranResult = alterTran.execute(pDictObj);
        logger.debug("alter tran result {0}", alterTranResult);
    });

    if(alterTranResult == PIPELET_ERROR || pDictObj.resultTransaction !== "1"){
        logger.debug("faild alter tran");
        return {error: true};
    }

    // Assign
    Transaction.wrap(function () {
        args.Order.getCustom().gmoIsAuthorization = false;
    });

    return {ok:true};

}

exports.CancelAuthorization              = cancelAuthorization;
exports.CancelAuthorization.public      = true;

exports.SalesCapture                     = salesCapture;
exports.SalesCapture.public             = true;

