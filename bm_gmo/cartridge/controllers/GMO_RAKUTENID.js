'use strict';

var Transaction = require('dw/system/Transaction');
var Logger      = require('dw/system/Logger');

/**
 * RakutenId cancel or capture order authorization
 * @param   {Object} args
 *           {Order}   args.Order
 *           {String}  args.JobType
 * @returns {Object} process result
 */
function AlterTran(args) {

    let logger = Logger.getLogger('GMO');
    let alterTranResult = null;
    let pDictObj = {
            OrderID       : args.Order.getOrderNo(),
            AccessID      : args.Order.getCustom().gmoAccessID,
            AccessPass    : args.Order.getCustom().gmoAccessPass
            };

    if(args.JobType == "Cancel"){
        Transaction.wrap(function () {
            let alterTranCancel = require('~/../int_gmo/cartridge/scripts/gmo/RakutenIdCancel');
            alterTranResult = alterTranCancel.execute(pDictObj);
        });
    } else if(args.JobType == "SalesCapture") {
        Transaction.wrap(function () {
            let alterTranSales = require('~/../int_gmo/cartridge/scripts/gmo/RakutenIdSales');
            alterTranResult = alterTranSales.execute(pDictObj);
        });
    } else {
        logger.debug("RakutenId alter tran unkown JobType ={0}", args.JobType);
        return {error: true};
    }
    logger.debug("RakutenId({0}) alter tran result {1}", args.JobType, alterTranResult);

    if(alterTranResult == PIPELET_ERROR) {
        logger.debug("faild alter tran");
        return {error: true};
    }

    Transaction.wrap(function () {
        args.Order.getCustom().gmoIsAuthorization = false;
    });

    return {ok: true};
}

exports.AlterTran            = AlterTran;
exports.AlterTran.public    = false;
