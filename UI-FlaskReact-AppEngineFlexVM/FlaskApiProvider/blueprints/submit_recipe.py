from flask import Blueprint
from flask import request
from google.cloud import datastore

from .utils.auth import get_user_uuid_from_token
from .utils.env_variables import *
from .utils.response import success_response, error_response
import uuid

submit_recipe_bp = Blueprint('submit_recipe', __name__)


# ------------------------------------------------------------------------------
# Handle Change to a recipe running on a device
@submit_recipe_bp.route('/api/submit_recipe/', methods=['GET', 'POST'])
def submit_recipe():
    received_form_response = json.loads(request.data.decode('utf-8'))
    recipe_state = received_form_response.get("state", {})
    user_token = received_form_response.get("user_token", "")


    key = datastore_client.key('Recipes')
    recipe_reg_task = datastore.Entity(key, exclude_from_indexes=["recipe"])

    # Get user uuid associated with this sesssion token
    user_uuid = get_user_uuid_from_token(user_token)
    if user_uuid is None:
        return error_response(
            message="Invalid User: Unauthorized"
        )


    query = datastore_client.query(kind='RecipeFormat')
    query.add_filter("device_type", '=', recipe_state.get("device_type_caret", ""))
    query_result = list(query.fetch())
    recipe_format = {}
    if len(query_result) > 0:
        recipe_format = json.loads(query_result[0]["recipe_json"])


    recipe_format["format"] = query_result[0]["format_name"]
    recipe_format["version"] =" ".join(str(x) for x in [2])
    recipe_format["authors"] = [
        {
            "name":"Manvitha",
            "uuid":str(uuid.uuid4()),
            "email": "manvitha@mit.edu"
        }
    ]
    recipe_format["parent_recipe_uuid"]= str(uuid.uuid4())
    recipe_format["support_recipe_uuids"] = None

    recipe_format["creation_timestamp_utc"] = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S:%f')[:-4] + 'Z'
    recipe_format["name"] = recipe_state.get("recipe_name", "")
    recipe_format["description"]['verbose'] = recipe_state.get("recipe_description", "")
    recipe_format["description"]['brief'] = recipe_state.get("recipe_description", "")[:75] if len(
        recipe_state.get("recipe_description", "")) > 75 else recipe_state.get("recipe_description", "")
    recipe_format["cultivars"] = [{
        "name": recipe_state.get("plant_type_caret", "") + "/" + recipe_state.get("variant_type_caret", ""),
        "uuid": str(uuid.uuid4())
    }]
    recipe_format["cultivation_methods"] = [{
        "name": "Shallow Water Culture",
        "uuid": str(uuid.uuid4())
    }]

    recipe_format["environments"]["standard_day"] = {
        "name": "Standard Day",
        "light_spectrum_nm_percent": {"400-449": recipe_state.get("led_panel_dac5578_on_red", 42.5) ,
                                      "449-499": recipe_state.get("led_panel_dac5578_on_blue", 42.5) ,
                                      "500-549": recipe_state.get("led_panel_dac5578_on_green", 42.5) ,
                                      "550-559": recipe_state.get("led_panel_dac5578_on_far_red", 42.5) ,
                                      "600-649": recipe_state.get("led_panel_dac5578_on_warm_white", 42.5) ,
                                      "650-699": recipe_state.get("led_panel_dac5578_on_cool_white", 42.5) },
        "light_intensity_watts": 100,
        "light_illumination_distance_cm": 10,
        "air_temperature_celcius": 22
    }
    recipe_format["environments"]["standard_night"] = {
        "name": "Standard Night",
        "light_spectrum_nm_percent": {"400-449": recipe_state.get("led_panel_dac5578_off_red", 42.5) ,
                                      "449-499": recipe_state.get("led_panel_dac5578_off_blue", 42.5) ,
                                      "500-549": recipe_state.get("led_panel_dac5578_off_green", 42.5) ,
                                      "550-559": recipe_state.get("led_panel_dac5578_off_far_red", 42.5) ,
                                      "600-649": recipe_state.get("led_panel_dac5578_off_warm_white", 42.5) ,
                                      "650-699": recipe_state.get("led_panel_dac5578_off_cool_white", 42.5) },
        "light_intensity_watts": 100,
        "light_illumination_distance_cm": 10,
        "air_temperature_celcius": 22
    }
    recipe_format["environments"]["cold_day"] = {
        "name": "Cold Day",
        "light_spectrum_nm_percent": {"400-449": 16.67, "449-499": 16.67, "500-549": 16.67, "550-559": 16.67,
                                      "600-649": 16.17, "650-699": 16.67},
        "light_intensity_watts": 100,
        "light_illumination_distance_cm": 10,
        "air_temperature_celcius": 10
    }
    recipe_format["environments"]["frost_night"] = {
        "name": "Frost Night",
        "light_spectrum_nm_percent": {"400-449": 16.67, "449-499": 16.67, "500-549": 16.67, "550-559": 16.67,
                                      "600-649": 16.17, "650-699": 16.67},
        "light_intensity_watts": 0,
        "light_illumination_distance_cm": 10,
        "air_temperature_celcius": 2
    }
    recipe_format["phases"][0] =   {
                "name": "Standard Growth",
                "repeat": 29,
                "cycles": [
                    {
                        "name": "Day",
                        "environment": "standard_day",
                        "duration_hours":  int(recipe_state.get("standard_day",1))
                    },
                    {
                        "name": "Night",
                        "environment": "standard_night",
                        "duration_hours": int(recipe_state.get("standard_night",1))
                    }
                ]
            }
    recipe_format["phases"][1]={
                "name": "Frosty Growth",
                "repeat": 1,
                "cycles": [
                    {
                        "name": "Day",
                        "environment": "cold_day",
                        "duration_hours": 18
                    },
                    {
                        "name": "Night",
                        "environment": "frost_night",
                        "duration_hours": 6
                    }
                ]

            }

    current_recipe_uuid = str(uuid.uuid4())
    recipe_format["uuid"] = current_recipe_uuid
    recipe_reg_task.update({
        "recipe_uuid":current_recipe_uuid,
        "user_uuid": user_uuid,
        "recipe": json.dumps(recipe_format),
        "date_created": datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S:%f')[:-4] + 'Z',
        "device_type": recipe_state.get("device_type_caret", ""),
        "format":query_result[0]["format_name"]
    })

    datastore_client.put(recipe_reg_task)

    # convert the values in the dict into what the Jbrain expects
    commands_list = convert_UI_recipe_to_commands(current_recipe_uuid,recipe_format)
    send_recipe_to_device_via_IoT(iot_client, "EDU-184DFDB6-50-65-83-d3-38-eb", commands_list)

    return success_response(
        message="Successfully applied"
    )
