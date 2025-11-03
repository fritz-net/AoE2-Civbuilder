#!/usr/bin/env node
/**
 * Generate GitHub Actions Job Summary from Playwright/Jest test results
 * Reads JSON test results and writes markdown to GITHUB_STEP_SUMMARY
 */

const fs = require('fs');
const path = require('path');

function generateMarkdownSummary(resultsFile) {
  if (!fs.existsSync(resultsFile)) {
    console.log(`Results file not found: ${resultsFile}`);
    return;
  }

  const results = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
  
  let markdown = '## 🎭 Playwright UI E2E Test Results\n\n';
  
  // Summary stats
  const numPassedTests = results.numPassedTests || 0;
  const numFailedTests = results.numFailedTests || 0;
  const numPendingTests = results.numPendingTests || 0;
  const numTotalTests = results.numTotalTests || 0;
  const success = results.success || false;
  
  const passIcon = '✅';
  const failIcon = '❌';
  const skipIcon = '⏭️';
  const overallIcon = success ? passIcon : failIcon;
  
  markdown += `### ${overallIcon} Overall: ${success ? 'PASSED' : 'FAILED'}\n\n`;
  markdown += '| Metric | Count |\n';
  markdown += '|--------|-------|\n';
  markdown += `| ${passIcon} Passed | ${numPassedTests} |\n`;
  markdown += `| ${failIcon} Failed | ${numFailedTests} |\n`;
  markdown += `| ${skipIcon} Skipped | ${numPendingTests} |\n`;
  markdown += `| 📊 Total | ${numTotalTests} |\n`;
  markdown += `| ⏱️ Duration | ${(results.testResults?.[0]?.endTime - results.testResults?.[0]?.startTime || 0) / 1000}s |\n\n`;
  
  // Test details
  if (results.testResults && results.testResults.length > 0) {
    markdown += '### 📋 Test Details\n\n';
    
    for (const testResult of results.testResults) {
      const testFileName = path.basename(testResult.name || 'unknown');
      markdown += `#### 📄 ${testFileName}\n\n`;
      
      if (testResult.assertionResults && testResult.assertionResults.length > 0) {
        for (const assertion of testResult.assertionResults) {
          const icon = assertion.status === 'passed' ? passIcon : 
                       assertion.status === 'failed' ? failIcon : skipIcon;
          const duration = assertion.duration ? ` (${assertion.duration}ms)` : '';
          markdown += `- ${icon} **${assertion.title}**${duration}\n`;
          
          if (assertion.failureMessages && assertion.failureMessages.length > 0) {
            markdown += '  ```\n';
            assertion.failureMessages.forEach(msg => {
              // Truncate long error messages
              const truncated = msg.length > 500 ? msg.substring(0, 500) + '...' : msg;
              markdown += `  ${truncated}\n`;
            });
            markdown += '  ```\n';
          }
        }
      }
      markdown += '\n';
    }
  }
  
  // Console output summary (if available)
  if (results.testResults?.[0]?.console && results.testResults[0].console.length > 0) {
    markdown += '### 📝 Console Output Highlights\n\n';
    markdown += '<details>\n<summary>Click to expand console logs</summary>\n\n';
    markdown += '```\n';
    
    const logs = results.testResults[0].console.slice(0, 50); // Limit to 50 logs
    for (const log of logs) {
      if (log.message) {
        markdown += `${log.message}\n`;
      }
    }
    
    if (results.testResults[0].console.length > 50) {
      markdown += `\n... and ${results.testResults[0].console.length - 50} more lines\n`;
    }
    
    markdown += '```\n</details>\n\n';
  }
  
  // Add footer
  markdown += '---\n';
  markdown += `*Generated at ${new Date().toISOString()}*\n`;
  
  return markdown;
}

// Main execution
const resultsFile = process.argv[2] || 'playwright-jest-results.json';
const markdown = generateMarkdownSummary(resultsFile);

if (markdown && process.env.GITHUB_STEP_SUMMARY) {
  // Append to GitHub Actions step summary
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);
  console.log('✓ Test summary written to GITHUB_STEP_SUMMARY');
} else if (markdown) {
  // Output to console if not in GitHub Actions
  console.log(markdown);
} else {
  console.log('No results to summarize');
  process.exit(1);
}
