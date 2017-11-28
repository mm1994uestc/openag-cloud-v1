#!/bin/bash

source gcloud_env.bash

#------------------------------------------------------------------------------
# Load the OpenAg PRIVATE internal data into tables in our DATA_DS.
for TBL in "${DATA_TABLES[@]}"; do
  load_data $DATA_DS $TBL
  if [ $? -eq 1 ]; then
    echo "Exiting script."
    exit 1
  fi
done

# Load the OpenAg PRIVATE internal webui data into the tables in the WEBUI_DS.
for TBL in "${UI_TABLES[@]}"; do
  load_data $WEBUI_DS $TBL
  if [ $? -eq 1 ]; then
    echo "Exiting script."
    exit 1
  fi
done

