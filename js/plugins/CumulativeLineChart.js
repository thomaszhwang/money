function CumulativeLineChart(canvas_selector, data_path, metadata, configurations) {
    function __readData(data, metadata) {
        var results = {};
        results["rows"] = [];

        var last_month_id;
        var original = [];
        var splitted_rows = data.split("\\n");
        $.each(splitted_rows, function(i, raw_row) {
            raw_row = raw_row.trim();
            if (raw_row != '') {
                var row = {};
                var splitted_fields = raw_row.split("\\t");
                $.each(splitted_fields, function(j, raw_field) {
                    if (j < metadata.length) {
                        var field_name = metadata[j].field_name;
                        var data_type = metadata[j].data_type;
                        if (data_type == "STRING")
                            row[field_name] = raw_field;
                        else if (data_type == "NUMERIC")
                            row[field_name] = +raw_field;
                        else
                            throw "unrecognized data type " + data_type;

                        if (field_name = 'date' && last_month_id == undefined) {
                            last_month_id = parseInt(raw_field.substring(5, 7));
                        }
                    }
                })
                original.push(row);
            }
        })

        cumulative_totals = [];
        for (i=0; i<metadata.length-1; i++) {
            cumulative_totals[i] = 0;
        }
        for (i=0; i<original.length; i++) {
            var row = {}
            row[metadata[0].field_name] = parseInt(original[i][metadata[0].field_name]);
            for (j=1; j<metadata.length; j++) {
                cumulative_totals[j-1] += original[i][metadata[j].field_name]
                row[metadata[j].field_name] = cumulative_totals[j-1]
            }
            results["rows"].push(row);
        }

        return results;
    }

    var margins = configurations.margins || {
        top: 20, right: 30, bottom: 30, left: 40
    };
    var axis_font = configurations.axis_font || "12px sans-serif";
    var axis_line_color = configurations.axis_line_color || "#000";
    var show_x_axis = true;
    if (configurations.show_x_axis != undefined)
        show_x_axis = configurations.show_x_axis;
    var y_axis_label = configurations.y_axis_label || "";
    var column_spacing = configurations.column_spacing || 0.1;
    var width = $(canvas_selector).width() - margins.left - margins.right;
    var height = $(canvas_selector).height() - margins.top - margins.bottom;

    $.get(data_path, function(data) {
        var results = __readData(data, metadata);

        var x = d3.scale.ordinal()
            .rangeRoundPoints([0, width])
            .domain([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17,
                18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");

        var y = d3.scale.linear()
            .range([height, 0])
            .domain([0, Math.max.apply(Math, results.rows.map(function(d) {
                return d[metadata[1].field_name];
            }).concat(results.rows.map(function(d) {
                return d[metadata[2].field_name];
            })))])

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left")
            .ticks(10);

        var chart = d3.select(canvas_selector)
            .attr("width", width + margins.left + margins.right)
            .attr("height", height + margins.top + margins.bottom)
          .append("g")
            .attr("transform",
                "translate(" + margins.left + ", " + margins.top + ")");

        chart.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0, " + height + ")")
            .call(xAxis);

        chart.append("g")
            .attr("class", "y axis")
            .call(yAxis)
          .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text(y_axis_label);

        chart.selectAll("g.axis").style("font", axis_font);
        chart.selectAll("g.axis path, g.axis line").style({
            "fill": "none",
            "stroke": axis_line_color,
            "shape-rendering": "crispEdges"
        });
        if (show_x_axis == false) chart.selectAll("g.x.axis path").style({
            "display": "none"
        });

        chart.selectAll("circle.line1")
            .data(results.rows)
          .enter().append("circle")
            .attr("class", "line1")
            .attr("cx", function(d) { return x(d[metadata[0].field_name]); })
            .attr("cy", function(d) { return y(d[metadata[1].field_name]); })
            .attr("r", 3)
            .attr("fill", "steelblue");

        chart.selectAll("circle.line2")
            .data(results.rows)
          .enter().append("circle")
            .attr("class", "line1")
            .attr("cx", function(d) { return x(d[metadata[0].field_name]); })
            .attr("cy", function(d) { return y(d[metadata[2].field_name]); })
            .attr("r", 3)
            .attr("fill", "red");

        var lineFunc = d3.svg.line()
            .x(function(d) { return x(d[metadata[0].field_name]); })
            .y(function(d) { return y(d[metadata[1].field_name]); })
            .interpolate("linear");

        function __lineFunc(field_idx) {
            return d3.svg.line()
                .x(function(d) { return x(d[metadata[0].field_name]); })
                .y(function(d) { return y(d[metadata[field_idx].field_name]); })
                .interpolate("linear");
        }

        chart.append("path")
            .attr('d', __lineFunc(1)(results.rows))
            .attr("stroke", "steelblue")
            .attr("stroke-width", 2)
            .attr("fill", "none");

        chart.append("path")
            .attr('d', __lineFunc(2)(results.rows))
            .attr("stroke", "red")
            .attr("stroke-width", 2)
            .attr("fill", "none");
    })
}
