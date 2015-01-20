function load_expenses_chart() {
    metadata = [
        {field_name: "month", data_type: "STRING"},
        {field_name: "total_spending", data_type: "NUMERIC"},
    ]

    configurations = {
        margins: {top: 20, right: 30, bottom: 30, left: 60},
        axis_font: "12px sans-serif",
        axis_line_color: "#000",
        show_x_axis: true,
        y_axis_label: "Total Spending",
        column_spacing: 0.2
    }

    BarChart("#expense_chart", "db.php?qtype=total_spending_by_month",
        metadata, configurations);
}
