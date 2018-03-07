var coefficientExplorer = {};

coefficientExplorer.timeline = function(){
    var dimensions = {width:0, height:0};
    var container, data, transformedData;
    var filters = {};
    var scales = {
        time: d3.scaleTime(),
        rawDataValue: d3.scaleLinear()
    };

    var dragCallbacks = [];

    var onUpdateHovered = function(){
        dragCallbacks.forEach(function(f){
            return f(true);
        })
    };
    var startX = 0, endX=0;

    function _dragStart(){
        filters.selectedIndices = [];
        filters.selectedReduced = [];
        startX = d3.event.x;
        endX = d3.event.x;
    }

    function _dragging(){
        var current = d3.event.x;
        if(startX > current){
            startX = current
        }
        else if (current > endX){
            endX = current
        }
        else if (current < endX){
            startX = current
        }

        container.select('rect.selected-range')
            .attr('width',endX - startX)
            .attr('height', dimensions.height)
            .attr('fill','lightgrey')
            .attr('fill-opacity',.6)
            .attr('x',startX)
            .attr('y',0);
      }

    function _dragEnd(){
        filters.selectedIndices = [];
        var plotSpacing = (dimensions.width) / transformedData.length;

        var current = d3.event.x;
        if(startX > current){
            startX = current
        }
        else if (current > endX){
            endX = current
        }
        else if (current < endX){
            startX = current
        }

        container.select('rect.selected-range')
            .attr('width',endX - startX)
            .attr('height', dimensions.height)
            .attr('fill','lightgrey')
            .attr('fill-opacity',.6)
            .attr('x',startX)
            .attr('y',0);

        var startI = scales.time.invert(startX);
        var endI = scales.time.invert(endX);

        filters.selectedIndices = _.filter(transformedData, function(d){return d.timestamp >= startI && d.timestamp <= endI; });

        draw();
        onUpdateHovered();
    }

    function filterData(d){
        return _.filter(d, function(x){
            return x.psn == filters.selectedPsn;
        })
    }

    function transformData(d){
        return _.map(d, function(x){
            var result = {
                timestamp:moment(x.timestamp),
                index:x.index,
                pcX:x[filters.eigX],
                pcY:x[filters.eigY]
            };

            if(filters.rawDataField){
                result[filters.rawDataField] = x[filters.rawDataField];
            }

            return result;
        });
    }

    function updateTransformedData(){
        transformedData = transformData(filterData(data));
    }

    function build(){
    }

    function draw(refreshData){
        updateTransformedData();
        if(refreshData){
            startX = 0, endX=0;
        }

        var plotSpacing = (dimensions.width) / transformedData.length;

        scales.rawDataValue.domain(d3.extent(transformedData,function(d){return d[filters.rawDataField]}));
        scales.rawDataValue.range([dimensions.height-10, 10]);


        var timeExtent = d3.extent(transformedData,function(d){return d['timestamp']});
        scales.time.domain(timeExtent);
        scales.time.range([10,dimensions.width-10]);

        container
            .attr('width',dimensions.width)
            .attr('height', dimensions.height);

        container.select('rect.selected-range')
            .attr('width',endX - startX)
            .attr('height', dimensions.height)
            .attr('fill','lightgrey')
            .attr('fill-opacity',.6)
            .attr('x',startX)
            .attr('y',0);

        container.select('rect.timeline-hover')
            .attr('fill-opacity',0)
            .attr('stroke-opacity',0);

        var drag_behavior = d3.drag()
            .on("start", _dragStart)
            .on("drag", _dragging)
            .on("end", _dragEnd);

        container.select('rect.timeline-hover')
            .attr('width',dimensions.width)
            .attr('height', dimensions.height)
            .call(drag_behavior);

        var line = d3.line()
            .x(function(d,i) {
                var f = scales.time(d['timestamp']);
                return f; })
            .y(function(d) {
                var f = d[filters.rawDataField];
                var scaled = scales.rawDataValue(f);
                return scaled || 0;
            });
        container
            .select("path")
                .datum(transformedData)
                .attr("fill", "none")
                .attr("stroke", "grey")
                .attr("stroke-linejoin", "round")
                .attr("stroke-linecap", "round")
                .attr("stroke-width", 1.5)
                .attr("d", line);

        var circles = container.selectAll('circle.selected-node').data(filters.selectedIndices);

        circles
            .enter()
                .append('circle')
                    .attr('class','selected-node')
                    .attr('fill','red')
                    .attr('r','3')
                    .attr('opacity',.6)
            .merge(circles)
                .attr('cx', function(d){
                    return scales.time(d['timestamp'])
                })
                .attr('cy',function(d) {
                    var f = d[filters.rawDataField];
                    var scaled = scales.rawDataValue(f);
                    return scaled || 0;
                })

        circles.exit().remove();

        var circles = container.selectAll('circle.selected-reduced-node').data(filters.selectedReduced);

        circles
            .enter()
            .append('circle')
            .attr('class','selected-reduced-node')
            .attr('fill','red')
            .attr('r','3')
            .attr('opacity',.6)
            .merge(circles)
            .attr('cx', function(d){
                return scales.time(moment(d['timestamp']))
            })
            .attr('cy',function(d) {
                var f = d[filters.rawDataField];
                var scaled = scales.rawDataValue(f);
                return scaled || 0;
            })

        circles.exit().remove();



    }

    function constructor(selection){
        selection.each(function (d, i) {
            container = d3.select(this);
            data = d;
            build();
            draw();
        });
    }

    constructor.dimensions = function (value) {
        if (!arguments.length) return dimensions;
        dimensions['width'] = value['width'];
        dimensions['height'] = value['height'] * 2/7;
        dimensions['parentWidth'] = value['width'];
        dimensions['parentHeight'] = value['height'];
        return constructor;
    };

    constructor.filters = function (value) {
        if (!arguments.length) return filters;
        filters = value;
        return constructor;
    };

    constructor.onUpdateHovered = function (value) {
        if (!arguments.length) return dragCallbacks;
        dragCallbacks = [value];
        return constructor;
    };

    constructor.draw = draw;

    return constructor;
};

coefficientExplorer.scatterPlot = function(){
    var dimensions = {width:0, height:0};
    var container, g, data, selectedData, filteredData;
    var filters = {};
    var scales = {
        xScale: d3.scaleLinear(),
        yScale: d3.scaleLinear()
    };
    var dragCoords = {xStart:0,yStart:0,xEnd:0, yEnd:0};

    var selectCallbacks=[];
    function onUpdateSelect(){
        selectCallbacks.forEach(function(f){
            f(true);
        });
    }
    function _dragStart(){
        dragCoords = {
            xStart:d3.event.x,
            yStart:d3.event.y,
            xEnd:0,
            yEnd:0
        };

    }

    function _dragging(){
        dragCoords.xEnd = d3.event.x;
        dragCoords.yEnd = d3.event.y;

        container.select('rect.selected-range')
            .attr('width',dragCoords.xEnd - dragCoords.xStart)
            .attr('height', dragCoords.yEnd - dragCoords.yStart)
            .attr('fill','lightgrey')
            .attr('fill-opacity',.2)
            .attr('x',dragCoords.xStart)
            .attr('y',dragCoords.yStart);
    }

    function _dragEnd(){
        filters.selectedIndices = [];
        filters.selectedReduced = [];


        dragCoords.xEnd = d3.event.x;
        dragCoords.yEnd = d3.event.y;

        container.select('rect.selected-range')
            .attr('width',dragCoords.xEnd - dragCoords.xStart)
            .attr('height', dragCoords.yEnd - dragCoords.yStart)
            .attr('fill','lightgrey')
            .attr('fill-opacity',.2)
            .attr('x',dragCoords.xStart)
            .attr('y',dragCoords.yStart);

        var startEigX = scales.xScale.invert(dragCoords.xStart > dragCoords.xEnd ? dragCoords.xEnd : dragCoords.xStart);
        var endEigX = scales.xScale.invert(dragCoords.xStart > dragCoords.xEnd ? dragCoords.xStart : dragCoords.xEnd);

        var startEigY = scales.yScale.invert(dragCoords.yStart > dragCoords.yEnd ? dragCoords.yStart : dragCoords.yEnd);
        var endEigY = scales.yScale.invert(dragCoords.yStart > dragCoords.yEnd ? dragCoords.yEnd : dragCoords.yStart);

        filters.selectedReduced = _.filter(filteredData, function(d){
            return d[filters.eigX] >= startEigX && d[filters.eigX] <= endEigX && d[filters.eigY] >= startEigY && d[filters.eigY] <= endEigY; });

        draw();
        onUpdateSelect(true);
    }

    function filterData(d){
        return _.filter(d, function(x){
            return x.psn == filters.selectedPsn;
        })
    }

    function transformData(d){
        return _.map(d, function(x){
            var result = {
                timestamp:x.timestamp,
                index:x.index,
                pcX: x.pcX,
                pcY: x.pcY
            };
            return result;
        });
    }
    function updateTransformedData(){
        selectedData = transformData(filterData(data));
        dataFilter = crossfilter(selectedData);
    }
    function build(){

    }

    function draw(refreshData){
        if(refreshData) {
            filteredData = (filterData(data));
            dragCoords = {xStart:0,yStart:0,xEnd:0, yEnd:0};
            container.select('rect.selected-range')
                .attr('fill-opacity',0);
        }
        selectedData = transformData(filters.selectedIndices);

        var yExtent = d3.extent(_.map(_.pluck(filteredData, filters.eigY),function(d){return parseFloat(d);}));
        var xExtent = d3.extent(_.map(_.pluck(filteredData,filters.eigX),function(d){return parseFloat(d);}));

        scales.xScale.domain(xExtent);
        scales.xScale.range([10,dimensions.width-10]);

        scales.yScale.domain(yExtent);
        scales.yScale.range([dimensions.height-10, 10]);

        g = container.select('g').attr('transform','translate(5 1)');
        container.attr('width',dimensions.width)
            .attr('height', dimensions.height)
            .attr('y',(dimensions.parentHeight*2/7));

        var drag_behavior = d3.drag()
            .on("start", _dragStart)
            .on("drag", _dragging)
            .on("end", _dragEnd);

        container.select('.scatter-hover')
            .attr('width',dimensions.width-10)
            .attr('height', dimensions.height-2)
            .attr('fill-opacity',0)
            .attr('stroke','grey')
            .attr('stroke-width',1)
            .attr('transform','translate(5 1)')
            .call(drag_behavior);

        var i = g.selectAll('circle.reduced-entry-inactive').attr('fill','lightgrey')
            .attr('r',4)
            .data(filteredData);

        i.enter()
            .append('circle')
            .attr('class','reduced-entry-inactive')
            .attr('r',4)
            .attr('fill-opacity',.4)
            .attr('fill','lightgrey')
            .attr('stroke-width',0)
            .merge(i)
            .attr('cx', function(d,i){ return scales.xScale(parseFloat(d[filters.eigX]));})
            .attr('cy', function(d,i){
                return scales.yScale(parseFloat(d[filters.eigY]));
            });

        i.exit().remove();

        var r = g.selectAll('circle.reduced-entry').attr('fill','green')
            .attr('r',4)
            .data(selectedData);
        r.enter()
            .append('circle')
            .attr('class','reduced-entry')
            .attr('r',4)
            .attr('fill-opacity',.6)
            .attr('fill','green')
            .attr('stroke-width',0)
            .merge(r)
            .attr('cx', function(d,i){ return scales.xScale(d.pcX);})
            .attr('cy', function(d,i){
            return scales.yScale(d.pcY);
        });
        r.exit().remove();

        var c = g.selectAll('circle.reduced-entry-selected').attr('fill','blue')
            .attr('r',4)
            .data(filters.selectedReduced);

        c.enter()
            .append('circle')
            .attr('class','reduced-entry-selected')
            .attr('r',4)
            .attr('fill-opacity',.6)
            .attr('fill','blue')
            .attr('stroke-width',0)
            .merge(c)
            .attr('cx', function(d,i){ return scales.xScale(d[filters.eigX]);})
            .attr('cy', function(d,i){
                return scales.yScale(d[filters.eigY]);
            });

        c.exit().remove();

        var line = d3.line()
            .x(function(d,i) {
                var f = scales.xScale(d.pcX);
                return f; })
            .y(function(d) {
                return scales.yScale(d.pcY);
            });

        g.selectAll("path").remove();
        g.append("path")
            .attr("fill", "none")
            .attr("stroke", "green")
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round")
            .attr("stroke-width", 1)
            .attr("d", line(selectedData))
            .attr("stroke-dasharray", function(d){ return this.getTotalLength() })
            .attr("stroke-dashoffset", function(d){ return this.getTotalLength() })
            .transition(d3.transition()
                .duration(3000)
                .ease(d3.easeLinear))
            .attr("stroke-dashoffset", 0);

    }

    function constructor(selection){
        selection.each(function (d, i) {
            container = d3.select(this);
            data = d;
            build();
            draw(true);
        });
    }

    constructor.dimensions = function (value) {
        if (!arguments.length) return dimensions;
        dimensions['width'] = value['width'];
        dimensions['height'] = value['height'] * 4/7;
        dimensions['parentWidth'] = value['width'];
        dimensions['parentHeight'] = value['height'];
        return constructor;
    };

    constructor.filters = function (value) {
        if (!arguments.length) return filters;
        filters = value;
        return constructor;
    };
    constructor.draw = draw;
    constructor.selectCallbacks = function (value) {
        if (!arguments.length) return selectCallbacks;
        selectCallbacks = value;
        return constructor;
    };

    return constructor;
};

coefficientExplorer.title = function(){
    var dimensions = {width:0, height:0};
    var container, data;
    var filters = {};
    var changeCallBacks = [];
    function onChange(){
        changeCallBacks.forEach(function(f){
            f(true);
        });
    }
    function draw(){
        var psns = _.uniq(_.pluck(data,'psn'));
        var features = filters.rawDataFieldOptions;
        var eig = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20];
        container.attr('style', 'width:'+dimensions.width+';height:'+dimensions.height);

        container.select('select.psn')
            .on('change',function(d,i,s){
                filters.selectedPsn =  s[0].value;
                onChange();
            })
            .selectAll('option')
            .data(psns)
            .enter()
            .append('option')
            .attr('selected',function(d){return d==filters.selectedPsn?'selected':null;})
            .attr('value',function(d){return d;})
            .html(function(d){return d;})


        container.select('select.raw')
            .on('change',function(d,i,s){
                filters.rawDataField =  s[0].value;
                onChange();
            })
            .selectAll('option')
            .data(features)
            .enter()
            .append('option')
            .attr('selected',function(d){return d==filters.rawDataField?'selected':null;})
            .attr('value',function(d){return d;})
            .html(function(d){return d;})


        container.select('select.eigX')
            .on('change',function(d,i,s){
                filters.eigX = s[0].value;
                onChange();
            })
            .selectAll('option')
            .data(eig)
            .enter()
            .append('option')
            .attr('selected',function(d){return d==filters.eigX?'selected':null;})
            .attr('value',function(d){return d;})
            .html(function(d){return d;})

        container.select('select.eigY')
            .on('change',function(d,i,s){
                filters.eigY =  s[0].value;
                onChange();
            })
            .selectAll('option')
            .data(eig)
            .enter()
            .append('option')
            .attr('selected',function(d){return d==filters.eigY?'selected':null;})
            .attr('value',function(d){return d;})
            .html(function(d){return d;})

    }

    function constructor(selection){
        selection.each(function (d, i) {
            container = d3.select(this);
            data = d;
            draw();
        });
    }

    constructor.dimensions = function (value) {
        if (!arguments.length) return dimensions;
        dimensions = value;
        return constructor;
    };

    constructor.filters = function (value) {
        if (!arguments.length) return filters;
        filters = value;
        return constructor;
    };

    constructor.onChange = function (value) {
        if (!arguments.length) return changeCallBacks;
        changeCallBacks = value;
        return constructor;
    };
    return constructor;
};

coefficientExplorer.legend = function(){
    var dimensions = {width:0, height:0};
    var filters = {};
    var container, data;

    function build(){

    }

    function draw(){

    }

    function constructor(selection){
        selection.each(function (d, i) {
            container = d3.select(this);
            data = d;
            build();
            draw();
        });
    }

    constructor.dimensions = function (value) {
        if (!arguments.length) return dimensions;
        dimensions = value;
        return constructor;
    };

    constructor.filters = function (value) {
        if (!arguments.length) return filters;
        filters = value;
        return constructor;
    };

    return constructor;
};

coefficientExplorer.display = function(){
    var dimensions = {width:0, height:0};
    var colors = {};
    var scales = {};
    var filters = {
        selectedPsn:1,
        rawDataField:'t5_1',
        eigX:0,
        eigY:1,
        selectedIndex:null,
        selectedIndices:[],
        selectedReduced:[],
        rawDataFieldOptions:[
            "c_c_dp1",
            "c_c_t5_1",
            "c_c_t5_2",
            "c_c_t5_3",
            "c_dp1",
            "c_dt5_1",
            "c_dt5_10",
            "c_dt5_11",
            "c_dt5_12",
            "c_dt5_2",
            "c_dt5_3",
            "c_dt5_4",
            "c_dt5_5",
            "c_dt5_6",
            "c_dt5_7",
            "c_dt5_8",
            "c_dt5_9",
            "c_pct1",
            "f_c_dp1",
            "f_c_dp2",
            "f_c_dp3",
            "f_c_dp4",
            "f_c_dp5",
            "f_c_pos_e1",
            "f_cmd1",
            "f_p1",
            "f_p2",
            "f_p7",
            "f_pos1",
            "lo_c_brg1",
            "lo_c_brg2",
            "lo_c_dt1",
            "lo_c_dt2",
            "lo_c_dt3",
            "lo_c_dt4",
            "lo_c_dt5",
            "lo_c_dt6",
            "lo_lvl1",
            "lo_p1",
            "lo_p2",
            "ngp",
            "npt",
            "nt5",
            "p1",
            "p5",
            "p7",
            "pcd",
            "pe_c_pos_e1",
            "pe_c_pos_e2",
            "pe_c_pos_e3",
            "pe_cmd1",
            "pe_cmd2",
            "pe_cmd3",
            "pe_dp1",
            "pe_for1",
            "pe_for2",
            "pe_p1",
            "pe_pos1",
            "pe_pos2",
            "perf_c_p5",
            "perf_c_pr1",
            "perf_c_pr2",
            "sc_dp1",
            "sum_eng_h",
            "sum_eng_st",
            "v_g_1a",
            "v_g_1b",
            "v_g_2a",
            "v_g_2b",
            "v_g_3a",
            "v_g_3b",
            "v_g_4a",
            "v_g_4b",
            "v_g_5a",
            "v_g_6b",
            "v_g_7",
            "f_p3",
            "f_p4",
            "f_p5",
            "f_p6",
            "lo_t1",
            "lo_t2",
            "lo_t3",
            "pe_t1",
            "t1_1",
            "t1_2",
            "t1_3",
            "t2_1",
            "t2_2",
            "t2_3",
            "t2_a",
            "t2_s1",
            "t5_1",
            "t5_10",
            "t5_11",
            "t5_12",
            "t5_2",
            "t5_3",
            "t5_4",
            "t5_5",
            "t5_6",
            "t5_7",
            "t5_8",
            "t5_9",
            "t5_a",
            "t5_s1",
            "t7_1",
            "t7_2",
            "t7_3",
            "t7_4",
            "t7_5",
            "t7_6",
            "t7_7",
            "t7_8",
            "t7_9",
            "t7_s1",
            "f_t1",
            "lo_t4",
            "lo_t5",
            "lo_t7",
            "lo_t8",
            "lo_t9",
            "v_d_1a",
            "v_d_1b",
            "v_d_2a",
            "v_d_2b",
            "v_d_3a",
            "v_d_3b",
            "v_d_4a",
            "v_d_4b",
            "v_d_5a",
            "v_d_5b",
            "v_d_6",
            "v_d_7"
        ]
    };
    var components = {
        title: this.title(),
        scatterPlot: this.scatterPlot(),
        legend: this.legend(),
        timeline: this.timeline()
    };

    var container, data;

    function setDimensions(){
        var plots = container.select('.plots'),
            title = container.select('.title');

        container
            .attr('width',dimensions.width)
            .attr('height', dimensions.height);

        Object.keys(components).forEach(function (key){
            components[key].dimensions(dimensions);
        });

        plots.attr('width',dimensions.width)
            .attr('height',dimensions.height - title.node().getBoundingClientRect().height)
    }
    function setFilters(){
        Object.keys(components).forEach(function (key){
            components[key].filters(filters);
        });
    }

    function draw(){
        setDimensions();
        setFilters();

        components.timeline.onUpdateHovered(components.scatterPlot.draw);
        components.title.onChange([components.scatterPlot.draw, components.timeline.draw]);
        components.scatterPlot.selectCallbacks([components.timeline.draw]);

        container.select('.title')
            .call(components.title);
        container.select('.timeline')
            .call(components.timeline);
        container.select('.scatterplot')
            .call(components.scatterPlot);
        container.select('.legend')
            .call(components.legend);
    }

    function constructor(selection){
        selection.each(function (d, i) {
            container = d3.select(this);
            data = d;
            draw();
        });
    }

    constructor.dimensions = function (value) {
        if (!arguments.length) return dimensions;
        dimensions = value;
        return constructor;
    };

    return constructor;

};