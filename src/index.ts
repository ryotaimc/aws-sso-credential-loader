import { fromSSO } from "@aws-sdk/credential-providers";
import { loadSharedConfigFiles } from "@aws-sdk/shared-ini-file-loader";
import inquirer from "inquirer";
import { spawn } from "child_process";
import { profile } from "console";

const getRegionInput = async (): Promise<string> => {
  const prompt = inquirer.createPromptModule();
  const { region } = await prompt({
    type: "input",
    name: "region",
    message: "input aws region",
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

export const setAwsSsoCredential = async (
  awsProfileName?: string
): Promise<{
  profileName: string;
  accountId: string | undefined;
  roleName: string | undefined;
}> => {
  const configs = await loadSharedConfigFiles();
  let selectedProfileName: string;
  if (typeof awsProfileName === "string") {
    selectedProfileName = awsProfileName;
  } else {
    const prompt = inquirer.createPromptModule();
    const { profile } = await prompt({
      type: "list",
      name: "profile",
      message: "select local profile",
      choices: Object.keys(configs.configFile),
    });
    selectedProfileName = profile;
  }
  process.env.AWS_PROFILE = selectedProfileName;
  console.log(`AWS_PROFILE set to ${selectedProfileName}`);
  const credentialProvider = fromSSO({
    profile: selectedProfileName,
  });
  const localCredential = await credentialProvider().catch(async (e) => {
    if (
      e.name === "CredentialsProviderError" ||
      e.name === "UnauthorizedException"
    ) {
      console.log(
        `No valid credential found in local: invoking SSO login process`
      );
      await AwsSsoLogin(selectedProfileName);
      return await credentialProvider();
    } else {
      console.error(e);
      throw e;
    }
  });
  const localRegion = configs.configFile[selectedProfileName].region;
  const credential: AwsCredentialConfig = {
    AWS_ACCESS_KEY_ID: localCredential.accessKeyId,
    AWS_SECRET_ACCESS_KEY: localCredential.secretAccessKey,
    AWS_SESSION_TOKEN: localCredential.sessionToken,
    AWS_REGION:
      typeof localRegion === "string" ? localRegion : await getRegionInput(),
  };
  process.env = { ...process.env, ...credential };
  console.log(`${selectedProfileName} credential set`);
  return {
    profileName: selectedProfileName,
    accountId: configs.configFile[selectedProfileName].sso_account_id,
    roleName: configs.configFile[selectedProfileName].sso_role_name,
  };
};
