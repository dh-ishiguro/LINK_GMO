'use strict'

/**
 * Execute settlement after authentication
 *
 * @param {string}				PaRes
 * @param {string}				MD
 * @param {string}				OrderID
 * @returns {Object}
 */
function secureTran(args) {

	let paRes = args.PaRes;
	let md    = args.MD;
	let pDictObj = {
			PaRes        : paRes,
			MD           : md,
			OrderID      : null
	};

	let execSecureTran = require('~/cartridge/scripts/gmo/SecureTran');
	let result = execSecureTran.execute(pDictObj);
	args.OrderID = pDictObj.OrderID;
	if( result == PIPELET_ERROR){
		return {error: true};
	}

	return {};

}

exports.SecureTran			= secureTran;
exports.SecureTran.public	= false;
