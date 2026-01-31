import { createDefaultPreset, type JestConfigWithTsJest } from "ts-jest";

const presetConfig = createDefaultPreset({});

const jestConfig: JestConfigWithTsJest = {
  ...presetConfig,
  testPathIgnorePatterns: ["/node_modules/", "/dist/", "/example/"],
};

export default jestConfig;
