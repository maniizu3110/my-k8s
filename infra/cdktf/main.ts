import { Construct } from "constructs";
import { App, TerraformOutput, TerraformStack } from "cdktf";
import * as google from "@cdktf/provider-google";
import * as fs from "fs";
import { sshPublicKey } from "./config";

class GcpK8sClusterStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Read the service account key file
    const serviceAccountKey = fs.readFileSync(
      "./service_account_key.json",
      "utf8"
    );

    // Google Cloud Providerの設定
    new google.provider.GoogleProvider(this, "google", {
      project: JSON.parse(serviceAccountKey).project_id,
      region: "us-central1",
      zone: "us-central1-a",
      credentials: serviceAccountKey, // Use the service account key for authentication
    });

    // VPCネットワークの作成
    const network = new google.computeNetwork.ComputeNetwork(this, "network", {
      name: "k8s-network",
      autoCreateSubnetworks: true,
    });

    // ファイアウォールの設定 (SSHとkubeadm用ポートの許可)
    new google.computeFirewall.ComputeFirewall(this, "firewall", {
      name: "k8s-firewall",
      network: network.name,
      sourceRanges: ["0.0.0.0/0"], // Allow from any IP address
      allow: [
        {
          protocol: "tcp",
          ports: ["22", "6443", "10250"], // SSH, API Server, Kubelet
        },
      ],
    });

    // Compute Engineインスタンスを3台、低スペックで作成
    // Control Plane Node
    const controlPlane = new google.computeInstance.ComputeInstance(this, "k8s-control-plane", {
      name: "k8s-control-plane",
      machineType: "e2-small", // CPU 2vCPU, RAM 2GB
      bootDisk: {
        initializeParams: {
          image: "ubuntu-os-cloud/ubuntu-2204-lts",
        },
      },
      networkInterface: [
        {
          network: network.id,
          accessConfig: [{}], // Empty access config block assigns an ephemeral public IP
        },
      ],
      metadata: {
        sshKeys: `ubuntu:${sshPublicKey}`,
      },
    });

    // Worker Node 1
    const worker1 = new google.computeInstance.ComputeInstance(this, "k8s-worker-1", {
      name: "k8s-worker-1",
      machineType: "e2-small", // CPU 2vCPU, RAM 2GB
      bootDisk: {
        initializeParams: {
          image: "ubuntu-os-cloud/ubuntu-2204-lts",
        },
      },
      networkInterface: [
        {
          network: network.id,
          accessConfig: [{}], // Empty access config block assigns an ephemeral public IP
        },
      ],
      metadata: {
        sshKeys: `ubuntu:${sshPublicKey}`,
      },
    });
    new TerraformOutput(this, "K8S_CONTROL_PLANE_PUBLIC_IP", {
      value: controlPlane.networkInterface.get(0).accessConfig.get(0).natIp,
    });
    // 実行中のシェル環境で以下のコマンドを実行することで、環境変数を設定できる
    // export K8S_CONTROL_PLANE_PUBLIC_IP=$(cdktf output -json k8s-control-plane-public-ip)

    new TerraformOutput(this, "K8S_WORKER_1_PUBLIC_IP", {
      value: worker1.networkInterface.get(0).accessConfig.get(0).natIp,
    });

    // // Worker Node 2
    // new google.computeInstance.ComputeInstance(this, "k8s-worker-2", {
    //   name: "k8s-worker-2",
    //   machineType: "e2-small", // CPU 2vCPU, RAM 2GB
    //   bootDisk: {
    //     initializeParams: {
    //       image: "ubuntu-os-cloud/ubuntu-2204-lts",
    //     },
    //   },
    //   networkInterface: [
    //     {
    //       network: network.id,
    //     },
    //   ],
    // });
  }
}

const app = new App();
new GcpK8sClusterStack(app, "gcp-k8s-cluster");
app.synth();
