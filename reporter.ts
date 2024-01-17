import type {
  FullConfig,
  Reporter,
  Suite,
  TestCase,
  TestResult,
} from "@playwright/test/reporter";
import path from "path";
import fs from "fs";
import { XMLBuilder } from "fast-xml-parser";
import { formatFailure, stripAnsiEscapes } from "./util";
import { assert } from "playwright-core/lib/utils";

export type TestStepCategory = "hook" | "expect" | "pw:api" | "test.step";
export type AttachmentBasePathCallback = (basePath: string) => string;

export interface TestmoReporterOptions {
  /**
   * Path where to save the JUnit XML file.
   * @default "testmo.xml"
   */
  outputFile?: string;

  /**
   * Embed browser type as property in the JUnit XML file.
   * @default false
   */
  embedBrowserType?: boolean;

  /**
   * Embed test steps as properties in the JUnit XML file.
   * @default true
   */
  embedTestSteps?: boolean;

  /**
   * Embed assertions as steps in the JUnit XML file.
   * @default ["hook","expect","pw:api","test.step"]
   */
  testStepCategories?: TestStepCategory[];

  /**
   * How many levels deep to report test titles.
   * @default 1
   */
  testTitleDepth?: number;

  /**
   * Function which returns an overridden path.
   */
  attachmentBasePathCallback?: AttachmentBasePathCallback;
}

class TestmoReporter implements Reporter {
  private readonly outputFile: string;
  private readonly embedBrowserType: boolean;
  private readonly embedTestSteps: boolean;
  private readonly testStepCategories: TestStepCategory[];
  private readonly testTitleDepth: number;
  private readonly attachmentBasePathCallback?: AttachmentBasePathCallback;

  private config: FullConfig;
  private suite: Suite;
  private timestamp: Date;
  private startTime: number;
  private totalTests: number = 0;
  private totalFailures: number = 0;
  private totalSkipped: number = 0;

  constructor({
    outputFile,
    embedBrowserType,
    embedTestSteps,
    testStepCategories,
    testTitleDepth,
    attachmentBasePathCallback,
  }: TestmoReporterOptions = {}) {
    this.outputFile = outputFile ?? "testmo.xml";
    this.embedBrowserType = embedBrowserType ?? false;
    this.embedTestSteps = embedTestSteps ?? true;
    this.testStepCategories = testStepCategories ?? [
      "hook",
      "expect",
      "pw:api",
      "test.step",
    ];
    this.testTitleDepth = testTitleDepth ?? 1;
    this.attachmentBasePathCallback = attachmentBasePathCallback;
  }

  onBegin(config: FullConfig, suite: Suite) {
    this.config = config;
    this.suite = suite;
    this.timestamp = new Date();
    this.startTime = this.getExactTime();
  }

  onEnd() {
    const duration = this.getExactTime() - this.startTime;

    const children: XMLEntry[] = [];

    for (const projectSuite of this.suite.suites) {
      for (const fileSuite of projectSuite.suites) {
        children.push(this._buildTestSuite(projectSuite.title, fileSuite));
      }
    }

    const root: XMLEntry = {
      "@_name": process.env["PLAYWRIGHT_TESTMO_SUITE_NAME"] ?? undefined,
      "@_tests": this.totalTests,
      "@_failures": this.totalFailures,
      "@_skipped": this.totalSkipped,
      "@_errors": 0,
      "@_assertions": 0,
      "@_time": duration / 1000,
      "@_timestamp": this.timestamp.toISOString(),
      testsuite: children,
    };

    const xmlBuilder = new XMLBuilder({
      arrayNodeName: "testsuites",
      format: true,
      ignoreAttributes: false,
      cdataPropName: "cdata",
    });

    const xml = xmlBuilder.build([root]);

    if (this.outputFile) {
      assert(
        this.config.configFile || path.isAbsolute(this.outputFile),
        "Expected fully resolved path if not using config file.",
      );
      const outputFile = this.config.configFile
        ? path.resolve(path.dirname(this.config.configFile), this.outputFile)
        : this.outputFile;
      fs.mkdirSync(path.dirname(outputFile), { recursive: true });
      fs.writeFileSync(outputFile, xml);
    }
  }

  private _buildTestSuite(projectName: string, suite: Suite): XMLEntry {
    let tests = 0;
    let skipped = 0;
    let failures = 0;
    let duration = 0;

    const testcases: XMLEntry[] = [];

    suite.allTests().forEach((test) => {
      ++tests;
      if (test.outcome() === "skipped") ++skipped;
      if (!test.ok()) ++failures;
      for (const result of test.results) duration += result.duration;
      testcases.push(this._buildTestCase(suite, test));
    });

    this.totalTests += tests;
    this.totalFailures += failures;
    this.totalSkipped += skipped;

    return {
      "@_name": suite.title,
      "@_hostname": projectName,
      "@_tests": tests,
      "@_failures": failures,
      "@_skipped": skipped,
      "@_errors": 0,
      "@_assertions": 0,
      "@_time": duration / 1000,
      "@_timestamp": this.timestamp.toISOString(),
      "@_file": suite.location?.file,
      testcase: testcases,
    };
  }

  private _buildTestCase(suite: Suite, testCase: TestCase): XMLEntry {
    const titlePathArray = testCase.titlePath();
    const titlePath = titlePathArray
      .slice(titlePathArray.length - this.testTitleDepth)
      .join(" › ");

    const entry = {
      "@_name": titlePath,
      "@_classname": suite.title,
      "@_assertions": 0,
      "@_time":
        testCase.results.reduce((acc, result) => acc + result.duration, 0) /
        1000,
      "@_file": testCase.location.file,
      "@_line": testCase.location.line,
    };

    if (testCase.outcome() === "skipped") {
      entry["skipped"] = null;
    }

    if (!testCase.ok()) {
      entry["failure"] = {
        "@_message": `${path.basename(testCase.location.file)}:${
          testCase.location.line
        }:${testCase.location.column} ${testCase.title}`,
        cdata: stripAnsiEscapes(formatFailure(this.config, testCase).message),
      };
    }

    const properties: XMLEntry[] = [];

    this.addAnnotationsToProperties(testCase, properties);
    this.addBrowserToProperties(suite, properties);
    this.addStepsToProperties(testCase, properties);

    const systemOut: string[] = [];
    const systemErr: string[] = [];
    for (const result of testCase.results) {
      systemOut.push(...result.stdout.map((item) => item.toString()));
      systemErr.push(...result.stderr.map((item) => item.toString()));
      this.addAttachmentsToProperties(result, properties);
    }

    if (properties.length > 0) {
      entry["properties"] = {
        property: properties,
      };
    }

    // Note: it is important to only produce a single system-out/system-err entry
    // so that parsers in the wild understand it.
    if (systemOut.length)
      entry["system-out"] = {
        cdata: systemOut.join(""),
      };
    if (systemErr.length)
      entry["system-err"] = {
        cdata: systemErr.join(""),
      };

    return entry;
  }

  private addAttachmentsToProperties(
    result: TestResult,
    properties: XMLEntry[],
  ) {
    for (const attachment of result.attachments) {
      if (!attachment.path) {
        continue;
      }

      try {
        let attachmentPath = path.relative(
          this.config.rootDir,
          attachment.path,
        );

        if (this.attachmentBasePathCallback) {
          const basePath = path
            .normalize(attachmentPath)
            .replace(/^(\.\.(\/|\\|$))+/, "");
          attachmentPath = this.attachmentBasePathCallback(basePath);
        }

        if (!fs.existsSync(attachment.path)) {
          continue;
        }

        if (attachmentPath.startsWith("https://")) {
          properties.push({
            "@_name": "url:attachment",
            "@_value": attachmentPath,
          });
          continue;
        }

        properties.push({
          "@_name": "attachment",
          "@_value": attachmentPath,
        });
      } catch (e) {
        console.error(e);
      }
    }
  }

  private addAnnotationsToProperties(
    testCase: TestCase,
    properties: XMLEntry[],
  ) {
    if (testCase.annotations.length > 0) {
      properties.push(
        ...testCase.annotations.map((annotation) => {
          if (annotation.type.startsWith("html:")) {
            return {
              "@_name": annotation.type,
              cdata: annotation.description,
            };
          }

          return {
            "@_name": annotation.type,
            "@_value": annotation.description,
          };
        }),
      );
    }
  }

  private addStepsToProperties(testCase: TestCase, properties: XMLEntry[]) {
    if (this.embedTestSteps) {
      properties.push(
        ...(testCase.results.at(-1)?.steps.map((step) => {
          let stepStatus = "passed";
          if (step.error) stepStatus = "failure";
          if (
            !this.testStepCategories.includes(step.category as TestStepCategory)
          )
            return;

          return {
            "@_name": `step[${stepStatus}]`,
            "@_value": step.title,
          };
        }) ?? []),
      );
    }
  }

  private addBrowserToProperties(suite: Suite, properties: XMLEntry[]) {
    if (this.embedBrowserType) {
      const browser = suite.project().use.defaultBrowserType;

      properties.push({
        "@_name": `browser`,
        "@_value": browser,
      });
    }
  }

  printsToStdio(): boolean {
    return true;
  }

  getExactTime(): number {
    const [seconds, nanoseconds] = process.hrtime();
    return seconds * 1000 + ((nanoseconds / 1000) | 0) / 1000;
  }
}

type XMLValue = string | number | boolean | XMLEntry | XMLEntry[] | undefined;

interface XMLEntry {
  [x: string]: XMLValue;
}

export default TestmoReporter;
