import { Construct } from "constructs";
import { App, TerraformStack } from "cdktf";
import * as google from "@cdktf/provider-google";
import * as fs from "fs";
import { config } from "./config";

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
      region: config.Region,
      zone: config.Zone,
      credentials: serviceAccountKey, // Use the service account key for authentication
    });

    // Enable Container API
    const containerApi = new google.projectService.ProjectService(
      this,
      "container-api",
      {
        service: "container.googleapis.com",
        disableOnDestroy: false,
      }
    );

    // Enable Cloud Resource Manager API
    const cloudResourceManagerApi = new google.projectService.ProjectService(
      this,
      "cloud-resource-manager-api",
      {
        service: "cloudresourcemanager.googleapis.com",
        disableOnDestroy: false,
      }
    );

    // VPCネットワークの作成
    const network = new google.computeNetwork.ComputeNetwork(this, "vpc", {
      name: config.ClusterName,
      autoCreateSubnetworks: false,
    });

    // サブネットワークの作成
    const subnet = new google.computeSubnetwork.ComputeSubnetwork(
      this,
      "subnet",
      {
        name: config.ClusterName,
        network: network.id,
        ipCidrRange: "10.0.0.0/24",
        region: config.Region,
      }
    );

    new google.containerCluster.ContainerCluster(this, "gke-cluster", {
      name: config.ClusterName,
      location: config.Region,
      enableAutopilot: true, // Autopilotモードを有効化
      network: network.name,
      subnetwork: subnet.name,
      deletionProtection: false,
      dependsOn: [containerApi, cloudResourceManagerApi], // Wait for API to be enabled
      ipAllocationPolicy: {
        clusterIpv4CidrBlock: "/17",
        servicesIpv4CidrBlock: "/22",
      },
    });
  }
}

const app = new App();
new GcpK8sClusterStack(app, "gcp-k8s-cluster");
app.synth();
