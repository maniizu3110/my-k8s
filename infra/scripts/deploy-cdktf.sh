#!/bin/bash

set -eux

cd infra

# cdktf deploy
cd cdktf
cdktf deploy --auto-approve