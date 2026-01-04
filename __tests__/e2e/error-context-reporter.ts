import {
  Reporter,
  FullConfig,
  Suite,
  TestCase,
  TestResult,
  FullResult,
} from '@playwright/test/reporter';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Custom Playwright reporter that captures error context for failed tests
 * This creates an error-context.md file in the test results directory
 */
class ErrorContextReporter implements Reporter {
  onBegin(config: FullConfig, suite: Suite) {
    console.log(`Starting test run with ${suite.allTests().length} tests`);
  }

  onTestEnd(test: TestCase, result: TestResult) {
    // Only process failed tests
    if (result.status !== 'passed' && result.status !== 'skipped') {
      this.saveErrorContext(test, result);
    }
  }

  onEnd(result: FullResult) {
    console.log(`Test run finished with status: ${result.status}`);
  }

  private saveErrorContext(test: TestCase, result: TestResult) {
    try {
      // Determine output directory
      // Playwright creates a directory for each test in test-results
      let outputDir: string;
      
      if (result.attachments.length > 0 && result.attachments[0].path) {
        // Use the directory where screenshots/attachments are saved
        outputDir = path.dirname(result.attachments[0].path);
      } else {
        // Fallback: construct the path following Playwright's convention
        // test-results/<test-file-name>-<test-title>-<project-name>
        const sanitizedTitle = test.title.replace(/[^a-z0-9]/gi, '-').toLowerCase().substring(0, 50);
        const sanitizedFile = path.basename(test.location.file, '.spec.ts');
        const projectName = test.parent.project()?.name || 'chromium';
        const dirName = `${sanitizedFile}-${sanitizedTitle}-${projectName}`;
        outputDir = path.join('test-results', dirName);
      }

      // Ensure directory exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const errorContextPath = path.join(outputDir, 'error-context.md');
      const errorContextMd = this.buildErrorContextMarkdown(test, result);

      fs.writeFileSync(errorContextPath, errorContextMd, 'utf-8');
      console.log(`Error context saved: ${errorContextPath}`);
    } catch (error) {
      console.error('Failed to save error context:', error);
    }
  }

  private buildErrorContextMarkdown(test: TestCase, result: TestResult): string {
    const lines: string[] = [];

    // Header
    lines.push('# Test Error Context\n');
    lines.push(`**Generated:** ${new Date().toISOString()}\n`);
    lines.push('---\n');

    // Test Information
    lines.push('## Test Information\n');
    lines.push(`**Test Name:** ${test.title}`);
    lines.push(`**Test File:** ${test.location.file}:${test.location.line}`);
    lines.push(`**Project:** ${test.parent.project()?.name || 'default'}`);
    lines.push(`**Status:** ${result.status}`);
    lines.push(`**Duration:** ${result.duration}ms`);
    lines.push(`**Started:** ${result.startTime.toISOString()}`);
    lines.push(`**Retry:** ${result.retry}\n`);

    // Error Details
    if (result.error) {
      lines.push('## Error Details\n');
      lines.push('```');
      lines.push(result.error.message || 'No error message available');
      if (result.error.stack) {
        lines.push('');
        lines.push('Stack Trace:');
        lines.push(result.error.stack);
      }
      lines.push('```\n');
    }

    // Stdout/Stderr
    if (result.stdout && result.stdout.length > 0) {
      lines.push('## Standard Output\n');
      lines.push('```');
      for (const chunk of result.stdout) {
        lines.push(chunk.toString());
      }
      lines.push('```\n');
    }

    if (result.stderr && result.stderr.length > 0) {
      lines.push('## Standard Error\n');
      lines.push('```');
      for (const chunk of result.stderr) {
        lines.push(chunk.toString());
      }
      lines.push('```\n');
    }

    // Steps
    if (result.steps && result.steps.length > 0) {
      lines.push('## Test Steps\n');
      for (const step of result.steps) {
        const indent = '  '.repeat(step.category === 'test.step' ? 0 : 1);
        const status = step.error ? '❌' : '✓';
        lines.push(`${indent}${status} ${step.title} (${step.duration}ms)`);
        if (step.error) {
          lines.push(`${indent}   Error: ${step.error.message}`);
        }
      }
      lines.push('');
    }

    // Attachments
    lines.push('## Attachments\n');
    if (result.attachments && result.attachments.length > 0) {
      for (const attachment of result.attachments) {
        const fileName = attachment.path ? path.basename(attachment.path) : 'inline';
        lines.push(`- **${attachment.name}** (${attachment.contentType}): ${fileName}`);
      }
      lines.push('');
    } else {
      lines.push('*No attachments*\n');
    }

    // Additional debugging hints
    lines.push('## Debugging Hints\n');
    lines.push('To debug this test:');
    lines.push('1. Check the screenshot(s) attached above');
    lines.push('2. Run the test with `npm run test:e2e:headed` to see it in a browser');
    lines.push('3. Use `npm run test:e2e:ui` for interactive debugging');
    lines.push('4. Check the HTML reporter with `npx playwright show-report`\n');

    // Footer
    lines.push('---');
    lines.push(`*Error context generated by custom Playwright reporter*`);

    return lines.join('\n');
  }
}

export default ErrorContextReporter;
