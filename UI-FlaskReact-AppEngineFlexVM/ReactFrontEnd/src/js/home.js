import React, {Component} from 'react';
import {BrowserRouter as Router, Route, Link, withRouter} from "react-router-dom";
import '../css/home.css';
import {Button, Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Input} from 'reactstrap';
import {Cookies, withCookies} from "react-cookie";

class Home extends Component {
    constructor(props) {
        super(props);
        this.user_uuid = this.props.location.pathname.replace("/home/","").replace("#","")
        this.state = {
            user_token: props.cookies.get('user_token') || '',
            modal: false,
            device_name: '',
            device_reg_no: '',
            device_notes: '',
            user_uuid: this.user_uuid,
            device_type: 'PFC_EDU',
            user_devices: []
        };

        this.toggle = this.toggle.bind(this);
        this.registerDevice = this.registerDevice.bind(this);
        // This binding is necessary to make `this` work in the callback
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.getUserDevices = this.getUserDevices.bind(this);
    }

    componentWillMount() {
        if (this.props.cookies.get('user_token') === '' || this.props.cookies.get('user_token') === undefined || this.props.cookies.get('user_token') === "undefined") {
            window.location.href = "/login"
        }
    }

    componentDidMount() {
        console.log("Mouting component")
        this.getUserDevices()
    }

    handleChange(event) {
        this.setState({[event.target.name]: event.target.value});
        event.preventDefault();
    }

    handleSubmit(event) {

        console.log('A register device form was submitted');
        this.registerDevice()
        event.preventDefault();
    }

    toggle() {
        this.setState({
            modal: !this.state.modal
        });
    }

    getUserDevices() {
        return fetch('http://food.computer.com:5000/api/get_user_devices/', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                'user_uuid': this.state.user_uuid,
                'user_token': this.props.cookies.get('user_token')
            })
        })
            .then((response) => response.json())
            .then((responseJson) => {
                console.log(responseJson)
                if (responseJson["response_code"] == 200) {
                    this.setState({user_devices: responseJson["results"]})
                }

            })
            .catch((error) => {
                console.error(error);
            });
    }

    registerDevice() {
        console.log(JSON.stringify({
                'user_uuid': this.state.user_uuid,
                'device_name': this.state.device_name,
                'device_reg_no': this.state.device_reg_no,
                'device_notes': this.state.device_notes,
                'device_type': this.state.device_type
            }))
        return fetch('http://food.computer.com:5000/api/register/', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                'user_uuid': this.state.user_uuid,
                'user_token': this.props.cookies.get('user_token'),
                'device_name': this.state.device_name,
                'device_reg_no': this.state.device_reg_no,
                'device_notes': this.state.device_notes,
                'device_type': this.state.device_type
            })
        })
            .then((response) => response.json())
            .then((responseJson) => {
                console.log(responseJson)
                if (responseJson["response_code"] == 200) {
                    this.setState({
                        modal: false
                    });
                }
                this.getUserDevices()
            })
            .catch((error) => {
                console.error(error);
            });
    }

    render() {
        let listDevices = <p>Loading</p>
        if (this.state.user_devices.length > 0) {
            listDevices = this.state.user_devices.map((device) => {
                return <div className="col-md-3" key={device.device_reg_no}>
                    <div className="card">
                        <div className="card-body">
                            <h5 className="card-title">{device.device_reg_no}</h5>
                            <h6 className="card-subtitle mb-2 text-muted">{device.device_name} ({device.device_type})</h6>
                            <p className="card-text">{device.device_notes}</p>
                            <p className="card-text">This device is currently running the recipe id
                                : None </p>
                            <p className="card-text"> Device Status: OK</p>
                            <a href="#" className="card-link">Device Homepage</a>
                        </div>
                    </div>
                </div>
            });

        }

        return (
            <Router>
                <div className="home-container">
                    <div className="name-row">
                        <div className="col-md-10 cell-col">
                            <h2>Your current food computers </h2>
                        </div>

                        <div className="col-md-2 cell-col" onClick={this.toggle}>
                            <div className="plus" id="plus"> <div className="plus__line plus__line--v"></div><div className="plus__line plus__line--h"></div></div>
                        </div>

                    </div>
                    <div className="row card-row">
                        {listDevices}
                    </div>
                    <Modal isOpen={this.state.modal} toggle={this.toggle} className={this.props.className}>
                        <ModalHeader toggle={this.toggle}>New Device Registration</ModalHeader>
                        <ModalBody>
                            <Form>
                                <FormGroup>
                                    <Label for="device_name">Device name :</Label>
                                    <Input type="text" name="device_name" id="device_name"
                                           placeholder="E.g Caleb's FC" value={this.state.device_name}
                                           onChange={this.handleChange}/>
                                </FormGroup>
                                <FormGroup>
                                    <Label for="device_reg_no">Device Number :</Label>
                                    <Input type="text" name="device_reg_no" id="device_reg_no"
                                           placeholder="Six digit code" value={this.state.device_reg_no}
                                           onChange={this.handleChange}/>
                                </FormGroup>
                                <FormGroup>
                                    <Label for="device_notes">Device Notes :</Label>
                                    <Input type="text" name="device_notes" id="device_notes"
                                           placeholder="(Optional)" value={this.state.device_notes}
                                           onChange={this.handleChange}/>
                                </FormGroup>
                                <FormGroup>
                                    <Label for="device_type">Device Type :</Label>
                                    <select className="form-control smallInput" name="device_type" id="device_type" onChange={this.handleChange}
                                            value={this.state.device_type}>
                                        <option value="PFC_EDU">Personal Food Computer+EDU</option>
                                        <option value="Food_Server">Food Server</option>
                                    </select>
                                </FormGroup>
                            </Form>
                        </ModalBody>
                        <ModalFooter>
                            <Button color="primary" onClick={this.handleSubmit}>Register Device</Button>{' '}
                            <Button color="secondary" onClick={this.toggle}>Cancel</Button>
                        </ModalFooter>
                    </Modal>
                </div>
            </Router>



        );
    }
}

export default withCookies(Home);