function render_similar_transactions(output, data, exp_or_inc) {
    if(data == '') {
        output.children(".no_data").show();
        output.children(".have_data").hide();
    } else {
        var thead = $('<thead></thead>');
        var thead_tr = $('<tr></tr>');
        thead_tr.append($('<th class="date">Date</th>'));
        thead_tr.append($('<th class="category">Category</th>'));
        if (exp_or_inc == 'exp') {
            thead_tr.append($('<th class="subcategory">Subcategory</th>'));
        }
        thead_tr.append($('<th class="amount">Amount</th>'));
        thead_tr.append($('<th class="confirmed">Confirmed</th>'));
        thead.append(thead_tr);

        var tbody = $('<tbody></tbody>');
        var rows = data.split('\\n');
        $.each(rows, function(i, row) {
            if(row != '') {
                var fields = row.split('\\t');
                var tbody_tr = $('<tr></tr>');
                tbody_tr.append($('<td class="date">' + fields[1].substring(0, 10) + '</td>'));
                tbody_tr.append($('<td class="category">' + fields[2] + '</td>'));
                if (exp_or_inc == 'exp') {
                    tbody_tr.append($('<td class="subcategory">' + fields[3] + '</td>'));
                    tbody_tr.append($('<td class="amount">' + fields[4] + '</td>'));
                    var is_confirmed = fields[5];
                } else {
                    tbody_tr.append($('<td class="amount">' + fields[3] + '</td>'));
                    var is_confirmed = fields[4];
                }
                var confirmed = $('<input type="checkbox" />');
                confirmed.prop('checked', is_confirmed == '1');
                tbody_tr.append($('<td class="confirmed"></td>').append(confirmed));
                tbody_tr.data('data', {'transaction_id': fields[0]});
                tbody.append(tbody_tr);
            }
        });

        var result_table = $('<table></table>');
        result_table.append(thead);
        result_table.append(tbody);

        result_table.find('input[type="checkbox"]').click(function() {
            $.post("db.php?qtype=confirm_transaction", {
                exp_or_inc: $('#exp-or-income ul li:first-child a').hasClass('selected') ? 'exp' : 'inc',
                transaction_id: $(this).parent().parent().data('data').transaction_id,
                unconfirm: !$(this).is(':checked')
            }).done(function(result) {
                if(result == 'ok') {
                    $(this).prop('checked', $(this).is(':checked'));
                } else {
                    $(this).prop('checked', !$(this).is(':checked'));
                }
            });
        });

        output.children(".have_data").empty();
        output.children(".have_data").append(result_table);
        output.children(".no_data").hide();
        output.children(".have_data").show();
    }
}

function save_transaction(amount, category, date, save_button) {
    amount_passed = true;
    category_passed = true;
    date_passed = true;

    if(amount.data('data') == undefined) {
        amount_passed = false;
        amount.children('span').first().css('color', 'red');
    } else if (amount.data('data').trans_amt > 0) {
        amount.children('span').first().css('color', '#ccc');
    } else {
        amount_passed = false;
        amount.children('span').first().css('color', 'red');
    }

    if(category.data('data') == undefined) {
        category_passed = false;
        category.children('span').first().css('color', 'red');
    } else {
        category.children('span').first().css('color', '#ccc');
    }

    if(date.data('data') == undefined) {
        date_passed = false;
        date.children('span').first().css('color', 'red');
    } else {
        date.children('span').first().css('color', '#ccc');
    }

    if(amount_passed == false) {
        amount.children('input:not([readonly])').first().focus();
        return;
    }

    if(category_passed == false) {
        category.children('input:not([readonly])').first().focus();
        return;
    }

    if(date_passed == false) {
        date.children('input:not([readonly])').first().focus();
        return;
    }

    save_button.prop('disabled', true);
    $.post("db.php?qtype=new_transaction", {
        exp_or_inc: $('#exp-or-income ul li:first-child a').hasClass(
            'selected') ? 'exp' : 'inc',
        amount: amount.data('data').trans_amt,
        category: category.data('data').trans_cat_id,
        date: date.data('data').date
    }, function(result) {
        console.log(result);
        if(result == 'ok') reset_new_transaction_form();
        save_button.prop('disabled', false);
    });
}

function open_new_transaction() {
    $('#new_transaction').slideDown(200, init_new_transaction);
}

function init_new_transaction() {
    var exp_or_inc = $('#exp-or-income ul li:first-child a').hasClass(
        'selected') ? 'exp' : 'inc';

    $.get('db.php?qtype=trans_cat&exp_or_inc=' + exp_or_inc, function(data) {
        $('#suggestion-box').empty();
        var categories = data.split('\\n');
        $.each(categories, function(index, value) {
            var fields = value.split('\\t');
            if (exp_or_inc == 'exp') {
                var display_category = fields[2] + " > " + fields[1];
                if(fields[1] == fields[2]) display_category = fields[2];
            } else {
                var display_category = fields[1];
            }

            $('#suggestion-box').append(
                $('<div>').data("data", {
                    'trans_cat_id': fields[0],
                    'trans_cat_display': display_category
                }).html(display_category)
            );
        });

        $('#suggestion-box div').mouseover(function() {
            $('#suggestion-box div').removeClass('selected');
            $(this).addClass('selected');
        })

        $('#new_transaction > div:last-child').show();
        reset_new_transaction_form();
        $('#amount_int').focus();
    });
}

function close_new_transaction() {
    $('#new_transaction').slideUp(200, function() {
        $('#new_transaction > div:last-child').hide();
    });
}

function reset_new_transaction_form() {
    var amount = $('#input_amount');
    var category = $('#input_category');
    var date = $('#input_date');

    amount.children('span').first().css('color', '#ccc');
    category.children('span').first().css('color', '#ccc');
    date.children('span').first().css('color', '#ccc');
    amount.children('input:not([readonly])').val('');
    category.children('input:not([readonly])').val('');
    amount.removeData();
    category.removeData();
    $('#similar_trans').children(".no_data").show();
    $('#similar_trans').children(".have_data").hide();
    amount.children('input:not([readonly])').first().focus();
}
