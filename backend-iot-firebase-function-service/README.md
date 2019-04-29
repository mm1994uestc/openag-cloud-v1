## Firebase cloud function 

# Install firebase tools:
npm i -g firebase-tools

What this function does:
- accepts a POSTed pubic RSA key (as JSON)
- validates the JSON against the document DB schema
- inserts the document into our Firestore 'devicePublicKeys' collection

## For the IoT registration POST from the device, See the brain script:
`scripts/iot/one_time_key_creation_and_iot_device_registration.sh`

## For the image file POST from the device, See the brain script:
`scripts/iot/send_image_test.sh`

## Setup Notes
- If you see this error: `Error: The Cloud Firestore API is not enabled for the project fb-func-test`
- Then go to https://console.firebase.google.com
  - Develop > Database and enable "Cloud Firestore beta".


