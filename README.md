# Playwright Testmo Reporter

Playwright Testmo Reporter is a specialized test reporter designed for integration with the Testmo test management SaaS platform. It's crafted to generate a JUnit XML file that includes test steps, links to attachments, and details of fails, passes, etc. The project is written in TypeScript and aims to provide a seamless and lightweight experience.

## Features

- **JUnit XML File Generation**: Includes detailed test steps, attachments, and statuses.
- **Easy Integration**: Only requires a simple installation and configuration.
- **Lightweight**: Utilizes a single dependency (`fast-xml-parser`) to generate XML data.
- **Well-maintained Code**: Adheres to coding standards and continuously receives updates.
- **Verified Implementation**: Contacts with Testmo to ensure the implementation meets quality standards.

## Installation

Installing the Playwright Testmo Reporter is a breeze. Simply run the following command:

```bash
npm install --save-dev playwright-testmo-reporter
```

## Configuration

To configure the reporter, add it to your `playwright.config.ts` file. That's all you need to do to set it up!

Example `playwright.config.ts` file:

```typescript
...
reporter: [
    [
      'playwright-testmo-reporter',
      {
        outputFile: 'testmo/testmo.xml', // Optional: Output file path. Defaults to 'testmo.xml'.
        embedTestSteps: true, // Optional: Embed test steps in the XML file. Defaults to true.
      }
    ]
]
...
```

## Usage

Once installed and configured, all you have to do is run your tests:

```bash
# Run all tests
npx playwright test
```

The rest works like magic. You'll have the JUnit XML file generated with all the required details.

After the tests have run, you need to use the Testmo CLI tool to import the data into Testmo.

## Dependencies

- **Required**: `fast-xml-parser`
- **Peer Dependencies**: `@playwright/test`, `playwright-core` (usually already installed in a Playwright project)

## NPM Package

You can find the package on NPM at [playwright-testmo-reporter](https://www.npmjs.com/package/playwright-testmo-reporter).

## Support

For any issues, queries, or contributions, please refer to the official repository or reach out to the Testmo contacts provided in the package documentation.

## License

Please refer to the license file in the repository for information on the usage terms and conditions.

**Happy Testing with Playwright and Testmo! 🚀**
