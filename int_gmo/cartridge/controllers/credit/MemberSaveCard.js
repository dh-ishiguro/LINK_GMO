'use strict'

/**
 * Auto registration card into GMO server
 * @param {Function}					paymentInstrumentsCallBack	For automatic registration cards to GMO server, this function will be executed.
 * @returns {Object}
 */
function memberSaveCard(paymentInstrumentsCallBack) {

	//  ------- Assign -------
	// CurrentSession.custom.memberSaveCard
	session.getCustom().memberSaveCard = true;

	// PaymentInstruments-AutoRegistrationCard
	paymentInstrumentsCallBack();

	return {ok : true};
}

exports.memberSaveCard = memberSaveCard;
exports.memberSaveCard.public = false;