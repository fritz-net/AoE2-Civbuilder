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
  private testContextData = new Map<string, {
    consoleLogs: string[];
    networkRequests: any[];
    startTime: Date;
  }>();

  onBegin(config: FullConfig, suite: Suite) {
    console.log(`Starting test run with ${suite.allTests().length} tests`);
  }

  onTestBegin(test: TestCase, result: TestResult) {
    // Initialize context for this test
    const testId = test.id;
    this.testContextData.set(testId, {
      consoleLogs: [],
      networkRequests: [],
      startTime: new Date()
    });
  }

  onTestEnd(test: TestCase, result: TestResult) {
    // Only process failed tests
    if (result.status !== 'passed' && result.status !== 'skipped') {
      this.saveErrorContext(test, result);
    }
    
    // Clean up context data
    this.testContextData.delete(test.id);
  }

  onEnd(result: FullResult) {
    console.log(`Test run finished with status: ${result.status}`);
  }

  private saveErrorContext(test: TestCase, result: TestResult) {
    try {
      // Get output directory from test attachments
      const outputDir = result.attachments.length > 0
        ? path.dirname(result.attachments[0].path || '')
        : path.join('test-results', this.sanitizeTestName(test));

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

  private sanitizeTestName(test: TestCase): string {
    const title = test.title.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const file = path.basename(test.location.file, '.spec.ts');
    return `${file}-${title}`;
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
