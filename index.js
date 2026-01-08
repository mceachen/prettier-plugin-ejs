/*
 * Copyright (c) 1986-2024 Ecmel Ercan (https://ecmel.dev/)
 * Licensed under the MIT License
 */

// Prettier 3.x moved parsers to plugins directory
const { parsers } = require("prettier/plugins/html");

// Store EJS snippets for restoration after formatting
// Key: placeholder string, Value: original EJS
const ejsMap = new Map();

// Control char delimiters - invisible, won't appear in normal HTML
// "\x010\x02" = 3 chars, fits shortest EJS like "<% %>" (5 chars)
const START = "\x01";
const END = "\x02";

// Create a placeholder that's the same length as the original EJS
function createPlaceholder(ejsContent, index) {
  const prefix = `${START}${index}${END}`;
  const targetLength = ejsContent.length;

  if (prefix.length >= targetLength) {
    // Placeholder is already long enough (or longer)
    return prefix;
  }

  // Pad with underscores to match original length
  return prefix.padEnd(targetLength, "_");
}

function ejsToPlaceholder(text) {
  ejsMap.clear();
  let index = 0;

  return text.replace(/<%[\s\S]*?%>/g, (match) => {
    const placeholder = createPlaceholder(match, index++);
    ejsMap.set(placeholder, match);
    return placeholder;
  });
}

function restoreEjs(str) {
  if (typeof str !== "string") return str;
  // Replace all placeholders with their original EJS
  for (const [placeholder, original] of ejsMap) {
    str = str.split(placeholder).join(original);
  }
  return str;
}

function restoreEjsInAst(node) {
  if (!node || typeof node !== "object") return;

  if (node.value != null) {
    node.value = restoreEjs(node.value);
  }

  if (node.attrs) {
    for (const attr of node.attrs) {
      if (attr.name != null) attr.name = restoreEjs(attr.name);
      if (attr.value != null) attr.value = restoreEjs(attr.value);
    }
  }

  if (node.children) {
    for (const child of node.children) {
      restoreEjsInAst(child);
    }
  }
}

function parse(text, options) {
  const transformed = ejsToPlaceholder(text);
  const ast = parsers.html.parse(transformed, options);
  restoreEjsInAst(ast);
  return ast;
}

module.exports = {
  languages: [
    {
      name: "EJS",
      parsers: ["html"],
      extensions: [".ejs"],
    },
  ],
  parsers: {
    html: {
      ...parsers.html,
      parse,
    },
  },
};
