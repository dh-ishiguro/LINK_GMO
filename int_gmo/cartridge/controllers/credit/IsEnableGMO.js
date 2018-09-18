'use strict'

/**
 * Check on/off GMO catridge
 * @returns {Object}
 */
function isEnableGMO() {
    var result = {};
    result.isEnableCreditCard = dw.system.Site.getCurrent().getCustomPreferenceValue('gmo_enable_catridge');
    result.isEnableRakutenId  = dw.system.Site.getCurrent().getCustomPreferenceValue('gmo_enable_rakutenid');
    result.isEnablePostpay    = dw.system.Site.getCurrent().getCustomPreferenceValue('gmo_enable_postpay');
    result.isEnableSMS        = dw.system.Site.getCurrent().getCustomPreferenceValue('gmo_postpay_enablesmscert');
    result.isEnableEnclose    = dw.system.Site.getCurrent().getCustomPreferenceValue('gmo_postpay_enableenclose');
    result.isEnableCommon     = (result.isEnableCreditCard || result.isEnableRakutenId || result.isEnablePostpay) ? true : false;
    return result;
}

exports.isEnableGMO            = isEnableGMO;
exports.isEnableGMO.public    = true;
