// Import amCharts modules
am5.ready(function() {
    // Create root element
    var root = am5.Root.new("chartdiv");
  
    // Set a theme
    root.setThemes([am5themes_Animated.new(root)]);
  
    // Create a chart
    var chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        layout: root.verticalLayout
      })
    );
  
    // Create X-axis (Categories: Days)
    var xAxis = chart.xAxes.push(
      am5xy.CategoryAxis.new(root, {
        maxDeviation: 0.3,
        categoryField: "day",
        renderer: am5xy.AxisRendererX.new(root, {}),
        tooltip: am5.Tooltip.new(root, {})
      })
    );
  
    // Create Y-axis (Values: Sales)
    var yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, {})
      })
    );
  
    // Create series
    var series = chart.series.push(
      am5xy.ColumnSeries.new(root, {
        name: "Sales",
        xAxis: xAxis,
        yAxis: yAxis,
        valueYField: "sales",
        categoryXField: "day",
        tooltip: am5.Tooltip.new(root, {
          labelText: "{valueY}"
        })
      })
    );
  
    // Add data
    var data = [
      { day: "Monday", sales: 20 },
      { day: "Tuesday", sales: 18 },
      { day: "Wednesday", sales: 42 },
      { day: "Thursday", sales: 32 },
      { day: "Friday", sales: 25 },
      { day: "Saturday", sales: 20 },
      { day: "Sunday", sales: 29 },
    ];
  
    // Bind data to the axes
    xAxis.data.setAll(data);
    series.data.setAll(data);
  
    // Add chart cursor
    chart.set("cursor", am5xy.XYCursor.new(root, {}));
  
    // Animate chart on load
    series.appear(1000);
    chart.appear(1000, 100);
});