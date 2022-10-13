import { fromSSO } from "@aws-sdk/credential-providers";
import { loadSharedConfigFiles } from "@aws-sdk/shared-ini-file-loader";
import inquirer from "inquirer";
import { spawn } from "child_process";

const getRegionInput = async (): Promise<string> => {
  const prompt = inquirer.createPromptModule();
  const { region } = await prompt({
    type: "input",
    name: "region",
    message: "input aws region"
  });
  return region;
};

interface AwsCredentialConfig {
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  AWS_SESSION_TOKEN: string | undefined;
  AWS_REGION: string;
}

const AwsSsoLogin = async (profile: string) => {
  const loginProcess = spawn("aws", ["sso", "login", "--profile", profile]);
  loginProcess.stdout.on("data", (msg) => {
    console.log(msg.toString());
  });
  await new Promise((resolve, reject) => {
    loginProcess.on("error", (e) => {
      console.error(e);
      reject();
    });
    loginProcess.on("close", resolve);
  });
  console.log(`setting credential`);
};

export const setAwsSsoCredential = async (): Promise<{
  profileName: string;
  accountId: string | undefined;
  roleName: string | undefined;
}> => {
  const configs = await loadSharedConfigFiles();
  const prompt = inquirer.createPromptModule();
  const { profile } = await prompt({
    type: "list",
    name: 'profile',
    message: "select local profile",
    choices: Object.keys(configs.configFile),
  });
  const credentialProvider = fromSSO({
    profile: profile,
  });
  const localCredential = await credentialProvider().catch(async (e) => {
    if (e.name === "CredentialsProviderError" || e.name === "UnauthorizedException") {
      console.log(`No valid credential found in local: invoking SSO login process`);
      await AwsSsoLogin(profile);
      return await credentialProvider();
    } else {
      console.error(e);
      throw e;
    }
  });
  const localRegion = configs.configFile[profile].region;
  const credential: AwsCredentialConfig = {
    AWS_ACCESS_KEY_ID: localCredential.accessKeyId,
    AWS_SECRET_ACCESS_KEY: localCredential.secretAccessKey,
    AWS_SESSION_TOKEN: localCredential.sessionToken,
    AWS_REGION: typeof localRegion === "string" ? localRegion : await getRegionInput()
  };
  process.env = { ...process.env, ...credential };
  console.log(`${profile} credential set`);
  return {
    profileName: profile,
    accountId: configs.configFile[profile].sso_account_id,
    roleName: configs.configFile[profile].sso_role_name
  };
};
