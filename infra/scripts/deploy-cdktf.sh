#!/bin/bash

set -eux

# cdktf deploy
cd cdktf
cdktf deploy --auto-approve