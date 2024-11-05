// dotenvを読み込む
import * as dotenv from "dotenv";

dotenv.config();

type Config = {
  ProjectId: string;
  ClusterName: string;
  Region: string;
  Zone: string;
}

export const config: Config = {
  ProjectId: process.env.PROJECT_ID || (() => { throw new Error('PROJECT_ID environment variable is required') })(),
  ClusterName: process.env.CLUSTER_NAME || (() => { throw new Error('CLUSTER_NAME environment variable is required') })(),
  Region: process.env.REGION || (() => { throw new Error('REGION environment variable is required') })(),
  Zone: process.env.ZONE || (() => { throw new Error('ZONE environment variable is required') })(),
};
