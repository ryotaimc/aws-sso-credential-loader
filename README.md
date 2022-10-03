# aws-sso-credential-loader

## about

- A helper module to load AWS SSO credential for NodeJS cli applications.

- User can select local aws profiles via cli. This module sets correspondent credentials of selected profile to NodeJS environment variables. aws-sdk modules in same process can utilize those values/credentials to access specified aws environment.

## prerequisite

- aws-cli v2

- .aws/config file under home folder which generated with `aws configure sso` command

## how to use

```typescript
import { setAwsSsoCredential } from "aws-sso-credential-loader";

(async() => {
  // run this function before calling any aws sdk functions
  await setAwsSsoCredential();
  // after the function above set credentials into process.env 
  // aws sdk functions can reference credentials which set in process.env

})
```
