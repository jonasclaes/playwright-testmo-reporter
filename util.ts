/**
 * The code that is in this file was largely copied from the Playwright test reporter.
 * The code was copied to allow for custom formatting of the test results.
 * The original code can be found here:
 * https://github.com/microsoft/playwright/blob/fe5cb1603b10871e709eb4e5318333d036635af0/packages/playwright-test/src/reporters/base.ts
 *
 * This code was copied to mimic the JUnit reporter error formatting.
 *
 * You can find the Microsoft license below:
 *
 * > Copyright (c) Microsoft Corporation.
 * >
 * > Licensed under the Apache License, Version 2.0 (the "License");
 * > you may not use this file except in compliance with the License.
 * > You may obtain a copy of the License at
 * >
 * > http://www.apache.org/licenses/LICENSE-2.0
 * >
 * > Unless required by applicable law or agreed to in writing, software
 * > distributed under the License is distributed on an "AS IS" BASIS,
 * > WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * > See the License for the specific language governing permissions and
 * > limitations under the License.
 */

import { FullConfig } from "@playwright/test";
import {
  TestCase,
  TestResult,
  TestStep,
  TestError,
  Location,
} from "@playwright/test/reporter";
import path from "path";
import { colors, parseStackTraceLine } from "playwright-core/lib/utilsBundle";

export type TestResultOutput = {
  chunk: string | Buffer;
  type: "stdout" | "stderr";
};
export const kOutputSymbol = Symbol("output");

type Annotation = {
  title: string;
  message: string;
  location?: Location;
};

type ErrorDetails = {
  message: string;
  location?: Location;
};

export function formatFailure(
  config: FullConfig,
  test: TestCase,
  options: {
    index?: number;
    includeStdio?: boolean;
    includeAttachments?: boolean;
  } = {},
): {
  message: string;
  annotations: Annotation[];
} {
  const { index, includeStdio, includeAttachments = true } = options;
  const lines: string[] = [];
  const title = formatTestTitle(config, test);
  const annotations: Annotation[] = [];
  const header = formatTestHeader(config, test, {
    indent: "  ",
    index,
    mode: "error",
  });
  lines.push(colors.red(header));
  for (const result of test.results) {
    const resultLines: string[] = [];
    const errors = formatResultFailure(test, result, "    ", colors.enabled);
    if (!errors.length) continue;
    const retryLines: string[] = [];
    if (result.retry) {
      retryLines.push("");
      retryLines.push(colors.gray(separator(`    Retry #${result.retry}`)));
    }
    resultLines.push(...retryLines);
    resultLines.push(...errors.map((error) => "\n" + error.message));
    if (includeAttachments) {
      for (let i = 0; i < result.attachments.length; ++i) {
        const attachment = result.attachments[i];
        const hasPrintableContent =
          attachment.contentType.startsWith("text/") && attachment.body;
        if (!attachment.path && !hasPrintableContent) continue;
        resultLines.push("");
        resultLines.push(
          colors.cyan(
            separator(
              `    attachment #${i + 1}: ${attachment.name} (${
                attachment.contentType
              })`,
            ),
          ),
        );
        if (attachment.path) {
          const relativePath = path.relative(process.cwd(), attachment.path);
          resultLines.push(colors.cyan(`    ${relativePath}`));
          // Make this extensible
          if (attachment.name === "trace") {
            resultLines.push(colors.cyan(`    Usage:`));
            resultLines.push("");
            resultLines.push(
              colors.cyan(`        npx playwright show-trace ${relativePath}`),
            );
            resultLines.push("");
          }
        } else {
          if (attachment.contentType.startsWith("text/") && attachment.body) {
            let text = attachment.body.toString();
            if (text.length > 300) text = text.slice(0, 300) + "...";
            for (const line of text.split("\n"))
              resultLines.push(colors.cyan(`    ${line}`));
          }
        }
        resultLines.push(colors.cyan(separator("   ")));
      }
    }
    const output = (result[kOutputSymbol] || []) as TestResultOutput[];
    if (includeStdio && output.length) {
      const outputText = output
        .map(({ chunk, type }) => {
          const text = chunk.toString("utf8");
          if (type === "stderr") return colors.red(stripAnsiEscapes(text));
          return text;
        })
        .join("");
      resultLines.push("");
      resultLines.push(
        colors.gray(separator("--- Test output")) +
          "\n\n" +
          outputText +
          "\n" +
          separator(),
      );
    }
    for (const error of errors) {
      annotations.push({
        location: error.location,
        title,
        message: [header, ...retryLines, error.message].join("\n"),
      });
    }
    lines.push(...resultLines);
  }
  lines.push("");
  return {
    message: lines.join("\n"),
    annotations,
  };
}

export function formatResultFailure(
  test: TestCase,
  result: TestResult,
  initialIndent: string,
  highlightCode: boolean,
): ErrorDetails[] {
  const errorDetails: ErrorDetails[] = [];

  if (result.status === "passed" && test.expectedStatus === "failed") {
    errorDetails.push({
      message: indent(
        colors.red(`Expected to fail, but passed.`),
        initialIndent,
      ),
    });
  }
  if (result.status === "interrupted") {
    errorDetails.push({
      message: indent(colors.red(`Test was interrupted.`), initialIndent),
    });
  }

  for (const error of result.errors) {
    const formattedError = formatError(error, highlightCode);
    errorDetails.push({
      message: indent(formattedError.message, initialIndent),
      location: formattedError.location,
    });
  }
  return errorDetails;
}

export function relativeFilePath(config: FullConfig, file: string): string {
  return path.relative(config.rootDir, file) || path.basename(file);
}

function relativeTestPath(config: FullConfig, test: TestCase): string {
  return relativeFilePath(config, test.location.file);
}

export function stepSuffix(step: TestStep | undefined) {
  const stepTitles = step ? step.titlePath() : [];
  return stepTitles.map((t) => " › " + t).join("");
}

export function formatTestTitle(
  config: FullConfig,
  test: TestCase,
  step?: TestStep,
  omitLocation: boolean = false,
): string {
  // root, project, file, ...describes, test
  const [, projectName, , ...titles] = test.titlePath();
  let location;
  if (omitLocation) location = `${relativeTestPath(config, test)}`;
  else
    location = `${relativeTestPath(config, test)}:${
      step?.location?.line ?? test.location.line
    }:${step?.location?.column ?? test.location.column}`;
  const projectTitle = projectName ? `[${projectName}] › ` : "";
  return `${projectTitle}${location} › ${titles.join(" › ")}${stepSuffix(
    step,
  )}`;
}

function formatTestHeader(
  config: FullConfig,
  test: TestCase,
  options: {
    indent?: string;
    index?: number;
    mode?: "default" | "error";
  } = {},
): string {
  const title = formatTestTitle(config, test);
  const header = `${options.indent || ""}${
    options.index ? options.index + ") " : ""
  }${title}`;
  let fullHeader = header;

  // Render the path to the deepest failing test.step.
  if (options.mode === "error") {
    const stepPaths = new Set<string>();
    for (const result of test.results.filter((r) => !!r.errors.length)) {
      const stepPath: string[] = [];
      const visit = (steps: TestStep[]) => {
        const errors = steps.filter((s) => s.error);
        if (errors.length > 1) return;
        if (errors.length === 1 && errors[0].category === "test.step") {
          stepPath.push(errors[0].title);
          visit(errors[0].steps);
        }
      };
      visit(result.steps);
      stepPaths.add(["", ...stepPath].join(" › "));
    }
    fullHeader =
      header + (stepPaths.size === 1 ? stepPaths.values().next().value : "");
  }
  return separator(fullHeader);
}

export function formatError(
  error: TestError,
  highlightCode: boolean,
): ErrorDetails {
  const message = error.message || error.value || "";
  const stack = error.stack;
  if (!stack && !error.location) return { message };

  const tokens: string[] = [];

  // Now that we filter out internals from our stack traces, we can safely render
  // the helper / original exception locations.
  const parsedStack = stack ? prepareErrorStack(stack) : undefined;
  tokens.push(parsedStack?.message || message);

  if (error.snippet) {
    let snippet = error.snippet;
    if (!highlightCode) snippet = stripAnsiEscapes(snippet);
    tokens.push("");
    tokens.push(snippet);
  }

  if (parsedStack) {
    tokens.push("");
    tokens.push(colors.dim(parsedStack.stackLines.join("\n")));
  }

  let location = error.location;
  if (parsedStack && !location) location = parsedStack.location;

  return {
    location,
    message: tokens.join("\n"),
  };
}

export function separator(text: string = ""): string {
  if (text) text += " ";
  const columns = Math.min(100, process.stdout?.columns || 100);
  return text + colors.dim("─".repeat(Math.max(0, columns - text.length)));
}

function indent(lines: string, tab: string) {
  return lines.replace(/^(?=.+$)/gm, tab);
}

export function prepareErrorStack(stack: string): {
  message: string;
  stackLines: string[];
  location?: Location;
} {
  const lines = stack.split("\n");
  let firstStackLine = lines.findIndex((line) => line.startsWith("    at "));
  if (firstStackLine === -1) firstStackLine = lines.length;
  const message = lines.slice(0, firstStackLine).join("\n");
  const stackLines = lines.slice(firstStackLine);
  let location: Location | undefined;
  for (const line of stackLines) {
    const frame = parseStackTraceLine(line);
    if (!frame || !frame.file) continue;
    if (belongsToNodeModules(frame.file)) continue;
    location = {
      file: frame.file,
      column: frame.column || 0,
      line: frame.line || 0,
    };
    break;
  }
  return { message, stackLines, location };
}

const ansiRegex = new RegExp(
  // eslint-disable-next-line no-control-regex
  "([\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)|(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~])))",
  "g",
);
export function stripAnsiEscapes(str: string): string {
  return str.replace(ansiRegex, "");
}

function belongsToNodeModules(file: string) {
  return file.includes(`${path.sep}node_modules${path.sep}`);
}
