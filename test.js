/**
 * Tests for prettier-plugin-ejs
 *
 * Run with: node test.js
 */

const prettier = require("prettier");
const plugin = require("./index.js");

const testCases = [
  {
    name: "Issue #11: EJS inside opening tag (README example)",
    input: `<td <% if (styleData) { %> style="<%= styleData %>" <% } %>><%= data %></td>`,
  },
  {
    name: "Issue #11: conditional attribute in button",
    input: `<button class="fr-btn" <% if (locals.ariaLabel) { %>aria-label="<%= locals.ariaLabel %>"<% } %>><%= label %></button>`,
  },
  {
    name: "Simple EJS between tags",
    input: `<div><% if (x) { %><span>y</span><% } %></div>`,
  },
  {
    name: "EJS in attribute value",
    input: `<div class="<%= red %>"><%= value %></div>`,
  },
  {
    name: "Multiple EJS in attribute value",
    input: `<div class="<%= a %> <%= b %>"><%= c %></div>`,
  },
  {
    name: "Textarea content preserved",
    input: `<textarea><%= text %></textarea>`,
    shouldContain: `<textarea><%= text %></textarea>`,
  },
  {
    name: "Script content preserved",
    input: `<script>const x = <% getValue() %>;</script>`,
    shouldContain: `<% getValue() %>`,
  },
  {
    name: "EJS with > (intentionally ignored)",
    input: `<div class="<%= x > y %>">test</div>`,
    shouldContain: `<%= x > y %>`,
  },
];

async function formatEJS(input) {
  return prettier.format(input, {
    parser: "html",
    plugins: [plugin],
  });
}

async function runTests() {
  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    process.stdout.write(`Testing: ${testCase.name}... `);

    try {
      const output = await formatEJS(testCase.input);

      // Should parse without errors (no crash)
      // Should contain EJS syntax (not [%...%])
      if (output.includes("[%") || output.includes("%]")) {
        console.log("✗ FAILED (contains unconverted [%...%])");
        console.log(`  Got: ${output.trim()}`);
        failed++;
        continue;
      }

      // Check specific content if required
      if (testCase.shouldContain && !output.includes(testCase.shouldContain)) {
        console.log(`✗ FAILED (missing: ${testCase.shouldContain})`);
        console.log(`  Got: ${output.trim()}`);
        failed++;
        continue;
      }

      // Should still contain EJS tags
      if (!output.includes("<%") || !output.includes("%>")) {
        console.log("✗ FAILED (EJS tags missing)");
        console.log(`  Got: ${output.trim()}`);
        failed++;
        continue;
      }

      console.log("✓ PASSED");
      passed++;
    } catch (err) {
      console.log(`✗ FAILED: ${err.message.split("\n")[0]}`);
      failed++;
    }
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
