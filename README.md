# aws-sso-credential-loader

## About

A helper module to load AWS SSO credential for NodeJS cli applications.

## how to use

```typescript
import { setAwsSsoCredential } from "aws-sso-credential-loader";

(async() => {
  // run this function before calling aws sdk functions
  await setAwsSsoCredential();

})
```
