#!/bin/bash

set -eux
# cdktf deploy
cd cdktf
cdktf deploy --auto-approve

# get output and set environment variables
cdktf output --outputs-file tmp_output.json
export K8S_CONTROL_PLANE_PUBLIC_IP=$(cat tmp_output.json | jq -r '.["gcp-k8s-cluster"]["k8s-control-plane-public-ip"]')
export K8S_WORKER_1_PUBLIC_IP=$(cat tmp_output.json | jq -r '.["gcp-k8s-cluster"]["k8s-worker-1-public-ip"]')
rm tmp_output.json

# ansible deploy
cd ../ansible
ansible-playbook k8s-setup.yml -i inventory.yml
