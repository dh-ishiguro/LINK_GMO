'use strict'

var ArrayList			= require('dw/util/ArrayList');
var ProductLineItem		= require('dw/order/ProductLineItem');
var ShippingLineItem	= require('dw/order/ShippingLineItem');
var PriceAdjustment		= require('dw/order/PriceAdjustment');
var PaymentInstrument	= require('dw/order/PaymentInstrument');

/**
 * Create XML from PDRequest
 * @param    {Object}    details
 * @returns {Object}
 */
function createXMLfromPDReq(details) {
    var topevel = XML('<top><shopInfo/><transaction/></top>');

    //shopInfo
    topevel.shopInfo.authenticationId = details.result.shopInfo.authenticationId;
    topevel.shopInfo.shopCode = details.result.shopInfo.shopCode;
    topevel.shopInfo.connectPassword = details.result.shopInfo.connectPassword;


    //transaction
    topevel.transaction.gmoTransactionId = details.result.buyer.gmoTransactionId;
    topevel.transaction.pdcompanycode = details.transporterId;
    topevel.transaction.slipno = details.tracking;
    topevel.transaction.invoiceIssueDate = '';

    let prettyPrinting = XML.prettyPrinting;
    XML.prettyPrinting = false;
    let outstring = topevel.shopInfo.toString();
    outstring += topevel.transaction.toString();
    XML.prettyPrinting = prettyPrinting;
    return outstring;

}

exports.createXMLfromPDReq            = createXMLfromPDReq;
exports.createXMLfromPDReq.public    = false;
