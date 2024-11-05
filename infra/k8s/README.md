## やってみること
- LBのサポート(MetalLB)で外部からアクセス可能にする
  - レイヤー２で構築する
  - https://kubernetes.github.io/ingress-nginx/deploy/#quick-start
  - 
- Knativeのサポート
- ArgoCDのサポート
- CRDのサポート([KubernetesのCustomResourceDefinitionを理解する](https://qiita.com/shmurata/items/5f5334f67610b899a811))してKaaSとして利用


## 参考
- metallbの設定(https://kubernetes.github.io/ingress-nginx/deploy/baremetal/)
- debagu用コマンド
```
kubectl run -it --rm --restart=Never busybox --image=busybox -- sh
kubectl run -it --rm --restart=Never curlpod --image=curlimages/curl -- sh
```
- public ipとの接続がうまくいかない
  - https://metallb.universe.tf/usage/example/
- https://cloud.google.com/kubernetes-engine/distributed-cloud/bare-metal/docs/installing/bundled-lb?hl=ja


- 内部的には解決できている
- 外部からのアクセス時には解決できていない
-> どのような流れの時に解決されて、どのような時に解決されないのか詳細な調査が必要
- パブリッククラウドは非対応らしいので,ingressを入れて、そこにNordPort(80/443)でアクセスしてプロキシとして振る舞わせることでこれを解決する

- https://blog.uzimihsr.com/post/2021-10-28-ingress-nginx-bare-metal/


## GKE参考
- https://kawabatas.hatenablog.com/entry/2018/07/30/173945 ingress controllerで動かす