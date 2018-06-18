import uuid
from datetime import timedelta
from flask import Blueprint
from flask import Response
from flask import request
from google.cloud import datastore

from .utils.env_variables import *
from .utils.response import success_response, error_response
from .utils.auth import get_user_uuid_from_token

apply_to_device_bp = Blueprint('apply_to_device_bp',__name__)

# ------------------------------------------------------------------------------
# Save the device history.
@apply_to_device_bp.route('/api/apply_to_device/', methods=['GET', 'POST'])
def apply_to_device():
    received_form_response = json.loads(request.data.decode('utf-8'))

    device_uuid = received_form_response.get("device_uuid", None)
    recipe_uuid = received_form_response.get("recipe_uuid", None)
    user_token = received_form_response.get("user_token", None)
    date_applied = datetime.now()

    # Using the session token get the user_uuid associated with it
    user_uuid = get_user_uuid_from_token(user_token)
    if user_uuid is None:
        return error_response(
            message="Invalid User: Unauthorized"
        )

    # send the recipe to the device
    send_recipe_to_device(device_uuid, recipe_uuid)

    # Add the user to the users kind of entity
    key = datastore_client.key('DeviceHistory')

    # Indexes every other column except the description
    apply_to_device_task = datastore.Entity(key, exclude_from_indexes=[])

    if device_uuid is None or recipe_uuid is None or user_token is None:
        return error_response(
            message="Please make sure you have added values for all the fields"
        )

    recipe_session_token = str(uuid.uuid4())
    apply_to_device_task.update({
        'recipe_session_token': recipe_session_token,
    # Used to track the recipe applied to the device and modifications made to it.
        'device_uuid': device_uuid,
        'recipe_uuid': recipe_uuid,
        'date_applied': date_applied,
        'date_expires': date_applied + timedelta(days=3000),
        'user_uuid': user_uuid
    })

    # Get the JSON for the current Recipe state
    recipe_query = datastore_client.query(kind='Recipes')
    recipe_query.add_filter('recipe_uuid', '=', recipe_uuid)
    recipe_query_result = list(recipe_query.fetch())

    recipe_json = {}
    if len(recipe_query_result) == 1:
        recipe_json = recipe_query_result[0]['recipe_json']

    # Add a new recipe history record to indicate an event for when you applied this recipe to this device
    key = datastore_client.key('RecipeHistory')
    device_reg_task = datastore.Entity(key, exclude_from_indexes=[])
    device_reg_task.update({
        "device_uuid": device_uuid,
        "recipe_uuid": recipe_uuid,
        "user_uuid": user_uuid,
        "recipe_session_token": str(uuid.uuid4()),
        "recipe_state": str(recipe_json),
        "updated_at": datetime.now()
    })

    datastore_client.put(device_reg_task)

    datastore_client.put(apply_to_device_task)
    if apply_to_device_task.key:
        return success_response()

    else:
        return error_response(
            message="Sorry something failed. Womp womp!"
        )