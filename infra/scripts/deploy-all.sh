#!/bin/bash

set -eux

if [[ "$1" == "--reset" ]]; then
  cd cdktf
  cdktf destroy --auto-approve
  cd ../
fi

# .envの読み込み
source cdktf/.env

# cdktf deploy
cd cdktf
cdktf deploy --auto-approve

# contextを作詞したクラスターにする
gcloud config set project $PROJECT_ID
gcloud container clusters get-credentials $CLUSTER_NAME --region $REGION



kubectl create clusterrolebinding cluster-admin-binding \
  --clusterrole cluster-admin \
  --user $(gcloud config get-value account) || true # エラーが出ても無視して処理を続ける
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.12.0-beta.0/deploy/static/provider/cloud/deploy.yaml

# Wait for the external IP to be assigned (timeout after 10 minutes)
echo "Waiting for the external IP to be assigned..."
end_time=$((SECONDS + 600))
while true; do
  PUBLIC_IP=$(kubectl get svc ingress-nginx-controller -n ingress-nginx -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
  if [[ -n "$PUBLIC_IP" ]]; then
    echo "Public IP assigned: $PUBLIC_IP"
    break
  fi
  if [ $SECONDS -ge $end_time ]; then
    echo "Timeout after 10 minutes waiting for external IP"
    exit 1
  fi
  sleep 10
done

# google cloud dnsでsample.leo-tech.devに登録されている値があれば削除
gcloud dns record-sets delete sample.leo-tech.dev --type=A --zone=leo-tech-dev
# google cloud dns で$PUBLIC_IPをsample.leo-tech.devのAレコードに登録
gcloud dns record-sets create sample.leo-tech.dev \
  --rrdatas="$PUBLIC_IP" \
  --type=A \
  --ttl=60 \
  --zone=leo-tech-dev

cd ..

echo "Waiting for the ingress to be applied..."
end_time=$((SECONDS + 600)) # 10分後のタイムスタンプ
while ! kubectl apply -f k8s/sample-ingress/ingress.yaml; do
  if [ $SECONDS -ge $end_time ]; then
    echo "Timeout after 10 minutes. Failed to apply ingress."
    exit 1
  fi
  echo "Failed to apply ingress, retrying in 10 seconds..."
  sleep 10
done
kubectl apply -f k8s/sample-ingress/sample_nginx.yaml

# ここまででsample.leo-tech.devにアクセスするとnginxの画面が表示されるはず(https未対応)

echo "Waiting for the nginx page to be accessible..."
end_time=$((SECONDS + 600))
while ! curl -v http://sample.leo-tech.dev; do
  if [ $SECONDS -ge $end_time ]; then
    echo "Timeout after 10 minutes. Failed to access nginx page."
    exit 1
  fi
  echo "Failed to access nginx page, retrying in 10 seconds..."
  sleep 10
done

# 参考: https://cert-manager.io/docs/tutorials/getting-started-with-cert-manager-on-google-kubernetes-engine-using-lets-encrypt-for-ingress-ssl/
# letsencrypt-stagingでの動作確認の自動化
helm install --create-namespace --namespace cert-manager --set crds.enabled=true --set global.leaderElection.namespace=cert-manager --timeout 15m cert-manager jetstack/cert-manager
kubectl apply -f k8s/sample-ingress/secret.yaml
# kubectl apply -f k8s/sample-ingress/issuer-lets-encrypt-staging.yaml

# check work ingress(staging)
# curl -v --insecure https://sample.leo-tech.dev

# letsencrypt-productionでの動作確認の自動化
kubectl apply -f k8s/sample-ingress/issuer-lets-encrypt-production.yaml
kubectl annotate ingress web-ingress cert-manager.io/issuer=letsencrypt-production --overwrite

# check work ingress(production)
# curl -v https://sample.leo-tech.dev




