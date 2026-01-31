import {
  Reporter,
  FullConfig,
  Suite,
  FullProject,
  Location,
  TestCase,
  TestResult,
} from "@playwright/test/reporter";
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
      embedTestSteps: true,
      includeTestSubFields: true,
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
      tags: [],
    };
    const mockRootSuite = new _Suite("Test Suite", "root");

    reporter.onBegin(mockConfig, mockRootSuite as Suite);
    // @ts-expect-error - We are testing the reporter, parameters are not used
    reporter.onEnd();

    expect(existsSync(outputPath)).toBe(true);
  });

  it("should include a passed test case in the XML file", async () => {
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
      tags: [],
    };
    const mockRootSuite = new _Suite("Test Suite", "root");
    const mockProjectSuite = new _Suite("Project Suite", "project");
    mockRootSuite.addSuite(mockProjectSuite);
    const mockFileSuite = new _Suite("File Suite", "file");
    mockProjectSuite.addSuite(mockFileSuite);
    mockFileSuite.addTest(
      new _TestCase(
        "Test Case",
        { file: "a.spec.ts", line: 1, column: 1 },
        mockFileSuite,
      ),
    );

    reporter.onBegin(mockConfig, mockRootSuite as Suite);
    // @ts-expect-error - We are testing the reporter, parameters are not used
    reporter.onEnd();

    expect(existsSync(outputPath)).toBe(true);
  });

  it("should include a failed test case in the XML file", async () => {
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
      tags: [],
    };
    const mockRootSuite = new _Suite("Test Suite", "root");
    const mockProjectSuite = new _Suite("Project Suite", "project");
    mockRootSuite.addSuite(mockProjectSuite);
    const mockFileSuite = new _Suite("File Suite", "file");
    mockProjectSuite.addSuite(mockFileSuite);
    const mockTestCase = new _TestCase(
      "Test Case",
      { file: "a.spec.ts", line: 1, column: 1 },
      mockFileSuite,
      "unexpected",
    );
    mockTestCase.addResult({
      duration: 0,
      error: new Error("Test failed"),
      status: "failed",
      stdout: ["This is a test failure", "This is another test failure"],
      attachments: [
        {
          name: "attachment.txt",
          contentType: "text/plain",
          body: Buffer.from("Hello, World!"),
        },
      ],
      errors: [
        {
          message: "Test failed",
          stack: "Error: Test failed\n    at a.spec.ts:1:1",
        },
      ],
      parallelIndex: 0,
      retry: 0,
      steps: [],
      stderr: ["This is a test failure", "This is another test failure"],
      workerIndex: 0,
      startTime: new Date(),
      annotations: [],
    } satisfies TestResult);
    mockFileSuite.addTest(mockTestCase);

    reporter.onBegin(mockConfig, mockRootSuite as Suite);
    // @ts-expect-error - We are testing the reporter, parameters are not used
    reporter.onEnd();

    expect(existsSync(outputPath)).toBe(true);
  });

  it("should include a skipped test case in the XML file", async () => {
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
      tags: [],
    };
    const mockRootSuite = new _Suite("Test Suite", "root");
    const mockProjectSuite = new _Suite("Project Suite", "project");
    mockRootSuite.addSuite(mockProjectSuite);
    const mockFileSuite = new _Suite("File Suite", "file");
    mockProjectSuite.addSuite(mockFileSuite);
    const mockTestCase = new _TestCase(
      "Test Case",
      { file: "a.spec.ts", line: 1, column: 1 },
      mockFileSuite,
      "skipped",
    );
    mockFileSuite.addTest(mockTestCase);

    reporter.onBegin(mockConfig, mockRootSuite as Suite);
    // @ts-expect-error - We are testing the reporter, parameters are not used
    reporter.onEnd();

    expect(existsSync(outputPath)).toBe(true);
  });

  it("should include stdout in the XML file", async () => {
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
      tags: [],
    };
    const mockRootSuite = new _Suite("Test Suite", "root");
    const mockProjectSuite = new _Suite("Project Suite", "project");
    mockRootSuite.addSuite(mockProjectSuite);
    const mockFileSuite = new _Suite("File Suite", "file");
    mockProjectSuite.addSuite(mockFileSuite);
    const mockTestCase = new _TestCase(
      "Test Case",
      { file: "a.spec.ts", line: 1, column: 1 },
      mockFileSuite,
    );
    mockTestCase.addResult({
      duration: 0,
      error: null,
      status: "passed",
      stdout: ["Hello, World!"],
      attachments: [],
      errors: [],
      parallelIndex: 0,
      retry: 0,
      steps: [],
      stderr: [],
      workerIndex: 0,
      startTime: new Date(),
      annotations: [],
    });
    mockFileSuite.addTest(mockTestCase);

    reporter.onBegin(mockConfig, mockRootSuite as Suite);
    // @ts-expect-error - We are testing the reporter, parameters are not used
    reporter.onEnd();

    expect(existsSync(outputPath)).toBe(true);
  });

  it("should include stderr in the XML file", async () => {
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
      tags: [],
    };
    const mockRootSuite = new _Suite("Test Suite", "root");
    const mockProjectSuite = new _Suite("Project Suite", "project");
    mockRootSuite.addSuite(mockProjectSuite);
    const mockFileSuite = new _Suite("File Suite", "file");
    mockProjectSuite.addSuite(mockFileSuite);
    const mockTestCase = new _TestCase(
      "Test Case",
      { file: "a.spec.ts", line: 1, column: 1 },
      mockFileSuite,
    );
    mockTestCase.addResult({
      duration: 0,
      error: null,
      status: "failed",
      stdout: [],
      attachments: [],
      errors: [],
      parallelIndex: 0,
      retry: 0,
      steps: [],
      stderr: ["Hello, World!"],
      workerIndex: 0,
      startTime: new Date(),
      annotations: [],
    });
    mockFileSuite.addTest(mockTestCase);

    reporter.onBegin(mockConfig, mockRootSuite as Suite);
    // @ts-expect-error - We are testing the reporter, parameters are not used
    reporter.onEnd();

    expect(existsSync(outputPath)).toBe(true);
  });

  it("should include annotations in the XML file", async () => {
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
      tags: [],
    };
    const mockRootSuite = new _Suite("Test Suite", "root");
    const mockProjectSuite = new _Suite("Project Suite", "project");
    mockRootSuite.addSuite(mockProjectSuite);
    const mockFileSuite = new _Suite("File Suite", "file");
    mockProjectSuite.addSuite(mockFileSuite);
    const mockTestCase = new _TestCase(
      "Test Case",
      { file: "a.spec.ts", line: 1, column: 1 },
      mockFileSuite,
    );
    mockTestCase.annotations.push({ type: "flaky" });
    mockTestCase.annotations.push({ type: "html:test", description: "Test" });
    mockFileSuite.addTest(mockTestCase);

    reporter.onBegin(mockConfig, mockRootSuite as Suite);
    // @ts-expect-error - We are testing the reporter, parameters are not used
    reporter.onEnd();

    expect(existsSync(outputPath)).toBe(true);
  });

  it("should include attachments in the XML file", async () => {
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
      tags: [],
    };
    const mockRootSuite = new _Suite("Test Suite", "root");
    const mockProjectSuite = new _Suite("Project Suite", "project");
    mockRootSuite.addSuite(mockProjectSuite);
    const mockFileSuite = new _Suite("File Suite", "file");
    mockProjectSuite.addSuite(mockFileSuite);
    const mockTestCase = new _TestCase(
      "Test Case",
      { file: "a.spec.ts", line: 1, column: 1 },
      mockFileSuite,
    );
    mockTestCase.addResult({
      duration: 0,
      error: null,
      status: "passed",
      stdout: [],
      attachments: [
        {
          name: "attachment.txt",
          contentType: "text/plain",
          body: Buffer.from("Hello, World!"),
        },
        {
          name: "attachment.png",
          contentType: "image/png",
          path: "attachment.png",
        },
        {
          name: "attachment.jpg",
          contentType: "image/jpeg",
          path: "https://example.com/attachment.jpg",
        },
      ],
      errors: [],
      parallelIndex: 0,
      retry: 0,
      steps: [],
      stderr: [],
      workerIndex: 0,
      startTime: new Date(),
      annotations: [],
    });
    mockFileSuite.addTest(mockTestCase);

    reporter.onBegin(mockConfig, mockRootSuite as Suite);
    // @ts-expect-error - We are testing the reporter, parameters are not used
    reporter.onEnd();

    expect(existsSync(outputPath)).toBe(true);
  });

  it("should include attachments in the XML file with an attachment handler callback", async () => {
    reporter = new TestmoReporter({
      outputFile: outputPath,
      attachmentBasePathCallback: (attachment) => {
        return attachment;
      },
    });

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
      tags: [],
    };
    const mockRootSuite = new _Suite("Test Suite", "root");
    const mockProjectSuite = new _Suite("Project Suite", "project");
    mockRootSuite.addSuite(mockProjectSuite);
    const mockFileSuite = new _Suite("File Suite", "file");
    mockProjectSuite.addSuite(mockFileSuite);
    const mockTestCase = new _TestCase(
      "Test Case",
      { file: "a.spec.ts", line: 1, column: 1 },
      mockFileSuite,
    );
    mockTestCase.addResult({
      duration: 0,
      error: null,
      status: "passed",
      stdout: [],
      attachments: [
        {
          name: "attachment.txt",
          contentType: "text/plain",
          body: Buffer.from("Hello, World!"),
        },
        {
          name: "attachment.png",
          contentType: "image/png",
          path: "attachment.png",
        },
        {
          name: "attachment.jpg",
          contentType: "image/jpeg",
          path: path.join(__dirname, "reporter.spec.ts"),
        },
      ],
      errors: [],
      parallelIndex: 0,
      retry: 0,
      steps: [],
      stderr: [],
      workerIndex: 0,
      startTime: new Date(),
      annotations: [],
    });
    mockFileSuite.addTest(mockTestCase);

    reporter.onBegin(mockConfig, mockRootSuite as Suite);
    // @ts-expect-error - We are testing the reporter, parameters are not used
    reporter.onEnd();

    expect(existsSync(outputPath)).toBe(true);
  });

  it("should include steps in the XML file", async () => {
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
      tags: [],
    };
    const mockRootSuite = new _Suite("Test Suite", "root");
    const mockProjectSuite = new _Suite("Project Suite", "project");
    mockRootSuite.addSuite(mockProjectSuite);
    const mockFileSuite = new _Suite("File Suite", "file");
    mockProjectSuite.addSuite(mockFileSuite);
    const mockTestCase = new _TestCase(
      "Test Case",
      { file: "a.spec.ts", line: 1, column: 1 },
      mockFileSuite,
    );
    mockTestCase.addResult({
      duration: 0,
      error: null,
      status: "passed",
      stdout: [],
      attachments: [],
      errors: [],
      parallelIndex: 0,
      retry: 0,
      steps: [
        {
          title: "Step 1",
          startTime: new Date(),
          duration: 0,
          error: null,
          annotations: [],
          titlePath: function (): Array<string> {
            throw new Error("Function not implemented.");
          },
          attachments: [],
          category: "test.step",
          steps: [],
        },
        {
          title: "Step 2",
          startTime: new Date(),
          duration: 0,
          error: null,
          annotations: [],
          titlePath: function (): Array<string> {
            throw new Error("Function not implemented.");
          },
          attachments: [],
          category: "test.step",
          steps: [
            {
              title: "Step 1.1",
              startTime: new Date(),
              duration: 0,
              error: null,
              annotations: [],
              titlePath: function (): Array<string> {
                throw new Error("Function not implemented.");
              },
              attachments: [],
              category: "pw:api",
              steps: [],
            },
            {
              title: "Step 1.2",
              startTime: new Date(),
              duration: 0,
              error: null,
              annotations: [],
              titlePath: function (): Array<string> {
                throw new Error("Function not implemented.");
              },
              attachments: [],
              category: "hook",
              steps: [],
            },
            {
              title: "Step 1.3",
              startTime: new Date(),
              duration: 0,
              error: null,
              annotations: [],
              titlePath: function (): Array<string> {
                throw new Error("Function not implemented.");
              },
              attachments: [],
              category: "fixture",
              steps: [],
            },
            {
              title: "Step 1.4",
              startTime: new Date(),
              duration: 0,
              error: null,
              annotations: [],
              titlePath: function (): Array<string> {
                throw new Error("Function not implemented.");
              },
              attachments: [],
              category: "expect",
              steps: [],
            },
          ],
        },
      ],
      stderr: [],
      workerIndex: 0,
      startTime: new Date(),
      annotations: [],
    });
    mockFileSuite.addTest(mockTestCase);

    reporter.onBegin(mockConfig, mockRootSuite as Suite);
    // @ts-expect-error - We are testing the reporter, parameters are not used
    reporter.onEnd();

    expect(existsSync(outputPath)).toBe(true);
  });

  it("should not report steps which are excluded by the testStepCategories option", async () => {
    reporter = new TestmoReporter({
      outputFile: outputPath,
      attachmentBasePathCallback: (attachment) => {
        return attachment;
      },
      testStepCategories: ["pw:api"],
    });

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
      tags: [],
    };
    const mockRootSuite = new _Suite("Test Suite", "root");
    const mockProjectSuite = new _Suite("Project Suite", "project");
    mockRootSuite.addSuite(mockProjectSuite);
    const mockFileSuite = new _Suite("File Suite", "file");
    mockProjectSuite.addSuite(mockFileSuite);
    const mockTestCase = new _TestCase(
      "Test Case",
      { file: "a.spec.ts", line: 1, column: 1 },
      mockFileSuite,
    );
    mockTestCase.addResult({
      duration: 0,
      error: null,
      status: "passed",
      stdout: [],
      attachments: [],
      errors: [],
      parallelIndex: 0,
      retry: 0,
      steps: [
        {
          title: "Step 1",
          startTime: new Date(),
          duration: 0,
          error: null,
          annotations: [],
          titlePath: function (): Array<string> {
            throw new Error("Function not implemented.");
          },
          attachments: [],
          category: "test.step",
          steps: [
            {
              title: "Step 1.1",
              startTime: new Date(),
              duration: 0,
              error: null,
              annotations: [],
              titlePath: function (): Array<string> {
                throw new Error("Function not implemented.");
              },
              attachments: [],
              category: "pw:api",
              steps: [],
            },
            {
              title: "Step 1.2",
              startTime: new Date(),
              duration: 0,
              error: null,
              annotations: [],
              titlePath: function (): Array<string> {
                throw new Error("Function not implemented.");
              },
              attachments: [],
              category: "hook",
              steps: [],
            },
            {
              title: "Step 1.3",
              startTime: new Date(),
              duration: 0,
              error: null,
              annotations: [],
              titlePath: function (): Array<string> {
                throw new Error("Function not implemented.");
              },
              attachments: [],
              category: "fixture",
              steps: [],
            },
            {
              title: "Step 1.4",
              startTime: new Date(),
              duration: 0,
              error: null,
              annotations: [],
              titlePath: function (): Array<string> {
                throw new Error("Function not implemented.");
              },
              attachments: [],
              category: "expect",
              steps: [],
            },
          ],
        },
        {
          title: "Step 2",
          startTime: new Date(),
          duration: 0,
          error: null,
          annotations: [],
          titlePath: function (): Array<string> {
            throw new Error("Function not implemented.");
          },
          attachments: [],
          category: "test.step",
          steps: [],
        },
      ],
      stderr: [],
      workerIndex: 0,
      startTime: new Date(),
      annotations: [],
    });
    mockFileSuite.addTest(mockTestCase);

    reporter.onBegin(mockConfig, mockRootSuite as Suite);
    // @ts-expect-error - We are testing the reporter, parameters are not used
    reporter.onEnd();

    expect(existsSync(outputPath)).toBe(true);
  });

  it('should return printsToStdio as "false"', () => {
    expect(reporter.printsToStdio()).toBe(false);
  });
});

class _Suite implements Suite {
  location?: Location;
  parent?: Suite;
  suites: Suite[];
  tests: TestCase[];
  title: string;
  type: "root" | "project" | "file" | "describe";

  constructor(title: string, type: "root" | "project" | "file" | "describe") {
    this.title = title;
    this.type = type;
    this.suites = [];
    this.tests = [];
  }

  allTests(): Array<TestCase> {
    return [...this.tests, ...this.suites.flatMap((suite) => suite.allTests())];
  }
  entries(): Array<TestCase | Suite> {
    throw new Error("Method not implemented.");
  }
  project(): FullProject | undefined {
    throw new Error("Method not implemented.");
  }
  titlePath(): Array<string> {
    return [...(this.parent ? this.parent.titlePath() : []), this.title];
  }

  addSuite(suite: Suite): void {
    this.suites.push(suite);
  }

  addTest(test: TestCase): void {
    this.tests.push(test);
  }
}

class _TestCase implements TestCase {
  annotations: { type: string; description?: string }[];
  expectedStatus: "passed" | "failed" | "timedOut" | "skipped" | "interrupted";
  id: string;
  location: Location;
  parent: Suite;
  repeatEachIndex: number;
  results: TestResult[];
  retries: number;
  tags: string[];
  timeout: number;
  title: string;
  type: "test";
  _outcome: "skipped" | "expected" | "unexpected" | "flaky";

  constructor(
    title: string,
    location: Location,
    parent: Suite,
    outcome?: "skipped" | "expected" | "unexpected" | "flaky",
  ) {
    this.title = title;
    this.location = location;
    this.parent = parent;
    this._outcome = outcome || "expected";
    this.results = [];
    this.annotations = [];
  }

  ok(): boolean {
    return this._outcome === "expected";
  }
  outcome(): "skipped" | "expected" | "unexpected" | "flaky" {
    return this._outcome;
  }
  titlePath(): Array<string> {
    return [...this.parent.titlePath(), this.title];
  }

  addResult(result: TestResult): void {
    this.results.push(result);
  }
}
