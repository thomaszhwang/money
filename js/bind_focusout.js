function bind_focusout() {
    $('#amount_int').focusout(function() {
        trans_amt_int = conform_trans_amt_int($(this));
        trans_amt_decimal = $(this).parent().data('data') == undefined ? 0 : $(this).parent().data('data').trans_amt_decimal;
        trans_amt = conform_trans_amt(
            $(this).parent(),
            trans_amt_int,
            trans_amt_decimal
        );
        get_similar_trans(trans_amt);
    });

    $('#amount_decimal').focusout(function() {
        trans_amt_int = $(this).parent().data('data') == undefined ? 0 : $(this).parent().data('data').trans_amt_int;
        trans_amt_decimal = conform_trans_amt_decimal($(this));
        trans_amt = conform_trans_amt(
            $(this).parent(),
            trans_amt_int,
            trans_amt_decimal
        );
        get_similar_trans(trans_amt);
    });

    $('#tran_category').focusout(function() {
        conform_trans_cat($(this), $('#suggestion-box'));
    });

    $('#input_date > input[type="text"]').focusout(function() {
        conform_trans_date($('#date_year'), $('#date_month'), $('#date_day'));
    })

    $('#btn_add_transaction').focusout(function() {
        $(this).css('background', 'black');
        $(this).css('color', '#ccc');
    })
}

function get_similar_trans(trans_amt) {
    var exp_or_inc = $('#exp-or-income ul li:first-child a').hasClass(
        'selected') ? 'exp' : 'inc';
    if(trans_amt > 0) {
        $.get('db.php?qtype=similar&exp_or_inc=' + exp_or_inc + '&amt=' + trans_amt, function(data) {
            render_similar_transactions($('#similar_trans'), data)
        })
    } else {
        render_similar_transactions($('#similar_trans'), '');
    }
}
