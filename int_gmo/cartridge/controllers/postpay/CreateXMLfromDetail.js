'use strict'

var ArrayList			= require('dw/util/ArrayList');
var ProductLineItem		= require('dw/order/ProductLineItem');
var ShippingLineItem	= require('dw/order/ShippingLineItem');
var PriceAdjustment		= require('dw/order/PriceAdjustment');
var PaymentInstrument	= require('dw/order/PaymentInstrument');

/**
 * Create XML from Details
 * @param    {Object}    details
 * @returns {Object}
 */
function createXMLfromDetail(details) {
    var topevel = XML('<top><shopInfo/><buyer/><deliveries><delivery/></deliveries></top>');

    //shopInfo
    topevel.shopInfo.authenticationId = details.shopInfo.authenticationId;
    topevel.shopInfo.shopCode = details.shopInfo.shopCode;
    topevel.shopInfo.connectPassword = details.shopInfo.connectPassword;


    //buyer
    if ( details.buyer.gmoTransactionId != '' ) { //取引登録の場合はタグ自体がない
        topevel.buyer.gmoTransactionId = details.buyer.gmoTransactionId;
    }
    topevel.buyer.shopTransactionId = details.buyer.shopTransactionId;
    topevel.buyer.shopOrderDate = details.buyer.shopOrderDate;
    topevel.buyer.fullName = details.buyer.fullName;
    topevel.buyer.fullKanaName = '';
    topevel.buyer.zipCode = details.buyer.zipCode;
    topevel.buyer.address = details.buyer.address;
    topevel.buyer.companyName = '';
    topevel.buyer.departmentName = '';
    topevel.buyer.tel1 = details.buyer.tel1;
    topevel.buyer.tel2 = '';
    topevel.buyer.email1 = details.buyer.email1;
    topevel.buyer.email2 = '';
    topevel.buyer.billedAmount = details.buyer.billedAmount;
    topevel.buyer.zipCode = details.buyer.zipCode;
    topevel.buyer.gmoExtend1 = '';
    topevel.buyer.paymentType = details.buyer.paymentType;


    //delivery
    if ( details.delivery.deliveryCustomer ) {
        let tmp = XML('<tmp><deliveryCustomer/></tmp>');
        tmp.deliveryCustomer.fullName = details.delivery.deliveryCustomer.fullName;
        tmp.deliveryCustomer.fullKanaName = '';
        tmp.deliveryCustomer.zipCode = details.delivery.deliveryCustomer.zipCode;
        tmp.deliveryCustomer.address = details.delivery.deliveryCustomer.address;
        tmp.deliveryCustomer.companyName = '';
        tmp.deliveryCustomer.departmentName = '';
        tmp.deliveryCustomer.tel = details.delivery.deliveryCustomer.tel;
        topevel.deliveries.delivery.appendChild(tmp.deliveryCustomer);
    }
    if ( details.delivery.details ) {
        let tmp_high = XML('<tmp><details/></tmp>');
        for ( let i=0; i < details.delivery.details.getLength(); i++ ) {
            let tmp_low = XML('<tmp><detail/></tmp>');
            tmp_low.detail.detailName = details.delivery.details[i].detailName;
            tmp_low.detail.detailQuantity = details.delivery.details[i].detailQuantity;
            tmp_low.detail.detailPrice = details.delivery.details[i].detailPrice;
            tmp_low.detail.gmoExtend2 = '';
            tmp_low.detail.gmoExtend3 = '';
            tmp_low.detail.gmoExtend4 = '';
            if (tmp_low.detail.detailQuantity != 0) {
            	tmp_high.details.appendChild(tmp_low.detail);
            }
        }
        topevel.deliveries.delivery.appendChild(tmp_high.details);
    }

    let prettyPrinting = XML.prettyPrinting;
    XML.prettyPrinting = false;
    let outstring = topevel.shopInfo.toString();
    outstring += topevel.buyer.toString();
    outstring += topevel.deliveries.toString();
    XML.prettyPrinting = prettyPrinting;
    return outstring;

}

exports.createXMLfromDetail            = createXMLfromDetail;
exports.createXMLfromDetail.public    = false;
