import React from 'react';

import {
    AreaChart,
    Brush,
    ChartContainer,
    ChartRow,
    Charts,
    LabelAxis,
    LineChart,
    Resizable,
    ScatterChart,
    styler,
    YAxis,
    ValueAxis,
    Legend
} from "react-timeseries-charts";

import {TimeSeries, TimeRange} from 'pondjs';
import { format } from "d3-format";

const style = styler([
    {key: "tempData", color: "#008BC2", width: 2},
    {key: "RHData", color: "#95266A", width: 2},
    {key: "co2Data", color: "#ecad48", width: 2},
    {key: "topTempData", color: "green", width: 1, opacity: 0.5},
    {key: "middleTempData", color: "#cfc793"},
    {key: "bottomTempData", color: "steelblue", width: 1, opacity: 0.5},
    {key: "leafCount", color: "#000000", radius: 1},
    {key: "plantHeight", color: "#AA00BB", radius: 1}
]);

export class TimeseriesChart extends React.PureComponent {
    constructor(props) {
        super(props);
        const initialRange = new TimeRange([75 * 60 * 1000, 125 * 60 * 1000]);
        this.device_uuid = props.device_uuid;
        // Storage for all the data channels
        const channels = {
            tempData: {
                units: "deg C",
                label: "Temperature",
                format: ",.1f",
                series: null,
                show: false,
                type: "line"
            },
            RHData: {units: "percent", label: "% RH", format: ",.1f", series: null, show: false, type: "line"},
            co2Data: {units: "ppm", label: "CO2", format: "d", series: null, show: false, type: "line"},
            topTempData: {units: "deg C", label: "Top Temp", format: ",.1f", series: null, show: false, type: "line"},
            middleTempData: {units: "deg C", label: "Mid Temp", format: ",.1f", series: null, show: false, type: "line"},
            bottomTempData: {units: "deg C", label: "Bottom Temp", format: ",.1f", series: null, show: false, type: "line"},
            leafCount: {units: "", label:"Leaf Count", format:"d", series:null, show:false, type:"scatter"},
            plantHeight: {units: "cm", label:"Plant Height", format:",.2f", series:null, show:false, type:"scatter"}
        };


        // Channel names list, in order we want them shown
        const channelNames = ["tempData", "RHData", "co2Data", "topTempData", "middleTempData", "bottomTempData", "leafCount", "plantHeight"];

        // Default channels we'll actually display on our charts -- We'll build this dynamically...
        const displayChannels = [ ];

        this.state = {
            ready: false,
            noData: false,
            mode: "channels",
            channels,
            channelNames,
            displayChannels,
            tracker: null,
            timerange: initialRange,
            brushrange: initialRange
        };
    }

    componentDidMount() {
        this.timerID = setInterval(
            () => this.getData(this.props.device_uuid),
            1000 * 60 * 5  // update every 5 minutes
        );
    }

    componentWillUnmount() {
        clearInterval(this.timerID);
    }

    getData = (device_uuid) => {
        if (device_uuid) {
            // First get the Temp and Humidity data
            var sensorData = {};
            return fetch(process.env.REACT_APP_FLASK_URL + '/api/get_temp_details/', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    'selected_device_uuid': device_uuid
                })
            })
                .then((response) => response.json())
                .then((responseJson) => {

                    //console.log(responseJson)
                    if (responseJson["response_code"] === 200) {

                        let tempData = responseJson["results"]["temp"];
                        let RHData = responseJson["results"]["RH"];
                        let topTempData = responseJson["results"]["top_h2o_temp"];
                        let middleTempData = responseJson["results"]["middle_h2o_temp"];
                        let bottomTempData = responseJson["results"]["bottom_h2o_temp"];

                        sensorData["tempData"] = tempData;
                        sensorData["RHData"] = RHData;
                        sensorData["topTempData"] = topTempData;
                        sensorData["middleTempData"] = middleTempData;
                        sensorData["bottomTempData"] = bottomTempData;
                    }
                })
                .then( () => {

                    // Get CO2 Data
                    return fetch(process.env.REACT_APP_FLASK_URL + '/api/get_co2_details/', {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        body: JSON.stringify({
                            'selected_device_uuid': device_uuid
                        })
                    })

                        .then((response) => response.json())
                        .then((responseJson) => {
                            //console.log("CO2 data");
                            //console.log(responseJson)
                            if (responseJson["response_code"] === 200) {

                                let co2Data = responseJson["results"]

                                sensorData["co2Data"] = co2Data;
                            }

                        });
                })
                // .then(() => {
                //     // get the HorticultureDailyLogs
                //     return fetch(process.env.REACT_APP_FLASK_URL + '/api/get_horticulture_daily_logs/', {
                //         method: 'POST',
                //         headers: {
                //             'Accept': 'application/json',
                //             'Content-Type': 'application/json',
                //             'Access-Control-Allow-Origin': '*'
                //         },
                //         body: JSON.stringify({
                //             'device_uuid': device_uuid
                //         })
                //     })
                //         .then((response) => response.json())
                //         .then((responseJson) => {
                //             //console.log(responseJson)
                //             if (responseJson["response_code"] == 200) {
                //                 sensorData["plantHeight"] = responseJson["plant_height_results"];
                //                 sensorData["leafCount"] = responseJson["leaf_count_results"];
                //             }
                //         });
                // })
                .then(() => {
                    //console.log("About to parse data");
                    return this.parseData(this.state.displayChannels, this.state.channels, sensorData)
                });

        }
    };
    componentWillUpdate(nextProps, nextState, nextContext) {
        if (nextProps.device_uuid !== this.props.device_uuid){
            this.setState({ready: false});
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        // if the device_uuid dropdown has changed, well want to pull new data.
        if (this.props.device_uuid !== prevProps.device_uuid){
            this.getData(this.props.device_uuid);
        }
    }

    handleTrackerChanged = t => {
        this.setState({ tracker: t });
    };

    handleActiveChange = channelName => {
        console.log("handling change for " + channelName);
        const newChannels = this.state.channels;
        newChannels[channelName].show = !newChannels[channelName].show;
        this.setState({ channels: newChannels });
    };

    parseData = (displayChannels, channels, newData) => {
        var noData = true;
        var timeRange = null;
        var newDisplayChannels = this.state.displayChannels;
        this.state.channelNames.forEach(function (name) {

            if (newData[name]) {
                const dataEvents = [];
                newData[name].forEach(function (d) {
                    //console.log(d);
                    const eventDate = new Date(d.time);
                    dataEvents.push([eventDate, parseFloat(d.value)]);
                });
                if(dataEvents.length > 0) {
                    noData = false;
                    // if this is the first time we're seeing data for a channel, show it
                    if (channels[name]["series"] === null) {
                        channels[name]["show"] = true;
                        if(!newDisplayChannels.includes(name)){
                            newDisplayChannels.push(name);
                        }
                    }
                    if(name === "plantHeight" || name === "leafCount") { // Temporary until we get a new API endpoint
                        channels[name]["series"] = new TimeSeries({
                            name: name,
                            columns: ["time", name],
                            points: dataEvents
                        });
                    } else {
                        channels[name]["series"] = new TimeSeries({
                            name: name,
                            columns: ["time", name],
                            points: dataEvents.reverse()
                        });
                    }
                    channels[name]["max"] = channels[name]["series"].max(name);
                    channels[name]["min"] = channels[name]["series"].min(name);
                    if (timeRange === null) {
                        timeRange = channels[name]["series"].timerange()
                    } else {
                        timeRange = timeRange.extents(channels[name]["series"].timerange())
                    }
                }
            }
        });
        //ready = true;  Using 'ready' to indicate that we attempted to load data.
        this.setState({ready: true, noData: noData, channels: channels, timerange: timeRange, brushrange: timeRange, displayChannels: displayChannels});
    };

    handleTimeRangeChange = timerange => {
        const { channels, displayChannels } = this.state;

        if (timerange) {
            this.setState({ timerange, brushrange: timerange });
        } else {
            this.setState({ timerange: channels[displayChannels[0]].series.range(), brushrange: null });
        }
    };

    renderMultiAxisChart = () => {

        const {displayChannels, channels, timerange} = this.state;

        const charts = [];
        const axisList = [];
        //for (let channelName of displayChannels) {
        displayChannels.forEach((channelName) => {

            let series = channels[channelName].series;
            const label = channels[channelName].label;
            const max = channels[channelName].max;
            const min = channels[channelName].min;
            const format = channels[channelName].format;
            const id = `${channelName}_axis`;
            const visible = channels[channelName].show;
            if (series !== null) {

                axisList.push(
                    <YAxis
                        id={id}
                        key={id}
                        visible={visible}
                        label={label}
                        min={min}
                        max={max}
                        width={70}
                        type="linear"
                        format={format}
                        showGrid={true}
                    />
                );
                if(channels[channelName].type ==="line") {
                    charts.push(
                        <LineChart
                            key={`line-${channelName}`}
                            axis={`${channelName}_axis`}
                            visible={channels[channelName].show}
                            series={series}
                            columns={[channelName]}
                            style={style}
                            interpolation={"curveStepAfter"}
                            breakLine
                        />
                    );
                } else if (channels[channelName].type === "scatter") {
                    charts.push(
                        <ScatterChart
                        key={`scatter-${channelName}`}
                        axis={`${channelName}_axis`}
                        visible={channels[channelName].show}
                        series={series}
                        columns={[channelName]}
                        style={style}
                        />
                    );
                }
            }
        });

        const trackerInfoValues = displayChannels
            .filter(channelName => channels[channelName].show)
            .map(channelName => {
                const fmt = format(channels[channelName].format);
                let v = "--";
                if (channels[channelName].series !== null) {
                    let series = channels[channelName].series.crop(timerange);

                    if (this.state.tracker) {
                        const i = series.bisect(new Date(this.state.tracker));
                        const vv = series.at(i).get(channelName);
                        if (vv) {
                            v = fmt(vv);
                        }
                    }
                }
                const label = channels[channelName].label;
                const value = `${v} ${channels[channelName].units}`;

                return { label, value };
            });

            return (
                <ChartContainer timeRange={timerange}

                trackerPosition={this.state.tracker}
                onTrackerChanged={this.handleTrackerChanged}
                trackerShowTime>
                    <ChartRow height="400"
                                trackerInfoValues={trackerInfoValues}
                                trackerInfoHeight={10 + trackerInfoValues.length * 16}
                                trackerInfoWidth={140}>
                        {axisList}
                        <Charts>
                            {charts}
                        </Charts>
                    </ChartRow>
                </ChartContainer>
            );
    };

    renderChannelsChart = () => {
        const {displayChannels, channels, timerange} = this.state;

        const rows = [];
        displayChannels.forEach((channelName) => {

            let series = channels[channelName].series;
            //const label = channels[channelName].label;
            //const max = channels[channelName].max;
            //const min = channels[channelName].min;
            //const format = channels[channelName].format;
            //const id = `${channelName}_axis`;
            //const visible = channels[channelName].show;
            if (series !== null) {
                const summary = [
                    { label: "Current", value:channels[channelName].series.atLast().get(channelName) }
                ];

                let value = "--";
                if (this.state.tracker) {
                    const approx =
                        (+this.state.tracker - +timerange.begin()) /
                        (+timerange.end() - +timerange.begin());
                    const ii = Math.floor(approx * series.size());
                    const i = series.bisect(new Date(this.state.tracker), ii);
                    const v = i < series.size() ? series.at(i).get(channelName) : null;
                    if (v) {
                        value = parseInt(v, 10);
                    }
                }
                const mainChart = [];
                if(channels[channelName].type ==="line") {
                   mainChart.push( <LineChart
                        key={`line-${channelName}`}
                        axis={`${channelName}_axis`}
                        series={series}
                        columns={[channelName]}
                        style={style}
                        interpolation={"curveStepAfter"}
                        breakLine
                    /> );
                } else if (channels[channelName].type === "scatter") {
                    mainChart.push(<ScatterChart
                        key={`scatter-${channelName}`}
                        axis={`${channelName}_axis`}
                        visible={channels[channelName].show}
                        series={series}
                        columns={[channelName]}
                        style={style}
                    />);
                }

                rows.push(
                    <ChartRow
                        height="100"
                        visible={channels[channelName].show}
                        key={`row-${channelName}`}
                    >
                        <LabelAxis
                            id={`${channelName}_axis`}
                            label={channels[channelName].label}
                            values={summary}
                            min={channels[channelName].min}
                            max={channels[channelName].max}
                            width={140}
                            type="linear"
                            format=",.1f"
                        />
                        <Charts>
                            {mainChart}
                        </Charts>
                            <ValueAxis
                                id={`${channelName}_valueaxis`}
                                value={value}
                                detail={channels[channelName].units}
                                width={80}
                                min={0}
                                max={35}
                            />
                    </ChartRow>
                );
            }
        });
        return (
            <ChartContainer
                timeRange={this.state.timerange}
                showGrid={false}
                enablePanZoom
                trackerPosition={this.state.tracker}
                onTimeRangeChanged={this.handleTimeRangeChange}
                onChartResize={width => this.handleChartResize(width)}
                onTrackerChanged={this.handleTrackerChanged}
            >
                {rows}
            </ChartContainer>
        );
    };

    renderBrush = () => {
        const { displayChannels, channels } = this.state;
        return (
            <ChartContainer
                timeRange={channels[displayChannels[0]].series.range()}
                trackerPosition={this.state.tracker}
            >
                <ChartRow height="100" debug={false}>
                    <Brush
                        timeRange={this.state.brushrange}
                        allowSelectionClear
                        onTimeRangeChanged={this.handleTimeRangeChange}
                    />
                    <YAxis
                        id="axis1"
                        label={[displayChannels[0]].label}
                        min={0}
                        max={channels[displayChannels[0]].max}
                        width={70}
                        type="linear"
                        format="d"
                    />
                    <Charts>
                        <AreaChart
                            axis="axis1"
                            style={style.areaChartStyle()}
                            columns={{ up: [displayChannels[0]], down: [] }}
                            series={channels[displayChannels[0]].series}
                        />
                    </Charts>
                </ChartRow>
            </ChartContainer>
        );
    };

    render() {
        const {ready, noData, displayChannels, channels} = this.state;

        if (!ready) {
            return (
                <div className={"row graphs-row mt-5 mb-5"}>
                    <div className="col-md-2 offset-5 text-center">
                        Loading Sensor Data...
                    </div>
                </div>
            )
        }

        if (ready && noData) {
            return (
                <div className={"row graphs-row mt-5 mb-5"}>
                    <div className="col-md-2 offset-5 text-center">
                        No Data For Device
                    </div>
                </div>
            )
        }

        const legend = displayChannels.map(channelName => ({
            key: channelName,
            label: channels[channelName].label, // + " - " + channels[channelName].series.atLast().get(channelName),
            disabled: !channels[channelName].show
        }));


        return (
            <div>
                <div className="row graphs-row mt-5 mb-5">
                    <div className="col-md-10">
                    <Resizable>
                        {this.renderChannelsChart()}
                    </Resizable>
                    </div>
                    <div className="col-md-2">
                        <div className={"card"}>
                            <div className={"card-body"}>
                                <div className={"card-title"}>
                                    <h6>Legend</h6>
                                </div>
                                <div className={"card-text"}>
                                    <Legend
                                        type="swatch"
                                        align="left"
                                        stack={true}
                                        style={style}
                                        categories={legend}
                                        onSelectionChange={this.handleActiveChange}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className={"row graphs-row mt-5 mb-5"}>
                    <div className={"col-md-10"}>
                        <Resizable>
                            {this.renderBrush()}
                        </Resizable>
                    </div>
                </div>
            </div>
        )
    }
}