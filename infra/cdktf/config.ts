// dotenvを読み込む
import * as dotenv from "dotenv";

dotenv.config();

export const sshUserName = process.env.SSH_USER_NAME;
export const sshPublicKey = process.env.SSH_PUBLIC_KEY;
