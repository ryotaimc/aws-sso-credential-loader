import { fromSSO } from "@aws-sdk/credential-providers";
import { loadSharedConfigFiles } from "@aws-sdk/shared-ini-file-loader";
import { prompt } from "inquirer";
import { exit } from "process";

interface AwsCredentialConfig {
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  AWS_SESSION_TOKEN: string;
  AWS_REGION: string;
}

export const setAwsSsoCredential = async (): Promise<{
  profileName: string;
  accountId: string;
}> => {
  const configs = await loadSharedConfigFiles();
  const { profile } = await prompt([
    {
      type: "list",
      name: "profile",
      message: "select local profile for operation",
      choices: Object.keys(configs.configFile),
    },
  ]);
  const region = configs.configFile[profile].region;
  process.env.AWS_REGION = region;
  console.log(`AWS_REGION is set to ${region}`);
  const credentialProvider = fromSSO({
    profile: profile,
  });
  const credential = await credentialProvider().catch((e) => {
    console.error(e);
    return Promise.reject(e);
  });
  process.env.AWS_ACCESS_KEY_ID = credential.accessKeyId;
  process.env.AWS_SECRET_ACCESS_KEY = credential.secretAccessKey;
  process.env.AWS_SESSION_TOKEN = credential.sessionToken;
  console.log(`${profile} credential set`);
  return {
    profileName: profile,
    accountId: configs.configFile[profile].sso_account_id as string
  };
};
