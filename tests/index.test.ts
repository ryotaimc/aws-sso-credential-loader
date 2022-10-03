import { setAwsSsoCredential } from "../src/index";
import { test, jest } from "@jest/globals";

const USER_INPUT_TEST_MS = 60000;

/**
 * Local test only
 * TODO: Update for CI test
 */
test("test main function ()", async () => {
  jest.setTimeout(USER_INPUT_TEST_MS);
  const result = await setAwsSsoCredential();
})