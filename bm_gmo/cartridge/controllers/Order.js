'use strict';

/* API Includes */
var OrderMgr    = require('dw/order/OrderMgr');
var ContentMgr  = require('dw/content/ContentMgr');
var Order       = require('dw/order/Order');
var PagingModel = require('dw/web/PagingModel');
var ISML        = require('dw/template/ISML');
var Logger      = require('dw/system/Logger');
var Transaction = require('dw/system/Transaction');
var TaxMng      = require('dw/order/TaxMgr');

/* Script Modules */
var App         = require('~/cartridge/scripts/app');
var PageMeta    = App.getAppControllerModule('cartridge/scripts/meta');
var Guard       = App.getAppControllerModule('cartridge/scripts/guard');


/**
 * Renders a page with the order history of the current logged in customer.
 * @param {boolean}    hasError
 */
function history(hasError) {
    // Assign
    let targetPipeline = "Order-History";

    let orders = null;

    // expression CurrentForms.searchorder.orderNoSearch.value == null
    let orderNo =session.getForms().searchorder.orderNoSearch.value;
    // SearchSystemObject
    if(orderNo == null){
        orders = OrderMgr.searchOrders(
                'custom.gmoIsAuthorization={0} AND status!={1}',
                'creationDate desc',
                true,
                Order.ORDER_STATUS_REPLACED
                );
    }else{
        orders = OrderMgr.searchOrders(
                'status!={0} AND orderNo LIKE {1}',
                'creationDate desc',
                Order.ORDER_STATUS_REPLACED,
                '*'+orderNo+'*');
    }

    // Paging
    let httpParameterMap    = request.getHttpParameterMap();
    let pageSize            = httpParameterMap.sz.intValue || 10;
    let start               = httpParameterMap.start.intValue || 0;
    let orderPagingModel    = new PagingModel(orders, orders.count);
    orderPagingModel.setPageSize(pageSize);
    orderPagingModel.setStart(start);

    // UpdatePageMetaData
    PageMeta.update({ content: ContentMgr.getContent('myaccount-orderhistory')} );

    let pDictObj        = {};
    pDictObj.alert  = null;

    //expression empty(CurrentHttpParameterMap.cancel.stringValue)
    if(!httpParameterMap.get('cancel').getStringValue()){
        //expression empty(CurrentHttpParameterMap.capture.stringValue)
        if(!httpParameterMap.get('capture').getStringValue()){
            // Assign
            session.getCustom().action       = null;
            pDictObj.listChoice              = null;
            pDictObj.listTransporterId            = null;
            pDictObj.listTracking                 = null;
            session.getCustom().listChoice   = null;
            session.getCustom().listTransporterId = null;
            session.getCustom().listTracking      = null;
        }else{
            // Assign
            pDictObj.alert                   = new String("capture order");
            session.getCustom().action       = new String('capture');
            setChoiseList(pDictObj);
        }
    }else{
        // Assign
        pDictObj.alert                        = new String("cancel authorization");
        session.getCustom().action            = new String("cancel");
        setChoiseList(pDictObj);
    }

    pDictObj.TargetPipeline      = targetPipeline;
    pDictObj.hasError            = hasError;
    pDictObj.SearchedOrdersCount = orders.getCount();
    pDictObj.OrdersUnpaged       = orders;
    pDictObj.OrdersUnpagedCount  = orders.getCount();
    pDictObj.OrderPagingModel    = orderPagingModel;

    ISML.renderTemplate('account/orderhistory/searchorder_landing', pDictObj);
}

/**
 * set choise list
 * @param   {Object}        choiseListObj    choise list
 * @returns {Object}        choiseListObj    choise list
 */
function setChoiseList(pDictObj){
    let httpParameterMap    = request.getHttpParameterMap();

    // expression !empty(CurrentHttpParameterMap.choice.stringValues)
    let listChoice = httpParameterMap.get('choice').getStringValues();
    let listTransporterId = {};
    let listTracking = {};
    if(listChoice){
        let choice = listChoice.toArray();
        // Assign
        session.getCustom().listChoice        = listChoice.toArray();
        pDictObj.listChoice                   = listChoice.toArray();

        for (let i in choice) {
            listTransporterId[choice[i]] = httpParameterMap.get('transporterId_' + choice[i]).getStringValue();
            listTracking[choice[i]] = httpParameterMap.get('tracking_' + choice[i]).getStringValue();
        }
        session.getCustom().listTransporterId = listTransporterId;
        pDictObj.listTransporterId            = listTransporterId;
        session.getCustom().listTracking      = listTracking;
        pDictObj.listTracking                 = listTracking;
    }else{
        // Assign
        pDictObj.alert                        = null;
        pDictObj.cancelFailed                 = true;
        pDictObj.listChoice                   = null;
        pDictObj.listTransporterId            = null;
        pDictObj.listTracking                 = null;
        session.getCustom().action            = null;
        session.getCustom().listChoice        = null;
        session.getCustom().listTransporterId = null;
        session.getCustom().listTracking      = null;
    }

    return pDictObj;
}

/**
 * Action capture or cancel authorization order
 * @returns Jump to Order-Hisotry
 */
function alterTranAuthorization() {
    // Assign
    let hasError = false;
    let logger = Logger.getLogger('GMO');
    let isEnableGmoController = require('~/../int_gmo/cartridge/controllers/GMO_PAYMENT');
    let isEnableGmo           = isEnableGmoController.IsEnableGMO();

    session.getCustom().alertSuccess = null;

    // !empty(CurrentSession.custom.listChoice) && !empty(CurrentSession.custom.action)
    if(!empty(session.getCustom().listChoice) && !empty(session.getCustom().action)){

        /*--- loop ---*/
        let custom = session.getCustom();
        let choices = session.getCustom().listChoice;
        let transporterIds = session.getCustom().listTransporterId;
        let trackings = session.getCustom().listTracking;

        for (let i in choices ) {
            let orderNo = choices[i];

            logger.debug("order no --> {0}", orderNo);
            // getOrder
            let order = OrderMgr.getOrder(orderNo);
            // NOTE : The getOrder function became to not return error. So, it check Order insted of it.
            if(order == null) {
                continue;
            }

            let paymentInstruments = order.getPaymentInstruments();
            if (paymentInstruments.length == 0){
                continue;
            } else if (paymentInstruments.length > 1){
                logger.debug("RakutenId({0}) paymentInstruments.length={1}",orderNo, paymentInstruments.length);
            }

            let paymentMethod;
            for(let p in paymentInstruments){
                if( paymentInstruments[p].paymentMethod == "RAKUTENID" || paymentInstruments[p].paymentMethod == "GMOPOSTPAY" || paymentInstruments[p].METHOD_CREDIT_CARD.equals(paymentInstruments[p].paymentMethod) ) {
                    paymentMethod = paymentInstruments[p].paymentMethod;
                    break;
                }
            }

            if(paymentMethod == "RAKUTENID" && isEnableGmo.isEnableRakutenId) {

                if(rakutenIdAlterTran(orderNo)){
                    hasError = true;
                }
                logger.debug("RakutenId({0}) alter tran hasError {1}",orderNo, hasError);

            } else if(paymentMethod == "GMOPOSTPAY" && isEnableGmo.isEnablePostpay) {

                // GMOPostPayの条件分岐
                let transporterId = transporterIds[orderNo];
                let tracking = trackings[orderNo];
                logger.debug("GMOPostPay order no --> {0} transporterId --> {1} tracking -->{2}", orderNo, transporterId, tracking);

                if(GMOPostPayAlterTran(orderNo, transporterId, tracking)){
                    hasError = true;
                }
                logger.debug("GMOPostPay({0}) alter tran hasError {1}",orderNo, hasError);

            } else {

                let gmoPayment = App.getController('GMO_PAYMENT');
                if(session.getCustom().action == 'capture'){
                    // GMO_PAYMENT-SalesCapture
                    let salesCaptureResult = gmoPayment.SalesCapture({Order: order});
                    if(salesCaptureResult.error){
                        hasError = true;
                    }
                }else if(session.getCustom().action == 'cancel'){
                    // GMO_PAYMENT-CancelAutorization
                    let cancelResult = gmoPayment.CancelAuthorization({Order: order});
                    if(cancelResult.error){
                        /*--- Assign ---*/
                        hasError = true;
                        continue;
                    }

                    // ScriptFile    gmo/SetOrderStatusCancel.ds
                    let pDictObj = {Order : order};
                    Transaction.wrap(function () {
                        let setOrderStatusCancel = require('~/../int_gmo/cartridge/scripts/gmo/SetOrderStatusCancel');
                        setOrderStatusCancel.execute(pDictObj);
                    });
                }
            }
        }

        /*--- Assign ---*/
        session.getCustom().alertSuccess = session.getCustom().action;
    }

    // Jump to Order-History
    session.forms.searchorder.clearFormElement();
    let order = App.getController('Order');
    return order.History(hasError);

}

/**
 * RAKUTENID Order change processing
 * @returns Jump to Order-Hisotry
 */
function rakutenIdAlterTran(orderNo) {

    let logger = Logger.getLogger('GMO');
    let order = OrderMgr.getOrder(orderNo);
    let gmoRakutenId = App.getController('GMO_RAKUTENID');
    let jobType;
    if(session.getCustom().action == 'capture'){
        jobType = "SalesCapture";
    } else if(session.getCustom().action == 'cancel'){
        jobType = "Cancel";
    } else {
        return true;
    }

    logger.debug("jobType --> {0}", jobType);

    // GMO_RAKUTEN-AlterTran
    let alterTranResult = gmoRakutenId.AlterTran({Order: order, JobType: jobType });
    if(alterTranResult.error){
        /*--- Assign ---*/
        logger.debug("gmoRakutenId.AlterTran Error");
        return true;
    }

    Transaction.wrap(function () {
        if(jobType == "Cancel"){
            // ScriptFile    gmo/SetOrderStatusCancel.ds
            let pDictObj = {Order : order};
            let setOrderStatusCancel = require('~/../int_gmo/cartridge/scripts/gmo/SetOrderStatusCancel');
            setOrderStatusCancel.execute(pDictObj);
        }else if(jobType == "SalesCapture"){
            order.setPaymentStatus(dw.order.Order.PAYMENT_STATUS_PAID);
        }
    });
}

/**
 * GMOPostPay Order change processing
 * @returns Jump to Order-Hisotry
 */
function GMOPostPayAlterTran(orderNo, transporterId, tracking) {

    let logger = Logger.getLogger('GMO');
    let order = OrderMgr.getOrder(orderNo);
    let gmoPostPay = App.getController('GMO_POSTPAY');
    let jobType;
    if(session.getCustom().action == 'capture'){
        jobType = "SalesCapture";
    } else if(session.getCustom().action == 'cancel'){
        jobType = "Cancel";
    } else {
        return true;
    }

    logger.debug("GMOPostPay jobType --> {0}", jobType);

    // GMOPostPay-AlterTran
    let alterTranResult = gmoPostPay.AlterTran({Order: order, JobType: jobType, TransporterId: transporterId, Tracking: tracking });
    if(alterTranResult.error){
        /*--- Assign ---*/
        logger.debug("gmoPostPay.AlterTran Error");
        return true;
    }

    Transaction.wrap(function () {
        if(jobType == "Cancel"){
            // ScriptFile    gmo/SetOrderStatusCancel.ds
            let pDictObj = {Order : order};
            let setOrderStatusCancel = require('~/../int_gmo/cartridge/scripts/gmo/SetOrderStatusCancel');
            setOrderStatusCancel.execute(pDictObj);
        }else if(jobType == "SalesCapture"){
            order.setPaymentStatus(dw.order.Order.PAYMENT_STATUS_PAID);
        }
    });
}

/**
 * RAKUTENID amount change order
 */
function rakutenIDAmountChange() {

    let httpParameterMap    = request.getHttpParameterMap();
    let orderId = httpParameterMap.get('change').getValue();

    let changeOrder = OrderMgr.getOrder(orderId);
    let totalAmount;

    for(let i in changeOrder.paymentInstruments){
        if( changeOrder.paymentInstruments[i].paymentMethod == "RAKUTENID" ) {
            totalAmount = changeOrder.paymentInstruments[i].paymentTransaction.amount.value;
            break;
        }
    }

    let pDictObj = {
        ErrMsg         : null,
        OrderId        : orderId,
        TotalAmount    : Math.round(totalAmount).toFixed(0),
    };

    ISML.renderTemplate('account/orderhistory/rakutenid_amountchange', pDictObj);

}

/**
 * GMOPostPay amount change order
 */
function gmoPostPayAmountChange() {

    let httpParameterMap    = request.getHttpParameterMap();
    let orderId = httpParameterMap.get('change').getValue();
    let gmoPostPay = App.getController('GMO_POSTPAY');

    let changeOrder = OrderMgr.getOrder(orderId);

    let pDictObj = {
        ErrMsg         : null,
        OrderId        : orderId,
        Order          : gmoPostPay.MakeDetails(changeOrder),
    };

    ISML.renderTemplate('account/orderhistory/gmopostpay_transactionchange', pDictObj);

}

/**
 * RAKUTENID Input check processing of amount change
 * @returns Error Message
 */
function rakutenIDAmountChangeValidate(pDictObj) {

    let logger = Logger.getLogger('GMO');

    let objUtil   = require('dw/util');
    let checkValue = 0;
    let httpParameterMap    = request.getHttpParameterMap();
    let chgAmount     = httpParameterMap.get('totalAmount').getValue();

    /* Input value validation */
    /* chgAmount */
    if (!chgAmount.match(/^[0-9]+$/)) {
        logger.debug("Error chgAmount {0}", chgAmount);
        return "Please set change amount correctly.";
    }
    if (Number(chgAmount) == 0) {
        logger.debug("Error chgAmount {0}", chgAmount);
        return "Please set change amount correctly.";
    }

    /* Total amount check */
    checkValue = Number(chgAmount);
    if(checkValue < 100 || checkValue > 99999999) {
        return "The total amount must be 100 yen or more and 99,999,999 yen or less.";
    }

    pDictObj.ChangeAmount = Number(chgAmount);

    return null;
}

/**
 * RAKUTENID amount change order
 * @returns Jump to Order-Hisotry
 */
function rakutenIDAmountChangeReturnForm() {

    let logger = Logger.getLogger('GMO');

    let httpParameterMap    = request.getHttpParameterMap();
    let orderId       = httpParameterMap.get('hidOrderId').getValue();

    let changeOrder = OrderMgr.getOrder(orderId);
    let totalAmount;

    for(let i in changeOrder.paymentInstruments){
        if( changeOrder.paymentInstruments[i].paymentMethod == "RAKUTENID" ) {
            totalAmount = changeOrder.paymentInstruments[i].paymentTransaction.amount.value;
            break;
        }
    }

    let pDictObjChgDisp = {
            ErrMsg         : null,
            OrderId        : orderId,
            TotalAmount    : Math.round(totalAmount).toFixed(0),
    };

    let pDictObjDs = {
            OrderID        : orderId,
            AccessID       : changeOrder.getCustom().gmoAccessID,
            AccessPass     : changeOrder.getCustom().gmoAccessPass,
            TotalAmount    : null,
    };

    /* Input value validate */
    let errMsg = rakutenIDAmountChangeValidate(pDictObjDs);
    if(errMsg != null) {
        pDictObjChgDisp.ErrMsg    = errMsg;
        ISML.renderTemplate('account/orderhistory/rakutenid_amountchange', pDictObjChgDisp);
        return;
    }

    let rakutenIdChangeResult;
    Transaction.wrap(function () {
        let rakutenIdChange = require('~/../int_gmo/cartridge/scripts/gmo/RakutenIdChange');
        rakutenIdChangeResult = rakutenIdChange.execute(pDictObjDs);
        logger.debug("rakuten alter tran result {0}", rakutenIdChangeResult);
    });

    if(rakutenIdChangeResult == PIPELET_ERROR){
        logger.debug("Failed to change amount");
        pDictObjChgDisp.ErrMsg = "Failed to change amount";
        ISML.renderTemplate('account/orderhistory/rakutenid_amountchange', pDictObjChgDisp);
        return;
    }

    Transaction.wrap(function () {
        changeOrder.getCustom().gmoIsAuthorization = true;
    });

    session.getCustom().action       = null;
    session.getCustom().listChoice   = null;
    session.getCustom().alertSuccess = 'change';

    // Jump to Order-History
    session.forms.searchorder.clearFormElement();
    let order = App.getController('Order');
    return order.History(false);

}

/**
 * GMOPostPay amount change order
 * @returns Jump to Order-Hisotry
 */
function gmoPostPayAmountChangeReturnForm() {

    let logger = Logger.getLogger('GMO');
    let gmoPostPay = App.getController('GMO_POSTPAY');

    let httpParameterMap    = request.getHttpParameterMap();
    let orderId       = httpParameterMap.get('hidOrderId').getValue();
    let prices       = httpParameterMap.get('Price').getValues();
    let quantities       = httpParameterMap.get('Quantity').getValues();

    let changeOrder = OrderMgr.getOrder(orderId);
    let orderDetails = gmoPostPay.MakeDetails(changeOrder);
    orderDetails.buyer.gmoTransactionId = changeOrder.getCustom().gmoAccessID;

    for(let i in orderDetails.delivery.details){
        orderDetails.delivery.details[i].detailPrice = prices[i];
        orderDetails.delivery.details[i].detailQuantity = quantities[i];
    }

    orderDetails.buyer.billedAmount = httpParameterMap.get('totalAmount').getValue();

    let pDictObjChgDisp = {
            ErrMsg         : null,
            OrderId        : orderId,
            Order          : orderDetails,
    };

    let pDictObj = {
            OrderID : orderId,
            Details : null,
    };

    // Assign
    let xmlstring = gmoPostPay.CreateXMLfromDetail(orderDetails);

    //httpInfo
    let topevel = XML('<top><kindInfo><updateKind/></kindInfo></top>');
    let httpHeaders = gmoPostPay.MakeHttpheaders();

    //Change == 1
    topevel.kindInfo.updateKind = 1;

    let prettyPrinting = XML.prettyPrinting;
    XML.prettyPrinting = false;
    pDictObj.Details = '<request>'+xmlstring+topevel.kindInfo.toString()+'</request>';
    XML.prettyPrinting = prettyPrinting;

    let postPayChangeResult;
    Transaction.wrap(function () {
        let postPayChange = require('~/../int_gmo/cartridge/scripts/gmo-ps/PostPayModifyTran');
        postPayChangeResult = postPayChange.execute(pDictObj);
        logger.debug("gmopostpay alter tran result {0}", postPayChangeResult);
    });

    if(postPayChangeResult == PIPELET_ERROR){
        logger.debug("Failed to change transaction");
        pDictObjChgDisp.ErrMsg = "Failed to change transaction";
        ISML.renderTemplate('account/orderhistory/gmopostpay_transactionchange', pDictObjChgDisp);
        return;
    }

    Transaction.wrap(function () {
        changeOrder.getCustom().gmoIsAuthorization = true;
    });

    session.getCustom().action       = null;
    session.getCustom().listChoice   = null;
    session.getCustom().alertSuccess = 'change';

    // Jump to Order-History
    session.forms.searchorder.clearFormElement();
    let order = App.getController('Order');
    return order.History(false);

}

exports.History         = Guard.ensure(['https'], history);
exports.History.public  = true;

exports.AlterTranAuthorization         = Guard.ensure(['https'], alterTranAuthorization);
exports.AlterTranAuthorization.public  = true;

exports.RakutenIDAmountChange         = Guard.ensure(['https'], rakutenIDAmountChange);
exports.RakutenIDAmountChange.public  = true;

exports.RakutenIDAmountChangeRform         = Guard.ensure(['https'], rakutenIDAmountChangeReturnForm);
exports.RakutenIDAmountChangeRform.public  = true;

exports.GMOPostPayAmountChange         = Guard.ensure(['https'], gmoPostPayAmountChange);
exports.GMOPostPayAmountChange.public  = true;

exports.GMOPostPayAmountChangeRform         = Guard.ensure(['https'], gmoPostPayAmountChangeReturnForm);
exports.GMOPostPayAmountChangeRform.public  = true;