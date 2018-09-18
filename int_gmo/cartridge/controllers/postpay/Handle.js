'use strict'

/* API Includes */
var PaymentMgr			= require('dw/order/PaymentMgr');
var Status				= require('dw/system/Status');
var Transaction			= require('dw/system/Transaction');
var PaymentInstruments	= require('dw/order/PaymentInstrument');
var Logger				= require('dw/system/Logger');
var Encoding			= require('dw/crypto/Encoding');
var Bytes				= require('dw/util/Bytes');
var MessageDigest		= require('dw/crypto/MessageDigest');
/* Script Modules */
var app					= require('~/cartridge/scripts/app');

/**
 * Creates a payment instrument to 'GMO Postpay'
 * @param    {Object}    args
 *             {Basket}    args.Basket    use to create PaymentInstrument
 *             {Order}        args.Order  use to create PaymentInstrument
 * @returns {Object}
 */
function handle(args) {
    var logger = Logger.getLogger('GMO');
    let pDictObj = {};
    let lineItemCtnr = args.Basket != null ? args.Basket : args.Order;
    let paymentInstrument;
    Transaction.wrap(function() {
        /*--- ScriptFile checkout/CreatePaymentInstrument.ds ---*/
        let createPaymentInstrument = app.getAppCoreModule('cartridge/scripts/checkout/CreatePaymentInstrument');
        pDictObj = {
                LineItemCtnr        : lineItemCtnr,
                PaymentType         : 'GMOPOSTPAY',
                RemoveExisting      : true,
                PaymentInstrument   : null
        };
        paymentInstrument = createPaymentInstrument.execute(pDictObj);
    })

    if(paymentInstrument == PIPELET_ERROR){
    	return {error: true, gmoCreditCard : null, validateError : 1};
    }

    let gmoPayment = app.getController('GMO_PAYMENT');
    let isEnable = gmoPayment.IsEnableGMO();
    if (isEnable.isEnableSMS == true) {
    	let parameterMap = request.getHttpParameterMap();
        let controller = app.getController('GMO_POSTPAY');
        let result = controller.MakeDetails(lineItemCtnr);
        result.gmoHttpHeader = controller.MakeHttpheaders();
        result.gmoDeviceInfo = parameterMap.get('fraudbuster').getValue();

        result.gmoChksumReq = createChecksum(result);

        session.custom.smsauth = result;
        session.custom.smscerturl = dw.system.Site.getCurrent().getCustomPreferenceValue('gmo_postpay_smscert_url');

    }

	return {success: true};

}

/**
 * Create checksum.
 *
 * base64( sha256 ( 「加盟店コード + 接続パスワード」 + | + 加盟店取引ID + | + 電話番号１ + | + 郵便番号 + | +
 * 顧客請求金額 + | + 性別 + | + 誕生日 + | + 会員登録日 + | + 購入回数 + | + 購入金額総額 + | + 会員ID))
 *
 * @param details
 *            受注詳細情報
 * @returns チェックサム文字列
 */
function createChecksum(details) {
    let raw =
        details.shopInfo.shopCode +
        details.shopInfo.connectPassword +
        "|" +
        details.buyer.shopTransactionId +
        "|" +
        details.buyer.tel1 +
        "|" +
        details.buyer.zipCode +
        "|" +
        details.buyer.billedAmount +
        /* | + 性別 + | + 誕生日 + | + 会員登録日 + | + 購入回数 + | + 購入金額総額 + | + 会員ID */
        "||||||";
    let digestObj = new MessageDigest("SHA-256");
    return Encoding.toBase64(digestObj.digestBytes(new Bytes(raw)));
}

exports.handle = handle;
exports.handle.public = false;