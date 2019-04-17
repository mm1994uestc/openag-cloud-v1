import React from 'react';
import {ChartContainer, ChartRow, Charts, LineChart, Resizable, styler, YAxis, Legend} from "react-timeseries-charts";
import {TimeSeries, TimeRange} from 'pondjs';
import { format } from "d3-format";

const style = styler([
    {key: "tempData", color: "#008BC2", width: 2},
    {key: "RHData", color: "#95266A", width: 2},
    {key: "co2Data", color: "#ecad48", width: 2},
    {key: "topTempData", color: "green", width: 1, opacity: 0.5},
    {key: "middleTempData", color: "#cfc793"},
    {key: "bottomTempData", color: "steelblue", width: 1, opacity: 0.5}
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
                show: true
            },
            RHData: {units: "percent", label: "% RH", format: ",.1f", series: null, show: true},
            co2Data: {units: "ppm", label: "CO2", format: "d", series: null, show: true},
            topTempData: {units: "deg C", label: "Top Temp", format: "d", series: null, show: false},
            middleTempData: {units: "deg C", label: "Mid Temp", format: "d", series: null, show: false},
            bottomTempData: {units: "deg C", label: "Bottom Temp", format: "d", series: null, show: false}
        };


        // Channel names list, in order we want them shown
        const channelNames = ["tempData", "RHData", "co2Data", "topTempData", "middleTempData", "bottomTempData"];

        // Default channels we'll actually display on our charts
        const displayChannels = [ "tempData", "RHData", "co2Data"];

        this.state = {
            ready: false,
            mode: "channels",
            channels,
            channelNames,
            displayChannels,
            tracker: null,
            timerange: initialRange,
//            brushrange: initialRange
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

                    console.log(responseJson)
                    if (responseJson["response_code"] == 200) {

                        let tempData = responseJson["results"]["temp"]
                        let RHData = responseJson["results"]["RH"]
                        let topTempData = responseJson["results"]["top_h2o_temp"]
                        let middleTempData = responseJson["results"]["middle_h2o_temp"]
                        let bottomTempData = responseJson["results"]["bottom_h2o_temp"]

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
                            console.log("CO2 data");
                            console.log(responseJson)
                            if (responseJson["response_code"] == 200) {

                                let co2Data = responseJson["results"]

                                sensorData["co2Data"] = co2Data;
                            }

                        })
                })
                .then(() => {
                    console.log("About to parse data");
                    return this.parseData(this.state.displayChannels, this.state.channels, sensorData)
                });

        }
    };

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
        const channels = this.state.channels;
        channels[channelName].show = !channels[channelName].show;
        this.setState({ channels });
    };

    parseData = (displayChannels, channels, newData) => {
        var ready = false;
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
                    // if this is the first time we're seeing data for a channel, show it
                    if (channels[name]["series"] === null) {
                        channels[name]["show"] = true;
                        if(!newDisplayChannels.includes(name)){
                            newDisplayChannels.push(name);
                        }
                    }
                    channels[name]["series"] = new TimeSeries({
                        name: name,
                        columns: ["time", name],
                        points: dataEvents.reverse()
                    });
                    channels[name]["max"] = channels[name]["series"].max(name);
                    channels[name]["min"] = channels[name]["series"].min(name);
                    if (timeRange === null) {
                        timeRange = channels[name]["series"].timerange()
                    } else {
                        timeRange = timeRange.extents(channels[name]["series"].timerange())
                    }
                    ready = true;
                }
            }
        });
        this.setState({ready: ready, channels: channels, timerange: timeRange, displayChannels: displayChannels});
    };

    renderMultiAxisChart() {

        const {displayChannels, channels, timerange} = this.state;

        const charts = [];
        const axisList = [];
        for (let channelName of displayChannels) {

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
                    />
                );

                charts.push(
                    <LineChart
                        key={`line-${channelName}`}
                        axis={`${channelName}_axis`}
                        visible={channels[channelName].show}
                        series={series}
                        columns={[channelName]}
                        style={style}
                        breakLine
                    />
                );
            }
        }
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
            )

    }

    render() {
        const {ready, displayChannels, channels} = this.state;

        if (!ready) {
            return <div><p>LOADING...</p></div>
        }

        const legend = displayChannels.map(channelName => ({
            key: channelName,
            label: channels[channelName].label,
            disabled: !channels[channelName].show
        }));


        return (

            <div className="row graphs-row mt-5 mb-5">
                <div className="col-md-10">
                        <Resizable>
                            {this.renderMultiAxisChart()}
                        </Resizable>
                </div>
                <div className="col-md-2">
                    <Legend
                        type="line"
                        align="right"
                        stack={true}
                        style={style}
                        categories={legend}
                        onSelectionChange={this.handleActiveChange}
                    />
                </div>
            </div>
        )
    }
}