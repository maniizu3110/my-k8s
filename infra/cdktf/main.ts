import { Construct } from "constructs";
import { App, TerraformStack } from "cdktf";
import * as google from "@cdktf/provider-google";
import * as fs from "fs";

class GcpK8sClusterStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Read the service account key file
    const serviceAccountKey = fs.readFileSync("./service_account_key.json", "utf8");

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
          ports: ["22", "6443", "10250"],
        },
      ],
    });

    // Compute Engineインスタンスを3台、低スペックで作成
    // Control Plane Node
    new google.computeInstance.ComputeInstance(this, "k8s-control-plane", {
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
        },
      ],
    });

    // Worker Node 1
    new google.computeInstance.ComputeInstance(this, "k8s-worker-1", {
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
        },
      ],
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
