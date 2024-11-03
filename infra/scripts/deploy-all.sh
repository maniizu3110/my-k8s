#!/bin/bash

set -eux
./deploy-cdktf.sh
./deploy-ansible.sh
./apply-manifest.sh
