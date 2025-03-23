import { Reporter, FullConfig, Suite } from "@playwright/test/reporter";
import path from "node:path";
import TestmoReporter from "./reporter";
import { existsSync, unlinkSync } from "node:fs";

describe("Playwright Testmo Reporter", () => {
  let reporter: Reporter;
  let outputPath: string;

  beforeEach(() => {
    outputPath = path.join(__dirname, "../fixtures/reporter/temp-output.xml");

    reporter = new TestmoReporter({
      outputFile: outputPath,
    });
  });

  afterEach(() => {
    if (existsSync(outputPath)) {
      unlinkSync(outputPath);
    }
  });

  it("should generate an XML file when test run is successful", async () => {
    const mockConfig: FullConfig = {
      projects: [],
      reporter: [],
      webServer: null,
      forbidOnly: false,
      fullyParallel: false,
      globalSetup: null,
      globalTeardown: null,
      globalTimeout: 0,
      grep: /.*/,
      grepInvert: null,
      maxFailures: 0,
      metadata: {},
      preserveOutput: "always",
      quiet: false,
      shard: null,
      updateSnapshots: "missing",
      version: "",
      workers: 1,
      configFile: "",
      rootDir: "",
      reportSlowTests: null,
      updateSourceMethod: "overwrite",
    };
    const mockSuite = {
      suites: [],
    } as Suite;

    reporter.onBegin(mockConfig, mockSuite);
    reporter.onEnd({ status: "passed", startTime: new Date(), duration: 1000 });

    expect(existsSync(outputPath)).toBe(true);
  });
});
