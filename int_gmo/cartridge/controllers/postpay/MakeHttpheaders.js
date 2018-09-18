'use strict'

var Logger				= require('dw/system/Logger');
var ArrayList			= require('dw/util/ArrayList');
var Order				= require('dw/order/Order');
var ProductLineItem		= require('dw/order/ProductLineItem');
var ShippingLineItem	= require('dw/order/ShippingLineItem');
var PriceAdjustment		= require('dw/order/PriceAdjustment');
var PaymentInstrument	= require('dw/order/PaymentInstrument');

/**
 * Making HTTP Headers
 * @param    null
 * @returns {Object}
 */
function makeHttpheaders() {
    var logger = Logger.getLogger('GMO');

    let httpHeaders = '';

    if (request.getHttpHeaders().containsKey('accept')) {
    	httpHeaders += request.httpHeaders['accept'];
    }
    httpHeaders += ';:';

    if (request.getHttpHeaders().containsKey('accept-charset')) {
    	httpHeaders += request.httpHeaders['accept-charset'];
    }
    httpHeaders += ';:';

    if (request.getHttpHeaders().containsKey('accept-encoding')) {
    	httpHeaders += request.httpHeaders['accept-encoding'];
    }
    httpHeaders += ';:';

    if (request.getHttpHeaders().containsKey('accept-language')) {
    	httpHeaders += request.httpHeaders['accept-language'];
    }
    httpHeaders += ';:';

    if (request.getHttpHeaders().containsKey('client-ip')) {
    	httpHeaders += request.httpHeaders['client-ip'];
    }
    httpHeaders += ';:';

    if (request.getHttpHeaders().containsKey('connection')) {
    	httpHeaders += request.httpHeaders['connection'];
    }
    httpHeaders += ';:';

    if (request.httpHeaders['user-agent'].search('Mozilla/') != -1) {
        if (request.getHttpHeaders().containsKey('dnt')) {
        	httpHeaders += request.httpHeaders['dnt'];
        }
    } else {
        if (request.getHttpHeaders().containsKey('x-do-not-track')) {
        	httpHeaders += request.httpHeaders['x-do-not-track'];
        }
    }
    httpHeaders += ';:';

    if (request.getHttpHeaders().containsKey('host')) {
    	httpHeaders += request.httpHeaders['host'];
    }
    httpHeaders += ';:';

    if (request.getHttpHeaders().containsKey('referrer')) {
    	httpHeaders += request.httpHeaders['referrer'];
    }
    httpHeaders += ';:';

    if (request.getHttpHeaders().containsKey('user-agent')) {
    	httpHeaders += request.httpHeaders['user-agent'];
    }
    httpHeaders += ';:';

    if (request.getHttpHeaders().containsKey('keep-alive')) {
    	httpHeaders += request.httpHeaders['keep-alive'];
    }
    httpHeaders += ';:';

    if (request.getHttpHeaders().containsKey('ua-cpu')) {
    	httpHeaders += request.httpHeaders['ua-cpu'];
    }
    httpHeaders += ';:';

    if (request.getHttpHeaders().containsKey('via')) {
    	httpHeaders += request.httpHeaders['via'];
    }
    httpHeaders += ';:';

    if (request.getHttpHeaders().containsKey('x-forwarded-for')) {
    	httpHeaders += request.httpHeaders['x-forwarded-for'];
    }
    httpHeaders += ';:';

    //その他は取得できないため省略
    httpHeaders += ';:';

    httpHeaders += request.httpRemoteAddress;
    httpHeaders += ';:';

    //携帯電話の端末識別 ID は取得できないため省略

    return httpHeaders;
}

exports.makeHttpheaders            = makeHttpheaders;
exports.makeHttpheaders.public    = false;
