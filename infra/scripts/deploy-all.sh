#!/bin/bash

set -eux
./scripts/deploy-cdktf.sh
./scripts/deploy-ansible.sh
./scripts/apply-manifest.sh
