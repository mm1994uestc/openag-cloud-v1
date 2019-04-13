#!/bin/bash

# Set up the python 3.6 virtual env. 

# Deactivate any current python virtual environment we may be running
if ! [ -z "${VIRTUAL_ENV}" ] ; then
    deactivate
fi

rm -fr pyenv
python3.6 -m venv pyenv
source pyenv/bin/activate

pip install --upgrade google-cloud-pubsub
pip install --upgrade google-cloud-bigquery
pip install --upgrade google-cloud-datastore
pip install --upgrade google-cloud-storage
pip install --upgrade firebase-admin

deactivate

