import React, {Component} from 'react';
import {BrowserRouter as Router} from "react-router-dom";
import '../scss/home.scss';
import {
    Button,
    Form,
    DropdownItem,
    Input,
    DropdownMenu,
    Dropdown,
    DropdownToggle,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
    ButtonGroup
} from 'reactstrap';
import {Cookies, withCookies} from "react-cookie";
import placeholder from "../images/no-image.png";
import notification from '../images/notification.png';
import {Timeline} from 'react-twitter-widgets'
import twitter_icon from "../images/twitter.png";
import discourse_icon from "../images/discourse.png"
import {ImageTimelapse} from './components/image_timelapse';
import {DevicesDropdown} from './components/devices_dropdown';
import {AddDeviceModal} from './components/add_device_modal';
import {AddAccessCodeModal} from './components/add_access_code_modal';
import {Line} from 'rc-progress';

import * as api from './utils/api';

const querystring = require('querystring');

class Home extends Component {
    constructor(props) {
        super(props);
        this.set_modal = false
        let all_params = querystring.parse(this.props.location.search)


        if ("?uu" in all_params) {
            this.params = all_params['?uu'].split("?vcode=");
            this.user_uuid = this.params[0]
            if (this.params.length > 1) {
                this.vcode = this.params[1]
                if(this.vcode!="") {
                    this.set_modal = true
                }
            }
        }
        this.state = {
            user_token: props.cookies.get('user_token') || '',
            add_device_error_message: '',
            add_access_modal: false,
            access_code_error_message: '',
            user_uuid: this.user_uuid,
            device_reg_no: this.vcode,
            add_device_modal: this.set_modal,
            user_devices: new Map(),
            selected_device: 'Loading',
            device_images: [placeholder],
            current_plant_type: '',
            current_recipe_runtime: '',
            current_temp: '',
            progress: 10.0,
            age_in_days: 10,
            social_selected: "twitter",
            posts: [],
            user_posts: [],
            user_discourse_posts: [],
            discourse_message: "",
            discourse_type: "all",
            open_twitter_modal: false,
            twitter_message: "Test Message",
            allyoursOpen: false,
            open_discourse_modal: false,
            discourse_key: '',
            api_username: '',

        };
        console.log(this.props)
        console.log(all_params, "F")
        // This binding is necessary to make `this` work in the callback
        this.toggleallyours = this.toggleallyours.bind(this)
        this.getUserDevices = this.getUserDevices.bind(this);
        this.postToTwitter = this.postToTwitter.bind(this);
        this.postToDiscourse = this.postToDiscourse.bind(this);
        this.setSocial = this.setSocial.bind(this);
        this.getCurrentNewPosts = this.getCurrentNewPosts.bind(this)
        this.changeDiscourseType = this.changeDiscourseType.bind(this)
        this.onChangeField = this.onChangeField.bind(this)
        this.goToPost = this.goToPost.bind(this)
        this.toggleDiscourseModal = this.toggleDiscourseModal.bind(this)
        this.handleOnChangeText = this.handleOnChangeText.bind(this)
        this.handleOnDiscourseChangeText = this.handleOnDiscourseChangeText.bind(this)

        this.toggleTwitterModal = this.toggleTwitterModal.bind(this);
        this.selectTwitter = this.selectTwitter.bind(this)
    }

    componentWillMount() {
        // if (this.props.cookies.get('user_token') === '' || this.props.cookies.get('user_token') === undefined || this.props.cookies.get('user_token') === "undefined") {
        //     // window.location.href = "/login"
        // }

    }

    toggleallyours() {
        this.setState({allyoursOpen: !this.state.allyoursOpen})
    }

    componentDidMount() {
        console.log("Mounting Home component")
        this.getUserDevices()
        this.getUserDiscourseKey()
    }

    handleOnChangeText(e) {
        this.setState({twitter_message: e.target.value})
    }

    handleOnDiscourseChangeText(e) {
        this.setState({discourse_message: e.target.value})
    }

    selectTwitter() {
        this.setSocial("twitter")
    }

    toggleTwitterModal() {

        this.setState({open_twitter_modal: !this.state.open_twitter_modal})
    }

    toggleDiscourseModal() {
        this.setState({open_discourse_modal: !this.state.open_discourse_modal})
    }

    setSocial(social) {
        this.setState({"social_selected": social})
        if (social == "discourse") {
            this.getCurrentNewPosts()


        }
    }

    onChangeField(e) {
        this.setState({"discourse_message": e.target.value})
    }


    changeDiscourseType(type) {
        this.setState({"discourse_type": type})
    }

    getUserDiscourseKey() {
        return fetch(process.env.REACT_APP_FLASK_URL + '/api/get_forum_key_by_uuid/', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                'user_token': this.props.cookies.get('user_token')
            })
        })
            .then(response => response.json())
            .then(responseJson => {
                let results = responseJson["results"]
                this.setState({discourse_key: results["discourse_key"]})
                this.setState({api_username: results["api_username"]})
            })
            .catch(error => {
                console.error(error);
            })
    }

    getRepliesOnPost(id, post, user_avatar) {
        console.log("FGF")
        let user_posts = this.state.user_posts
        let url = "https://forum.openag.media.mit.edu/t/" + id + ".json?"
        let discourse_topic_url = url + "api_key="+"ea8d111b9cfc88eca262abc8c733c10ffae100a905b094d1658b26d4f57d30d7"+"&api_username="+"manvithaponnapati"
        console.log(discourse_topic_url)
        return fetch(discourse_topic_url, {
            method: 'GET'
        }).then(response => response.json())
            .then(responseJson => {
                let post_count = 0
                console.log(responseJson)
                post_count = responseJson["posts_count"]
                if (true) {
                    user_posts.push({
                        "avatar": "https://discourse-cdn-sjc1.com/business6" + user_avatar.replace("{size}", "100"),
                        "username": post["last_poster_username"],
                        "message": post["title"],
                        "yours": true,
                        "post_url": "https://forum.openag.media.mit.edu/t/" + post["id"],
                        "post_count": post_count
                    })

                    this.setState({"user_posts": user_posts})
                }
            })
            .catch(error => {
                console.error(error);
            })

    }

    getCurrentNewPosts() {
        let api_key_discourse = "5cdae222422803379b630fa3a8a1b5e216aa6db5b6c0126dc0abce00fdc98394"
        let discourse_topic_url = "https://forum.openag.media.mit.edu/latest.json?api_key=5cdae222422803379b630fa3a8a1b5e216aa6db5b6c0126dc0abce00fdc98394&api_username=openag&category=20"
        return fetch(discourse_topic_url, {
            method: 'GET'
        })
            .then(response => response.json())
            .then(responseJson => {
                let posts = []
                let user_posts = []
                this.setState({"user_posts": []})
                console.log(responseJson, "FG")
                let post_stream = responseJson["topic_list"]["topics"]
                let users = responseJson["users"]
                for (let post of post_stream) {
                    var div = document.createElement("div");
                    div.innerHTML = post["cooked"];
                    let user_last = post["last_poster_username"]
                    let user_avatar = "http://via.placeholder.com/100x100"
                    for (let user of users) {
                        if (user["username"] == user_last) {
                            user_avatar = user["avatar_template"]
                        }
                        if (user["username"] == this.state.api_username) {
                            console.log("xxxxx",post)
                        }

                    }
                    this.getRepliesOnPost(post["id"], post, user_avatar)

                    posts.push({
                        "avatar": "https://discourse-cdn-sjc1.com/business6" + user_avatar.replace("{size}", "100"),
                        "username": post["last_poster_username"],
                        "message": post["title"],
                        "yours": false,
                        "post_url": "https://forum.openag.media.mit.edu/t/" + post["id"]
                    })
                }
                this.setState({"posts": posts})
            })
            .catch(error => {
                console.error(error);
            })
    }

    getCurrentDeviceStatus(device_uuid) {
        return fetch(process.env.REACT_APP_FLASK_URL + '/api/get_current_device_status/', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                'user_token': this.props.cookies.get('user_token'),
                'device_uuid': device_uuid
            })
        })
            .then(response => response.json())
            .then(responseJson => {

                console.log(responseJson,"fdgfdsgdfsgadfgasdgsadgadgsasdgasdgasdgdsagsdgsdghsdhg")
                let results = responseJson["results"]
                this.setState({wifi_status: results["wifi_status"]})
                this.setState({current_temp: results["current_temp"]})
                this.setState({current_recipe_runtime: results["runtime"]})
                this.setState({age_in_days: results["age_in_days"]})
                this.setState({progress: parseInt(results["runtime"])*100/42.0})
            })
            .catch(error => {
                console.error(error);
            })
    }

    getDeviceImages(device_uuid) {
        return fetch(process.env.REACT_APP_FLASK_URL + '/api/get_device_images/', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                'user_token': this.props.cookies.get('user_token'),
                'device_uuid': device_uuid
            })
        })
            .then(response => response.json())
            .then(responseJson => {
                if(responseJson["image_urls"].length > 0) {
                    this.setState({
                        device_images: responseJson['image_urls']
                    });
                }
                else {
                    this.setState({
                        device_images: [placeholder]
                    });
                }
            })
            .catch(error => {
                console.error(error);
            })
    }


    getCurrentRecipeInfo(device_uuid) {
        api.getCurrentRecipeInfo(
            this.props.cookies.get('user_token'),
            device_uuid
        ).then(response => {
            console.log(response, "SS")
            this.setState({
                current_recipe_uuid: response.recipe_uuid,
                current_plant_type: response.plant_type
            })
        });
    }

    getUserDevices() {
        console.log(process.env.REACT_APP_FLASK_URL, "X")
        return fetch(process.env.REACT_APP_FLASK_URL + '/api/get_user_devices/', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                'user_token': this.props.cookies.get('user_token')
            })
        })
            .then((response) => response.json())
            .then((responseJson) => {
                console.log(responseJson)
                if (responseJson["response_code"] == 200) {
                    const devices = responseJson["results"]["devices"];
                    this.setState({"user_uuid": responseJson["results"]["user_uuid"]})
                    let devices_map = new Map();
                    for (const device of devices) {
                        devices_map.set(device['device_uuid'], device);
                    }

                    this.setState({
                        user_devices: devices_map
                    }, () => {
                        if (!this.restoreSelectedDevice()) {
                            // default the selected device to the first/only dev.
                            this.onSelectDevice(devices[0].device_uuid)
                        }
                    });
                    console.log("Response", responseJson["results"])
                } else {
                    this.setState({
                        selected_device: 'No Devices',
                        selected_device_uuid: ''
                    });
                }
            })
            .catch((error) => {
                console.error(error);
            });
    }

    restoreSelectedDevice = () => {
        const saved_device_uuid = this.props.cookies.get('selected_device_uuid', {path: '/'});
        if (!saved_device_uuid) return;

        const device = this.state.user_devices.get(saved_device_uuid);
        if (device) {
            this.onSelectDevice(saved_device_uuid);
            return true;
        }
        return false;
    }

    saveSelectedDevice = () => {
        const selected_device_uuid = this.state.selected_device_uuid;
        console.log(selected_device_uuid);
        if (selected_device_uuid) {
            this.props.cookies.set('selected_device_uuid', selected_device_uuid, {path: '/'});
        } else {
            this.props.cookies.remove('selected_device_uuid', {path: '/'});
        }
    }

    toggleDeviceModal = () => {
        this.setState(prevState => {
            return {
                add_device_modal: !prevState.add_device_modal,
                add_device_error_message: ''
            }
        });
    }

    toggleAccessCodeModal = () => {
        this.setState(prevState => {
            return {
                add_access_modal: !prevState.add_access_modal,
                access_code_error_message: ''
            }
        });
    }
    changeRegNo = (reg_no) => {
        this.setState({device_reg_no:reg_no})
    }
    onSubmitDevice = (modal_state) => {
        console.log(modal_state);
        return fetch(process.env.REACT_APP_FLASK_URL + '/api/register/', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                'user_token': this.props.cookies.get('user_token'),
                'device_name': modal_state.device_name,
                'device_reg_no': modal_state.device_reg_no,
                'device_notes': modal_state.device_notes,
                'device_type': modal_state.device_type
            })
        })
            .then((response) => response.json())
            .then((responseJson) => {
                console.log(responseJson)
                if (responseJson["response_code"] == 200) {
                    this.toggleDeviceModal();
                    this.getUserDevices()
                } else {
                    this.setState({
                        add_device_error_message: responseJson["message"]
                    })
                }
            })
            .catch((error) => {
                console.error(error);
            });
    }

    onSubmitAccessCode = (modal_state) => {
        return fetch(process.env.REACT_APP_FLASK_URL + '/api/submit_access_code/', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                'user_token': this.props.cookies.get('user_token'),
                'access_code': modal_state.access_code
            })
        })
            .then((response) => response.json())
            .then((responseJson) => {
                console.log(responseJson)
                if (responseJson["response_code"] == 200) {
                    this.toggleAccessCodeModal();
                    this.getUserDevices();
                } else {
                    this.setState({
                        access_code_error_message: responseJson['message']
                    });
                }
            })
            .catch((error) => {
                console.error(error);
            });
    }

    postToDiscourse() {
        var message = this.state.discourse_message;
        var title = message.substring(0, 100)

        return fetch("https://forum.openag.media.mit.edu/posts.json?api_key=bfc9267c5b620b4b68e42f763fe092ad4194a48f1e2b36b38d159028f0b70383&api_username=manvithaponnapati&raw=" + message + "&title=" + title + "&category=20", {
            method: 'POST',
            headers: {}

        })
            .then((response) => {console.log(response);response.json()})
            .then((responseJson) => {
            alert("FDSGFDG")
                console.log(responseJson,"ADSGDSG")
                this.getCurrentNewPosts()

            })
            .catch((error) => {
                console.error(error);
            });
    }

    postToTwitter() {

        return fetch(process.env.REACT_APP_FLASK_URL + '/api/posttwitter/', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                'user_token': this.props.cookies.get('user_token'),
                'message': this.state.twitter_message,
                'image_url':this.state.device_images[0]
            })
        })
            .then((response) => response.json())
            .then((responseJson) => {
                console.log(responseJson)
                this.setState({open_twitter_modal: false})
            })
            .catch((error) => {
                console.error(error);
            });
    }

    onSelectDevice = (device_uuid) => {
        if (device_uuid != this.state.selected_device_uuid) {
            const device = this.state.user_devices.get(device_uuid);
            const name = `${device.device_name} (${device.device_reg_no})`;
            this.setState({
                selected_device: name,
                selected_device_uuid: device.device_uuid
            }, () => {
                this.getCurrentRecipeInfo(device_uuid);
                this.saveSelectedDevice();
                this.getDeviceImages(device_uuid);
                this.getCurrentDeviceStatus(device_uuid);
            });
        }
    }

    goToPost(url, e) {
        window.location.href = url
    }

    render() {

        let discourse_messages = this.state.posts.map((post) => {
            return (
                <div className="row" onClick={this.goToPost.bind(this, post["post_url"])}>
                    <div className="col-md-2">
                        <img src={post["avatar"]} width="30" height="30"/>
                    </div>
                    <div className="col-md-10">
                        <div className="row"><b>{post["username"]}</b></div>
                        <div className="row">{post["message"]}</div>
                    </div>
                </div>
            )
        });


        let user_discourse_messages = this.state.user_posts.map((post) => {
            return (
                <div className="row" onClick={this.goToPost.bind(this, post["post_url"])}>
                    <div className="col-md-2">
                        <img src={post["avatar"]} width="30" height="30"/>
                    </div>
                    <div className="col-md-10">
                        <div className="row"><b>{post["username"]}</b></div>
                        <div className="row">{post["message"]}</div>
                        <div className="row"><b> Replies: </b> {post["post_count"]} </div>
                    </div>
                </div>
            )
        });
        let halfbox = {width: '50%'}
        let gotohorticulture = "/horticulture_success/" + this.state.selected_device_uuid;
        let gotohistory = "/recipe_history/" + this.state.selected_device_uuid + "/" + this.state.current_recipe_uuid;
        return (
            <Router>
                <div className="home-container">
                    <DevicesDropdown
                        devices={[...this.state.user_devices.values()]}
                        selectedDevice={this.state.selected_device}
                        onSelectDevice={this.onSelectDevice}
                        onAddDevice={this.toggleDeviceModal}
                        onAddAccessCode={this.toggleAccessCodeModal}
                    />
                    <div className="card notifications">
                        <div className="card-body">
                            <div className="card-title">
                                <h3>Notifications</h3>

                                <img src={notification}/>
                            </div>
                            {this.state.current_plant_type ? (
                                <p>
                                    Your {this.state.current_plant_type} is {this.state.age_in_days}
                                    &nbsp;old. Congratulations!
                                </p>
                            ) : (
                                <p>
                                    Loading recipe information.
                                </p>
                            )}
                            <hr/>
                            {/*<p><a href={gotohistory}>See edits </a> to your recipes </p>*/}
                            {/*<hr/>*/}
                            <p> Water needs refilling soon </p>
                            <hr/>
                            <p><a href={gotohorticulture}>Take</a> horticulture measurements </p>
                        </div>
                    </div>
                    <div className="timelapse">
                        <ImageTimelapse
                            imageClass="timelapse-img"
                            inputClass="range-slider__range"
                            images={this.state.device_images}
                        />
                    </div>
                    <div className="status">
                        <div className="row">
                            <div className="col-md-4">Wifi Status</div>
                            <div className="col-md-8"> {this.state.wifi_status} </div>
                        </div>

                        <div className="row">

                            <div className="col-md-6">
                                <div className="row">
                                    <div className="col-md-8">Device Status</div>
                                    <div className="col-md-4">
                                   <span class="checkmark">
                                     <div class="checkmark_circle"></div>

                                    </span>
                                        <span className="checkmark-text">OK</span>
                                    </div>

                                </div>
                            </div>

                        </div>

                        <div className="row">
                            <div className="col-md-4">
                                Progress
                            </div>
                            <div className="col-md-8 float-right">
                                <div className="row">
                                    <Line percent={this.state.progress} strokeWidth="4" trailWidth="4"
                                          strokeColor="#378A49"
                                          strokeLinecap="round"/>
                                </div>
                                <div className="row">
                                    <span style={{'margin-left': '15px'}}> {this.state.age_in_days}</span>
                                </div>

                            </div>
                        </div>

                        <div className="row">

                            <div className="col-md-6">Temperature</div>
                            <div className="col-md-6">

                                {this.state.current_temp}
                            </div>

                        </div>

                    </div>

                    <div className="twitter">
                        <div className="row buttons-row">
                            <ButtonGroup>
                                <Button
                                    outline
                                    onClick={() => this.setSocial('twitter')}
                                    active={this.state.social_selected == 'twitter'}
                                    color="primary" style={halfbox}
                                >
                                    <img src={twitter_icon} height="30"/>Twitter
                                </Button>
                                <Button
                                    outline
                                    onClick={() => this.setSocial('discourse')}
                                    active={this.state.social_selected == 'discourse'}
                                    color="primary" style={halfbox} className="btn" title='Coming Soon'
                                >
                                    <img src={discourse_icon} height="30"/>Discourse
                                </Button>
                            </ButtonGroup>
                        </div>


                        {this.state.social_selected === "twitter" ? <div className="row bottom-row">
                            <div className="col-md-12"><Button className="btn btn-block social-buttons"
                                                               onClick={this.toggleTwitterModal}>
                                Post To Twitter </Button></div>
                        </div> : <div className="row bottom-row">
                            <div className="col-md-4"><Dropdown isOpen={this.state.allyoursOpen}
                                                                toggle={this.toggleallyours}>
                                <DropdownToggle caret className="toggle-caret-upper">
                                    {this.state.discourse_type}
                                </DropdownToggle>
                                <DropdownMenu>
                                    <DropdownItem
                                        onClick={this.changeDiscourseType.bind(this, "all")}>All</DropdownItem>
                                    <DropdownItem
                                        onClick={this.changeDiscourseType.bind(this, "yours")}>Yours</DropdownItem>
                                </DropdownMenu>
                            </Dropdown></div>
                            <div className="col-md-8 padding-0"><Button className="btn btn-block social-buttons"
                                                                        onClick={this.toggleDiscourseModal}> Post
                                to Forum </Button></div>
                        </div>}

                        {this.state.social_selected === "twitter" ? <div className="row twitter-row">
                            <Timeline
                                dataSource={{
                                    sourceType: 'profile',
                                    screenName: 'food_computer'
                                }}
                                options={{
                                    username: 'FoodComputer'
                                }}
                                onLoad={() => console.log('Timeline is loaded!')}
                            /></div> : <div className="discourse-container">

                            {this.state.discourse_type === "all" ? discourse_messages : user_discourse_messages}
                        </div>}

                    </div>

                    <Modal
                        isOpen={this.state.open_twitter_modal}
                        toggle={this.toggleTwitterModal}
                    >
                        <ModalHeader toggle={this.toggle}>
                            Post to twitter
                        </ModalHeader>
                        <Form onSubmit={this.onSubmit}>
                            <ModalBody>
                                <Input type="textarea" placeholder="Enter your tweet"
                                       onChange={this.handleOnChangeText}></Input>
                                <img
                                    src={this.state.device_images[0]}
                                    height="200" className="twitter-share-img"/>
                            </ModalBody>
                            <ModalFooter>
                                <Button color="primary" type="submit" onClick={this.postToTwitter}>
                                    Post to twitter
                                </Button>
                                <Button color="secondary" onClick={this.toggleTwitterModal}>
                                    Cancel
                                </Button>
                            </ModalFooter>
                        </Form>
                    </Modal>
                    <Modal
                        isOpen={this.state.open_discourse_modal}
                        toggle={this.toggleDiscourseModal}
                    >
                        <ModalHeader toggle={this.toggleDiscourseModal}>
                            Post to Forum
                        </ModalHeader>
                        <Form onSubmit={this.postToDiscourse}>
                            <ModalBody>
                                <Input type="textarea" placeholder="Enter your post"
                                       onChange={this.handleOnDiscourseChangeText}></Input>
                            </ModalBody>
                            <ModalFooter>
                                <Button color="primary" type="submit" onClick={this.postToDiscourse}>
                                    Post to Forum
                                </Button>
                                <Button color="secondary" onClick={this.toggleDiscourseModal}>
                                    Cancel
                                </Button>
                            </ModalFooter>
                        </Form>
                    </Modal>
                    <AddDeviceModal
                        isOpen={this.state.add_device_modal}
                        toggle={this.toggleDeviceModal}
                        onSubmit={this.onSubmitDevice}
                        onRegNoChange={this.changeRegNo}
                        error_message={this.state.add_device_error_message}
                        device_reg_no={this.state.device_reg_no}
                    />
                    {/*<AddAccessCodeModal*/}
                        {/*isOpen={this.state.add_access_modal}*/}
                        {/*toggle={this.toggleAccessCodeModal}*/}
                        {/*onSubmit={this.onSubmitAccessCode}*/}
                        {/*error_message={this.state.access_code_error_message}*/}
                    {/*/>*/}
                </div>
            </Router>


        );
    }
}

export default withCookies(Home);
