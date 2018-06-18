from FCClass.user import User
from FCClass.user_session import UserSession
from flask import Response
from flask import request
from flask import Blueprint
from .utils.env_variables import *
from .utils.response import success_response, error_response

user_authenticate = Blueprint('user_authenticate', __name__)


@user_authenticate.route('/api/signup/', methods=['GET', 'POST'])
def signup():
    received_form_response = json.loads(request.data.decode('utf-8'))
    username = received_form_response.get("username", None)
    email_address = received_form_response.get("email_address", None)
    password = received_form_response.get("password", None)
    organization = received_form_response.get("organization", None)

    if username is None or email_address is None or password is None:
        return error_response(
            message="Please make sure you have added values for all the fields"
        )

    user_uuid = User(username=username, password=password, email_address=email_address,
                     organization=organization).insert_into_db(datastore_client)

    if user_uuid:
        return success_response()

    else:
        return error_response(
            message="Sorry something failed. Womp womp!"
        )

@user_authenticate.route('/login/', methods=['GET', 'POST'])
def login():
    received_form_response = json.loads(request.data.decode('utf-8'))

    username = received_form_response.get("username", None)
    password = received_form_response.get("password", None)

    if username is None or password is None:
        return error_response(
            message="Please make sure you have added values for all the fields"
        )

    user_uuid = User(username=username, password=password).login_user(client=datastore_client)
    if user_uuid:
        session_token = UserSession(user_uuid=user_uuid).insert_into_db(client=datastore_client)
        return success_response(
            user_uuid=user_uuid,
            user_token=session_token,
            message="Login Successful"
        )
    else:
        return error_response(
            message="Login failed. Please check your credentials"
        )