$( document ).ready(function() {
	if($('#gmoPaymentCardList').val() == "AddNewCard"){
		loadAddNewCard();
	}

	$('input[name$="_saveCard"]').change(function() {
		var a = $('#countNumberCard').val();
	    if(a=="0") {
	      $(this).prop('checked',false);
	      alert('Card registration is limted!');
	    }
	});
	var $form = $('.address');
	$('select[name$="_addressList"]', $form).on('change', function () {
		var $creditCard = $('[data-method="CREDIT_CARD"]');
		var cardType = $("#cardType").val();
		$creditCard.find('select[name$="_type"]').val(cardType);
	});
	if ($('#gmoPaymentCardList').length != 0 && $('#gmoPaymentCardList').val() != "AddNewCard") {
		var $creditCard = $('[data-method="CREDIT_CARD"]');
		$creditCard.find('input[name$="_cvn"]').val('123');
		$creditCard.find('input[name$="_cvn"]').parent().parent().hide();
		$creditCard.find('input[name$="_saveCard"]').prop('checked',false);
		var hidCardSeq = $creditCard.find('[name$="hidCardSeq"]');
		if(hidCardSeq.val()==""){
			var selected = $('#gmoPaymentCardList').children(':selected').first();
			hidCardSeq.val(selected.val());
		}
		$('#gmoPaymentCardList option[value="'+ hidCardSeq.val() +'"]').attr('selected','selected');
	}
	$('#gmoPaymentCardList').on('change', function (e) {
		var selected = $(this).children(':selected').first();
		var selectedCard = $(selected).data('card');
		var $creditCard = $('[data-method="CREDIT_CARD"]');
		$creditCard.find('[name$="hidCardSeq"]').val(selected.val());
		if ($(selected).val() == "AddNewCard") {
			loadAddNewCard();
			return;
		} else {
			$creditCard.find('input[name$="_cvn"]').parent().parent().hide();
			$creditCard.find('input[name$="_saveCard"]').parent().parent().hide();
			$creditCard.find('input[name$="_saveCard"]').prop('checked',false);
			$creditCard.find('select[name$="_type"]').attr('disabled', 'disabled');
			$creditCard.find('select[name$="_payinfo"]').attr('disabled', 'disabled');
			$creditCard.find('select[name$="_paytime"]').attr('disabled', 'disabled');
			$creditCard.find('select[name$="_month"]').attr('disabled', 'disabled');
			$creditCard.find('select[name$="_year"]').attr('disabled', 'disabled');
			$creditCard.find('input[name$="_number"]').attr('disabled', 'disabled');
			var validateErrorForm = $("#validateError").val();
			if(validateErrorForm=="1"){
				$("#validateError").val("0");
			}
		}

		var expireMonth = selectedCard.expire_month;
		if (expireMonth < 10) {
			expireMonth = expireMonth.substr(1,1);
		}

		// set value for credit card fields
		$creditCard.find('select[name$="_type"]').val(selectedCard.card_type);
		$creditCard.find('select[name$="_payinfo"]').val(selectedCard.card_payinfo);
		$creditCard.find('select[name$="_paytime"]').val(selectedCard.card_paytime);
		$creditCard.find('input[name$="_number"]').val(selectedCard.card_number);
		$creditCard.find('[name$="_month"]').val(expireMonth);
		$creditCard.find('[name$="_year"]').val(selectedCard.expire_year);
		$creditCard.find('[name$="_cvn"]').val(selectedCard.cvn);

		var crdMonth = $('select[name$="creditCard_expiration_month"]');
		var cvn = $('input[name$="paymentMethods_creditCard_cvn"]');
		var crdYear = $('select[name$="creditCard_expiration_year"]');
		var cardInfo = $('input[name$="paymentMethods_creditCard_payinfo"]');
		var cardTime = $('input[name$="paymentMethods_creditCard_paytime"]');
		var cardNumber = $('input[name$="paymentMethods_creditCard_number"]');

		cardInfo.parent().next().hide();
		cardInfo.parent().parent().removeClass("error");
		cardTime.parent().next().hide();
		cardTime.parent().parent().removeClass("error");
		cardNumber.parent().next().hide();
		cardNumber.parent().parent().removeClass("error");
		crdMonth.parent().next().hide();
		crdMonth.parent().parent().removeClass("error");
		crdYear.parent().parent().removeClass("error");
		cvn.parent().next().next().hide();
		cvn.parent().parent().removeClass("error");
		$("#cardType").val(selectedCard.card_type);

		// Create a payment method select
		setSelectPayInfo();
		// Create payment installment select
		setSelectPayTime();

		// Set disable/enable for submit button
		gmoValidateForm();
	});
	$('select[name$="_creditCard_type"]').on('change', function (e) {
		// Create a payment method select
		setSelectPayInfo();
		// Create payment installment select
		setSelectPayTime();
	});
	$('select[name$="_creditCard_payinfo"]').on('change', function (e) {
		// Create payment installment select
		setSelectPayTime();
	});

	var $btnBillingsubmit = $('#applyBtn');
	$btnBillingsubmit.on('click', function (e) {
		var $creditCard = $('[data-method="CREDIT_CARD"]');
		$creditCard.find('select[name$="_payinfo"]').removeAttr('disabled');
		$creditCard.find('select[name$="_paytime"]').removeAttr('disabled');

		e.preventDefault();
		doPurchase();
	});
	 /*
	 document.getElementById("applyBtn").addEventListener("click", function(event){
		    event.preventDefault();
		    doPurchase();
	});*/

	var $creditCard = $('[data-method="CREDIT_CARD"]');

	// Create a payment method select
	var cardInfo = $creditCard.find('input[name="cardInfo"]').val();
	setSelectPayInfo(cardInfo);

	// Create payment installment select
	var cardTime = $creditCard.find('input[name="cardTime"]').val();
	setSelectPayTime(cardTime);

	// In case of input error or editin
	var $number = $('input[name$="paymentMethods_creditCard_number"]');
	var $hidCardSeq = $creditCard.find('[name$="hidCardSeq"]');
	if($number) {
		if($hidCardSeq.val() == "AddNewCard") {
			$creditCard.find('input[name$="_cvn"]').parent().parent().show();
			$creditCard.find('input[name$="_saveCard"]').parent().parent().show();
			$creditCard.find('input[name$="_saveCard"]').prop('checked',false);
			$creditCard.find('select[name$="_type"]').removeAttr('disabled');
			$creditCard.find('select[name$="_payinfo"]').removeAttr('disabled');
			$creditCard.find('select[name$="_paytime"]').removeAttr('disabled');
			$creditCard.find('select[name$="_month"]').removeAttr('disabled');
			$creditCard.find('select[name$="_year"]').removeAttr('disabled');
			$creditCard.find('input[name$="_number"]').removeAttr('disabled');
		}
		if(!$creditCard.find('input[name$="_number"]').prop('disabled')) {
			// clear number and cvn
			$('input[name$="paymentMethods_creditCard_number"]').val("");
			$('input[name$="paymentMethods_creditCard_cvn"]').val("");
		}
	}

	// Set disable/enable for submit button
	gmoValidateForm();
});

var cardno,expire,securitycode,holdername,shopID;
function loadAddNewCard(){
	var $creditCard = $('[data-method="CREDIT_CARD"]');
	$creditCard.find('input[name$="_cvn"]').parent().parent().show();
	$creditCard.find('input[name$="_saveCard"]').parent().parent().show();
	$creditCard.find('input[name$="_saveCard"]').prop('checked',false);
	$creditCard.find('select[name$="_type"]').removeAttr('disabled');
	$creditCard.find('select[name$="_payinfo"]').removeAttr('disabled');
	$creditCard.find('select[name$="_paytime"]').removeAttr('disabled');
	$creditCard.find('select[name$="_month"]').removeAttr('disabled');
	$creditCard.find('select[name$="_year"]').removeAttr('disabled');
	$creditCard.find('input[name$="_number"]').removeAttr('disabled');

	// reset value of fields
	var validateErrorForm = $("#validateError").val();
	if(validateErrorForm=="0"){
		$creditCard.find('select[name$="_type"]').val($creditCard.find('select[name$="_type"] option:first').val());
		$creditCard.find('select[name$="_payinfo"]').val($creditCard.find('select[name$="_payinfo"] option:first').val());
		$creditCard.find('select[name$="_paytime"]').val($creditCard.find('select[name$="_paytime"] option:first').val());
		$creditCard.find('select[name$="_month"]').val($creditCard.find('select[name$="_month"] option:first').val());
		$creditCard.find('select[name$="_year"]').val($creditCard.find('select[name$="_year"] option:first').val());
		$creditCard.find('input[name$="_number"]').val('');
		$creditCard.find('input[name$="_cvn"]').val('');
	}

	var cardType = $("#cardType").val();
	var $tagObj = $creditCard.find('select[name$="_type"]');
	$tagObj.val(cardType);

	// Create a payment method select
	setSelectPayInfo();
	// Create payment installment select
	setSelectPayTime();

	// Set disable/enable for submit button
	gmoValidateForm();
}
function gmoValidateForm () {
	var $form = $('form[id$="billing"]');
	var $continue = $('[name$="billing_save"]');
	var $requiredInputs = $('.required', $form).find(':input');
	var canSubmit = true;

	$requiredInputs.filter(':visible').each(function () {
		var eleVal = $(this).val();
		if ($.trim(eleVal) == '') {
			canSubmit = false;
			return false;
		}
	});

	if (canSubmit) {
		$continue.removeAttr('disabled');
	} else {
		$continue.attr('disabled', 'disabled');
	}
}
function execPurchase(response) {
    console.log(response);
    if( response.resultCode != "000" ){
    	document.getElementById("creditCardtoken").value = "";
    }else{
        document.getElementById("creditCardtoken").value = response.tokenObject.token;
    }
    callgetTokenRegistCard(shopID,cardno,expire,securitycode,holdername);
}
function getTokenRegistCard(response) {
    console.log(response);
    if( response.resultCode != "000" ){
    	document.getElementById("creditCardtoken1").value = "";
    }else{
        document.getElementById("creditCardtoken1").value = response.tokenObject.token;
    }
    document.getElementById("dwfrm_billing").submit();
 }
 function callExecPurchase(shopID,cardno,expire,securitycode,holdername){
	 Multipayment.init(shopID);
	 Multipayment.getToken(
	 	{
	        cardno: cardno,
	        expire: expire,
	        securitycode: securitycode
	    },execPurchase
   );
}
function callgetTokenRegistCard(shopID,cardno,expire,securitycode,holdername){
	 Multipayment.init(shopID);
	 Multipayment.getToken(
	 		{
		        cardno: cardno,
		        expire: expire,
		        securitycode: securitycode
		    },getTokenRegistCard
	);
 }
 function doPurchase(){
    cardno = document.getElementById("dwfrm_billing_paymentMethods_creditCard_number").value.trim();
    var a = document.getElementById("dwfrm_billing_paymentMethods_creditCard_expiration_year");
    var b = document.getElementById("dwfrm_billing_paymentMethods_creditCard_expiration_month");
    var c = document.getElementById("dwfrm_billing_paymentMethods_creditCard_type");
    var d = document.getElementById("dwfrm_billing_paymentMethods_creditCard_payinfo");
    var e = document.getElementById("dwfrm_billing_paymentMethods_creditCard_paytime");
    var cardYear = a.options[a.selectedIndex].value;
    var cardMonth = b.options[b.selectedIndex].value;
    var cardtype = c.options[c.selectedIndex].value.trim();
    expire  = cardYear.slice(-2) + ((cardMonth.length==1)?'0' + cardMonth:cardMonth);

    var cardPayInfo = '';
    var cardPayTime = '';
    if (d.options.length > 0) {
    	cardPayInfo = d.options[d.selectedIndex].value;
 	}
    if (e.options.length > 0) {
    	cardPayTime = e.options[e.selectedIndex].value;
    }

    var card3dSecure = document.getElementById("dwfrm_billing_paymentMethods_creditCard_pay3dsecure").value;

    securitycode = document.getElementById("dwfrm_billing_paymentMethods_creditCard_cvn").value;
    holdername = document.getElementById("dwfrm_billing_billingAddress_addressFields_lastName").value;

    var selectCreditCard = document.getElementById("gmoPaymentCardList");
    if (selectCreditCard != null){
    	document.getElementById("hidCardSeq").value = selectCreditCard.options[selectCreditCard.selectedIndex].value;
    }

    document.getElementById("hidCardType").value = cardtype;
    document.getElementById("hidCardNo").value = cardno;
    document.getElementById("hidCardMonth").value = ((cardMonth.length==1)?'0' + cardMonth:cardMonth);
    document.getElementById("hidCardYear").value = cardYear;
    document.getElementById("hidCardPayInfo").value = cardPayInfo;
    document.getElementById("hidCardPayTime").value = cardPayTime;
    document.getElementById("hidCard3dSecure").value = card3dSecure;

    shopID = document.getElementById("shopID").value;
  	callExecPurchase(shopID,cardno,expire,securitycode,holdername);
}

 /**
  * Create a payment method select
  * @param {String} optional select value
 */
 function setSelectPayInfo(selectValue) {
		var $obj = getSelectTagObject();
		if(!$obj) {
			return;
		}

		var $selectTag = $obj.creditCardTag.find('select[name$="_creditCard_payinfo"]');
		var $inputTag = $obj.creditCardTag.find('input[name$="_creditCard_pay3dsecure"]');
		var optionsHtml;
		var inputVal;

		// Rewrite installments error style of select tag
		$selectTag.removeClass("error");
		$obj.creditCardTag.find('[id$="_creditCard_payinfo-error"]').hide();

		// Get hidden html options
		optionsHtml = $obj.payBrandTag.find('div[name="gmo_payment_method"]').html();

		// Remove html option and write optional html
		$selectTag.children().remove();
		$selectTag.append(optionsHtml);

		// Select option
		if (!selectValue) {
			$selectTag.prop('selected', true);
		}
		else {
			$selectTag.val(selectValue);
		}

		// Get hidden html text
		inputVal = $obj.payBrandTag.find('div[name="gmo_use_3d_secure"]').text();

		// Rewrite the text value
		$inputTag = $obj.creditCardTag.find('input[name$="_creditCard_pay3dsecure"]');
		$inputTag.val(inputVal);

		// Select selectable or impossible. Then, show or hide
		setPaySelectStyle($selectTag);

		// Hide Error Tag and Remove Error Class
		removeError($selectTag);
 }

 /**
  * Create payment installment select
  * @param {String} optional select value
 */
 function setSelectPayTime(selectValue) {
		var $obj = getSelectTagObject();
		if (!$obj) {
			return;
		}

		var $selectTag = $obj.creditCardTag.find('select[name$="_creditCard_paytime"]');
		var $selectInfo = $obj.creditCardTag.find('select[name$="_creditCard_payinfo"]');
		var selectedKeyword = $selectInfo.find('option:selected').attr('keyword');
		var optionsHtml;

		// Rewrite installments error style of select tag
		$selectTag.removeClass("error");
		$obj.creditCardTag.find('[id$="_creditCard_paytime-error"]').hide();

		// Get hidden html options
		optionsHtml = "";
		switch (selectedKeyword){
			case "installments":
				optionsHtml = $obj.payBrandTag.find('div[name$="_number_of_installments"]').html();
				break;
			case "installments_bonus":
				optionsHtml = $obj.payBrandTag.find('div[name$="_number_of_installments_bonus"]').html();
				break;
		}

		// Remove html option and write optional html
		$selectTag.children().remove();
		$selectTag.append(optionsHtml);

		// Select option
		if (!selectValue) {
			$selectTag.prop('selected', true);
		}
		else {
			$selectTag.val(selectValue);
		}

		// Select selectable or impossible. Then, show or hide
		setPaySelectStyle($selectTag);

		// Hide Error Tag and Remove Error Class
		removeError($selectTag);
 }

/**
 * Get html tag Object
 * tag with data-method "CREDIT_CARD"
 * Selected credit card brand tag
 *
 * @returns {Object}
*/
function getSelectTagObject(){
	var $creditCard = $('[data-method="CREDIT_CARD"]');
	var selectedType = $creditCard.find('select[name$="_creditCard_type"]').val();
	var $payBrand = null;
	if (!selectedType) {
		return null;
	}
	$payBrand = $creditCard.find('div[data-method="gmo_pay_info"] div[name$="' + selectedType.toLowerCase() + '"]');
	return {
		creditCardTag : $creditCard,
		payBrandTag   : $payBrand
	}
}

/**
 * Select selectable or impossible. Then, show or hide
*/
function setPaySelectStyle($selectTag) {
	var $rowObj = $selectTag.parent().parent();
	var value;

	// selectable or impossible(Disabled)
	value = false;
	if ($selectTag.children().length == 1) {
		value = true;
	}
	$selectTag.prop('disabled', value);

	// show or hide
	value = "";
	if ($selectTag.children().length == 0) {
		value = "none";
	}
	if($rowObj.hasClass("form-row")) {
		$rowObj.css('display',value);
	}
}

/**
 * Hide Error Tag and Remove Error Class
*/
function removeError($selectTag) {
	$selectTag.parent().next().hide();
	$selectTag.parent().parent().removeClass("error");
}
