import { setAwsSsoCredential } from "../src/index";
import { test, jest, expect } from "@jest/globals";
import { S3Client, ListBucketsCommand } from "@aws-sdk/client-s3";

const USER_INPUT_TEST_MS = 60000;
jest.setTimeout(USER_INPUT_TEST_MS);
/**
 * Currently only for local test
 * TODO: Update for CI test
 */
test("test main function ()", async () => {
  const result = await setAwsSsoCredential();
  expect(typeof result.profileName).toBe("string");

  const s3Client = new S3Client({});
  const response = await s3Client.send(new ListBucketsCommand({}))
  console.log(JSON.stringify(response));
  expect(response.$metadata.httpStatusCode).toBe(200);
})