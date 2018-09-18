'use strict'

var Logger          = require('dw/system/Logger');

/**
 * Get credit card payment method information.
 * @returns {Object}
 *
 * data structure in result object image
 *
 * result = {
 * 		idx: [
 *			// Loop index array
 * 			visa,
 * 			master,
 * 			jcb,
 * 			amex,
 * 			diners
 * 		},
 * 		dat: {
 *			// Data array
 * 			visa: {
 *					// gmo credit config
 * 					gmo_use_installments
 * 					gmo_use_bonus
 * 					gmo_use_installments_bonus
 * 					gmo_use_revolving
 *					gmo_number_of_installments [
 *						// Numeric index array
 *						2,
 *						3,
 *						5,
 *						6,...
 * 					]
 * 					gmo_use_3d_secure
 * 			},
 * 			master: {
 * 					// Same as visa
 * 			},
 * 			jcb:    {
 * 					// Same as visa
 * 			},
 * 			amex: {
 * 					// Same as visa
 * 			},
 * 			diners:   {
 * 					// Same as visa
 * 			}
 * 		}
 * }
 */
function getCreditCardPaymentsInfo() {
    var logger = Logger.getLogger('GMO');
	let obj = dw.system.Site.getCurrent();
	let tableKeys = ['visa', 'master', 'jcb', 'amex', 'diners'];
    let keyName;
    let insArray = null;
    let insStr;
    let retAray = {};
    let isError = false;
    var result = {};

    for(let key in tableKeys) {
    	keyName = tableKeys[key];
    	instStr = obj.getCustomPreferenceValue('gmo_number_of_installments_' + keyName);
    	if(instStr) {
    		instArray = instStr.split(",");
    	}
    	if(!checkNumeric(instArray)) {
    		// not numeric error
            logger.debug("gmo_number_of_installments_" + keyName + ":NOT NUMERIC INSTALLMENTS DATA!");
            isError = true;
    	}
    	retAray[keyName] = {
    		gmo_use_installments       : obj.getCustomPreferenceValue('gmo_use_installments_' + keyName),
    		gmo_use_bonus              : obj.getCustomPreferenceValue('gmo_use_bonus_' + keyName),
    		gmo_use_installments_bonus : obj.getCustomPreferenceValue('gmo_use_installments_bonus_' + keyName),
    		gmo_use_revolving          : obj.getCustomPreferenceValue('gmo_use_revolving_' + keyName),
    		gmo_number_of_installments : instArray,
    		gmo_use_3d_secure          : obj.getCustomPreferenceValue('gmo_use_3d_secure_' + keyName) ? "1" : "0"
    	};
    }
	result = {
			error: isError,
			idx: tableKeys,
			dat: retAray
    };
    return result;
}

/**
 * Whether the array value is numeric or not.
 * @returns [boolean] numeric:true not:false
 */
function checkNumeric(ary) {
	if(!ary) {
		return false;
	}
	for(let key in ary) {
		if(!ary[key]) {
			return false;
		}
		if(!isFinite(ary[key])) {
			return false;
		}
	}
	return true;
}

exports.getCreditCardPaymentsInfo               = getCreditCardPaymentsInfo;
exports.getCreditCardPaymentsInfo.public        = true;
