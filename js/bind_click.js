function bind_click() {
    $('#btn_add_transaction').click(function() {
        save_transaction(
            $('#input_amount'),
            $('#input_category'),
            $('#input_date'),
            $(this));
    });

    $('#exp-or-income a').click(function() {
        $('#exp-or-income a').removeClass('selected');
        $(this).addClass('selected');
        init_new_transaction();
    })
}
