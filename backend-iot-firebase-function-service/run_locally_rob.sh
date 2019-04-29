#!/bin/bash

# Just for local development & testing.

# Command line POST of fake key to local server:
# curl http://192.168.1.6:5000/fb-func-test/us-central1/saveKey  -H "Content-Type: application/json" -X POST --data '{"key": "rob", "cksum": "1", "MAC":"and cheese"}'

cd functions
npm run rob

