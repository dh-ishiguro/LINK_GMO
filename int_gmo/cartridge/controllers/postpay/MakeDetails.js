'use strict'

var Logger				= require('dw/system/Logger');
var ArrayList			= require('dw/util/ArrayList');
var Order 				= require('dw/order/Order');
var OrderMgr			= require('dw/order/OrderMgr');
var ProductLineItem		= require('dw/order/ProductLineItem');
var ShippingLineItem	= require('dw/order/ShippingLineItem');
var PriceAdjustment		= require('dw/order/PriceAdjustment');
var PaymentInstrument	= require('dw/order/PaymentInstrument');

/**
 * Make order details
 * @param    {Object}    order
 * @returns {Object}
 */
function makeDetails(order) {
    var logger = Logger.getLogger('GMO');

    var shopInfo = {
        authenticationId : dw.system.Site.getCurrent().getCustomPreferenceValue('gmo_postpay_authid'),
        shopCode         : dw.system.Site.getCurrent().getCustomPreferenceValue('gmo_postpay_shopcode'),
        connectPassword  : dw.system.Site.getCurrent().getCustomPreferenceValue('gmo_postpay_connectpwd'),
        smsConnectPassword  : dw.system.Site.getCurrent().getCustomPreferenceValue('gmo_postpay_smsconnectpwd'),
    };

    var buyer = {
        gmoTransactionId : '', //修正の時は値を変えてからCreateXMLを呼ぶこと
        shopTransactionId : '-',
        shopOrderDate : '',
        fullName : '',
        zipCode : order.billingAddress.postalCode,
        address : '',
        tel1 : order.billingAddress.phone,
        email1 : order.customerEmail,
        billedAmount : '', //明細の作成時に算出する
        paymentType : ''
    };

    var failedFlg = session.getCustom().authorizeFailedFlg;
    if (order instanceof Order && !failedFlg) {
    	logger.info("MAKE DETAILS getOrderNo()");
    	buyer.shopTransactionId = order.getOrderNo();
    } else if (dw.system.Site.getCurrent().getCustomPreferenceValue('gmo_postpay_enablesmscert')) {
    	//SMSありルートの場合、Basket段階でOrderNoを発行しておく
    	logger.info("MAKE DETAILS createOrderNo()");
    	buyer.shopTransactionId = OrderMgr.createOrderNo();
    	logger.info("MAKE DETAILS OrderNo created! OrderNo:"+buyer.shopTransactionId);
    }
    let oderdate = order.getCreationDate(); //Basketの場合はOrderと異なる可能性があるが仕方ない
    let pYear = oderdate.getFullYear().toString();
    let pMonth = ('00'+(oderdate.getMonth()+1).toString()).slice(-2);
    let pdate = ('00'+oderdate.getDate().toString()).slice(-2);
    buyer.shopOrderDate = pYear + '/' + pMonth + '/' + pdate;
    //氏名と住所は強制的に日本の記述順にする
    if (order.billingAddress.secondName) {
        buyer.fullName = order.billingAddress.lastName + ' ' +
            order.billingAddress.secondName +  ' ' +
            order.billingAddress.firstName;
    } else {
        buyer.fullName = order.billingAddress.lastName + ' ' +
            order.billingAddress.firstName;
    }
    buyer.address = order.billingAddress.stateCode +
        order.billingAddress.city +
        order.billingAddress.address1;
    if ( order.billingAddress.address2 ) {
        buyer.address += order.billingAddress.address2;
    }
    buyer.paymentType = order.getCustom().gmoPaymentType;


    var deliveryCustomer = {
        fullName : '',
        zipCode : order.shipments[0].shippingAddress.postalCode,
        address : '',
        tel : order.shipments[0].shippingAddress.phone
    };
    //氏名と住所は強制的に日本の記述順にする
    if (order.shipments[0].shippingAddress.secondName) {
        deliveryCustomer.fullName = order.shipments[0].shippingAddress.lastName + ' ' +
            order.shipments[0].shippingAddress.secondName + ' ' +
            order.shipments[0].shippingAddress.firstName;
    } else {
        deliveryCustomer.fullName = order.shipments[0].shippingAddress.lastName + ' ' +
            order.shipments[0].shippingAddress.firstName;
    }
    deliveryCustomer.address = order.shipments[0].shippingAddress.stateCode +
        order.shipments[0].shippingAddress.city +
        order.shipments[0].shippingAddress.address1;
    if ( order.shipments[0].shippingAddress.address2 ) {
        deliveryCustomer.address += order.shipments[0].shippingAddress.address2;
    }

    var details = new ArrayList();
    var numofdetail = 0;
    var totalindex = 0;
    var totalOtherAmount = 0;

    //prefetch detail from allLineItems
    for (let i = 0; i < order.allLineItems.getLength(); i++) {
        if ( order.allLineItems[i] instanceof ProductLineItem ) {
            if ( order.allLineItems[i].bundledProductLineItem == false ) {
                numofdetail++;
            }
        } else if ( order.allLineItems[i] instanceof ShippingLineItem ){
            numofdetail++;
        } else if ( order.allLineItems[i] instanceof PriceAdjustment ){
            numofdetail++;
        }
    }
    //prefetch detail from paymentInstruments
    for (let i = 0; i < order.paymentInstruments.getLength(); i++) {
        if ( PaymentInstrument.METHOD_GIFT_CERTIFICATE.equals(order.paymentInstruments[i].paymentMethod) ) {
            numofdetail++;
        }
    }

    //pickup detail from allLineItems
    for (let i = 0; i < order.allLineItems.getLength(); i++) {
        let detail = {
            detailName : '',
            detailQuantity : '',
            detailPrice : ''
        };
        if ( order.allLineItems[i] instanceof ProductLineItem ) {
            if ( order.allLineItems[i].bundledProductLineItem == false ) {
                if ( (numofdetail < 16) || (totalindex < 14) ) {
                    detail.detailName = order.allLineItems[i].lineItemText;
                    detail.detailQuantity = order.allLineItems[i].quantityValue.toString();
                    detail.detailPrice = (Math.floor(order.allLineItems[i].grossPrice / order.allLineItems[i].quantityValue)).toString();
                    details.add(detail);
                } else {
                totalOtherAmount += Math.floor(order.allLineItems[i].grossPrice / order.allLineItems[i].quantityValue);
                }
                totalindex++;
            }
        } else if ( order.allLineItems[i] instanceof ShippingLineItem ){
            if ( (numofdetail < 16) || (totalindex < 14) ) {
                detail.detailName = '送料等';
                detail.detailQuantity = '1';
                detail.detailPrice = order.allLineItems[i].adjustedGrossPrice.value.toString();
                details.add(detail);
            } else {
                totalOtherAmount += order.allLineItems[i].adjustedGrossPrice;
            }
            totalindex++;
        } else if ( order.allLineItems[i] instanceof PriceAdjustment ){
            if ( (numofdetail < 16) || (totalindex < 14) ) {
                detail.detailName = order.allLineItems[i].lineItemText;
                detail.detailQuantity = order.allLineItems[i].quantity;
                detail.detailPrice = (Math.floor(order.allLineItems[i].grossPrice / order.allLineItems[i].quantity)).toString();
                details.add(detail);
            } else {
                totalOtherAmount += Math.floor(order.allLineItems[i].grossPrice / order.allLineItems[i].quantity);
            }
            totalindex++;
        } else {
            logger.warn('postpay/MakeDetails.makeDetails() OtherClass found.');
        }
    }
    //pickup detail from paymentInstruments
    for (let i = 0; i < order.paymentInstruments.getLength(); i++) {
        let detail = {
            detailName : '',
            detailQuantity : '',
            detailPrice : ''
        };
        if ( PaymentInstrument.METHOD_GIFT_CERTIFICATE.equals(order.paymentInstruments[i].paymentMethod) ) {
            if ( (numofdetail < 16) || (totalindex < 14) ) {
                detail.detailName = 'ギフト券充当分';
                detail.detailQuantity = '1';
                detail.detailPrice = (-order.paymentInstruments[i].paymentTransaction.amount).toString();  //符号を逆転
                details.add(detail);
            } else {
                totalOtherAmount -= order.paymentInstruments[i].paymentTransaction.amount;  //符号を逆転
            }
            totalindex++;
        } else 	if ( order.paymentInstruments[i].paymentMethod.equals('GMOPOSTPAY') ) {
            buyer.billedAmount = order.paymentInstruments[i].paymentTransaction.amount.value.toString();
        }
    }

    //Other detail
    if ( numofdetail > 15 ) {
        let detail = {
            detailName : 'その他',
            detailQuantity : '1',
            detailPrice : totalOtherAmount.toString()
        };
        details.add(detail);
    }

    var delivery = {
        deliveryCustomer : deliveryCustomer,
        details : details
    };


    return {
        success : true,
        shopInfo : shopInfo,
        buyer : buyer,
        delivery : delivery,
    };
}

exports.makeDetails            = makeDetails;
exports.makeDetails.public    = false;
