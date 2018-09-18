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

    let httpParameterMap    = request.getHttpParameterMap();
    let logger = Logger.getLogger('GMO');
    let alterTranResult = null;
    let pDictObj = { OrderID : args.Order.getOrderNo(), Details : null };

    if(args.JobType == "Cancel"){
        // Assign
        let result = MakeDetails(args.Order);
        result.buyer.gmoTransactionId = args.Order.getCustom().gmoAccessID;
        let xmlstring = CreateXMLfromDetail(result);

        //httpInfo
        let topevel = XML('<top><kindInfo><updateKind/></kindInfo></top>');
        let httpHeaders = MakeHttpheaders();

        //Cancel == 2
        topevel.kindInfo.updateKind = 2;

        let prettyPrinting = XML.prettyPrinting;
        XML.prettyPrinting = false;
        pDictObj.Details = '<request>'+xmlstring+topevel.kindInfo.toString()+'</request>';
        XML.prettyPrinting = prettyPrinting;

        Transaction.wrap(function () {
            let alterTranCancel = require('~/../int_gmo/cartridge/scripts/gmo-ps/PostPayModifyTran');
            alterTranResult = alterTranCancel.execute(pDictObj);
        });
    } else if(args.JobType == "SalesCapture") {
        // Assign
        let result = MakeDetails(args.Order);
        result.buyer.gmoTransactionId = args.Order.getCustom().gmoAccessID;
        let detailObj = {
                result: result,
                transporterId: args.TransporterId,
                tracking: args.Tracking
        }
        let xmlstring = CreateXMLfromPDReq(detailObj);

        //httpInfo
        let topevel = XML('<top><httpInfo><httpHeader/><deviceInfo/></httpInfo></top>');
        let httpHeaders = MakeHttpheaders();

        topevel.httpInfo.httpHeader = httpHeaders;
        topevel.httpInfo.deviceInfo = httpParameterMap.get('fraudbuster').getValue();

        let prettyPrinting = XML.prettyPrinting;
        XML.prettyPrinting = false;
        pDictObj.Details = '<request>'+xmlstring+topevel.httpInfo.toString()+'</request>';
        XML.prettyPrinting = prettyPrinting;

        Transaction.wrap(function () {
            let alterTranSales = require('~/../int_gmo/cartridge/scripts/gmo-ps/PostPayPDReq');
            alterTranResult = alterTranSales.execute(pDictObj);
        });
    } else {
        logger.debug("GMOPostPay alter tran unkown JobType ={0}", args.JobType);
        return {error: true};
    }
    logger.debug("GMOPostPay({0}) alter tran result {1}", args.JobType, alterTranResult);

    if(alterTranResult == PIPELET_ERROR) {
        logger.debug("faild alter tran");
        return {error: true};
    }

    Transaction.wrap(function () {
        args.Order.getCustom().gmoIsAuthorization = false;
    });

    return {ok: true};
}

/**
 * Create Details infomation from Oder(or Basket)
 * @param    {Order|Basket}    args
 * @returns {Object}
 */
function MakeDetails(args) {
    let controller = require('~/../int_gmo/cartridge/controllers/postpay/MakeDetails');
    return controller.makeDetails(args);
}

/**
 * Create HttpHeaders infomation from Oder(or Basket)
 * @param    {Order|Basket}    args
 * @returns {Object}
 */
function MakeHttpheaders(args) {
    let controller = require('~/../int_gmo/cartridge/controllers/postpay/MakeHttpheaders');
    return controller.makeHttpheaders(args);
}

/**
 * Create XMLstring from Details
 * @param    MakeDetails()'s-returnvalue    args
 * @returns {Object}
 */
function CreateXMLfromDetail(args) {
    let controller = require('~/../int_gmo/cartridge/controllers/postpay/CreateXMLfromDetail');
    return controller.createXMLfromDetail(args);
}

/**
 * Create XMLstring from PDReq
 * @param    MakeDetails()'s-returnvalue    args
 * @returns {Object}
 */
function CreateXMLfromPDReq(args) {
    let controller = require('~/../int_gmo/cartridge/controllers/postpay/CreateXMLfromPDReq');
    return controller.createXMLfromPDReq(args);
}

exports.AlterTran            = AlterTran;
exports.AlterTran.public    = false;

exports.MakeDetails = MakeDetails;
exports.MakeDetails.public = true;

exports.MakeHttpheaders = MakeHttpheaders;
exports.MakeHttpheaders.public = true;

exports.CreateXMLfromDetail = CreateXMLfromDetail;
exports.CreateXMLfromDetail.public = true;

exports.CreateXMLfromPDReq = CreateXMLfromPDReq;
exports.CreateXMLfromPDReq.public = true;
