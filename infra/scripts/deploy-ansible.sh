#!/bin/bash
    
set -eux

cd infra

# get output and set environment variables
cdktf output --outputs-file tmp_output.json
export K8S_CONTROL_PLANE_PUBLIC_IP=$(cat tmp_output.json | jq -r '.["gcp-k8s-cluster"]["K8S_CONTROL_PLANE_PUBLIC_IP"]')
export K8S_WORKER_1_PUBLIC_IP=$(cat tmp_output.json | jq -r '.["gcp-k8s-cluster"]["K8S_WORKER_1_PUBLIC_IP"]')
rm tmp_output.json

# delete ssh cache
ssh-keygen -R $K8S_CONTROL_PLANE_PUBLIC_IP
ssh-keygen -R $K8S_WORKER_1_PUBLIC_IP

# ansible deploy
cd ../ansible
ansible-playbook k8s-setup.yml -i inventory.yml
ansible-playbook transfer-k8s-manifest.yml -i inventory.yml