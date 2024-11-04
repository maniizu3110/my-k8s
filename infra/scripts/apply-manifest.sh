#!/bin/bash

set -eux

cd cdktf
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
ansible-playbook transfer-k8s-manifest.yml -i inventory.yml

# # see what changes would be made, returns nonzero returncode if different
# kubectl get configmap kube-proxy -n kube-system -o yaml | \
# sed -e "s/strictARP: false/strictARP: true/" | \
# kubectl diff -f - -n kube-system

# # actually apply the changes, returns nonzero returncode on errors only
# kubectl get configmap kube-proxy -n kube-system -o yaml | \
# sed -e "s/strictARP: false/strictARP: true/" | \
# kubectl apply -f - -n kube-system

# apply manifest
# ssh -i ~/.ssh/my_k8s_key ubuntu@$K8S_CONTROL_PLANE_PUBLIC_IP "cd /home/ubuntu/k8s && kubectl apply -f ingress-nginx/metallb-native.yaml"
# ssh -i ~/.ssh/my_k8s_key ubuntu@$K8S_CONTROL_PLANE_PUBLIC_IP "cd /home/ubuntu/k8s && kubectl apply -f ingress-nginx/metallb-layer2.yaml"
# ssh -i ~/.ssh/my_k8s_key ubuntu@$K8S_CONTROL_PLANE_PUBLIC_IP "cd /home/ubuntu/k8s && kubectl apply -f ingress-nginx/deploy.yaml"
