'use strict'

var Site		= require('dw/system/Site');
var Status		= require('dw/system/Status');
var Transaction = require('dw/system/Transaction');

/**
 * Handle for adding new card for member
 *   - check user is existed
 *   - send new card info to GMO to register a new card
 *
 * @param {dw.order.PaymentInstrument}	paymentInstrument	PaymentInstrument.
 * @param {string}						accessID
 * @param {string}						accessPass
 * @param {dw.order.Order}				Order
 * @returns {Object}
 */
function addCard(paymentInstrument, accessID, accessPass, Order) {

    // insted of Account-RequireLogin.
    let customerProfile = customer.getProfile();
    if(customerProfile == null){
        return {error:true};
    }
    let customerNo = customerProfile.getCustomerNo();

    // Script gmo/CheckoutExistedUser.ds
    let checkExistedUser = require('~/cartridge/scripts/gmo/CheckExistedUser');
    let pDictObj = { UserId : customerNo, CheckExistedUser: null};
    let checkExistedUserResult = checkExistedUser.execute(pDictObj);
    if(checkExistedUserResult == PIPELET_ERROR){
        return {error:true};
    }

    if(!pDictObj.CheckExistedUser){
        // Script gmo/RegisterUser.ds
        let registerUser = require('~/cartridge/scripts/gmo/RegisterUser');
        let registerUserResult = registerUser.execute(pDictObj);
        if(registerUserResult == PIPELET_ERROR){
            return {error:true};
        }
    }

    let httpParam = request.getHttpParameterMap();
    //  ------- Assign -------
    let creditCardType;
    if(paymentInstrument != null ){
        creditCardType = paymentInstrument.getCreditCardType();
    }else {
        // CurrentHttpParameterMap.dwfrm_paymentinstruments_creditcards_newcreditcard_type.stringValue
        creditCardType = httpParam.get("dwfrm_paymentinstruments_creditcards_newcreditcard_type").getStringValue();
    }
    // CurrentCustomer.profile.lastName
    var creditCardHolderName = customer.getProfile().getLastName();
    var objCredit = {};

    //  ------- Assign -------
    objCredit['cardType']		= creditCardType;
    objCredit['cardholdername']	= creditCardHolderName;
    //	(CurrentHttpParameterMap.crdCardtoken.stringValue!=null)?CurrentHttpParameterMap.crdCardtoken.stringValue:CurrentSession.custom.creditCardToken1
    var cardToken;
    if(httpParam.get('crdCardtoken').getStringValue() != null){
        cardToken = httpParam.get('crdCardtoken').getStringValue();
    }else{
        cardToken = session.getCustom().creditCardToken1;
    }
    objCredit['cardToken'] = cardToken;


    // Script gmo/GetCardInfo.ds
    pDictObj.CustomerNo = customerNo;
    pDictObj.CardList   = null;
    let getCardInfo = require('~/cartridge/scripts/gmo/GetCardInfo');
    let getCardInfoResult = getCardInfo.execute(pDictObj);

    if(getCardInfoResult === PIPELET_ERROR){
        return {error:true};
    }

    // ApplicableCreditCards==null || (ApplicableCreditCards!=null && ApplicableCreditCards.size() < dw.system.Site.getCurrent().getCustomPreferenceValue('gmo_number_of_credit_card'))
    var canRegistarCard =
        pDictObj.CardList == null ||
        pDictObj.CardList.size() < Site.getCurrent().getCustomPreferenceValue("gmo_number_of_credit_card");

    if(!canRegistarCard){
        // Assign new dw.system.Status(dw.system.Status.ERROR, "gmo.cardregistration.limit")
        var placeOrderError = new Status(Status.ERROR, "gmo.cardregistration.limit");
        return {PlaceOrderError : placeOrderError};
    }


    let accessId		= (accessID!=null)		? accessID				: "";
    let accessPassword	= (accessPass!=null)	? accessPass			: "";
    let orderNumber		= (Order!=null)			? Order.getOrderNo()	: "";
    // Script gmo/RegisterCardInfo.ds
    let registerCardInfo = require('~/cartridge/scripts/gmo/RegisterCardInfo');

    pDictObj.accessID	= accessId;
    pDictObj.accessPass	= accessPassword;
    pDictObj.AccountID	= customerNo;
    pDictObj.ObjCredit  = objCredit;
    pDictObj.OrderNo	= orderNumber;
    pDictObj.cardType	= creditCardType;
    pDictObj.profile    = customerProfile;

    let registerCardInfoResult = registerCardInfo.execute(pDictObj);

    if ( registerCardInfoResult !== PIPELET_ERROR ) {
        Transaction.wrap(function () {
            let addProfileCardType = require('~/cartridge/scripts/gmo/AddProfileCardType');
            addProfileCardType.execute(pDictObj);
        });
    }

    return {};

}

exports.addCard			= addCard;
exports.addCard.public	= false;
