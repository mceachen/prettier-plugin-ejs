/*
 * Copyright (c) 1986-2024 Ecmel Ercan (https://ecmel.dev/)
 * Licensed under the MIT License
 */

const { parsers } = require("prettier/parser-html");

// Hide EJS from Prettier's HTML parser by replacing < and > with control chars.
// Prettier v3 rejects <! inside attributes, so we use \x01 and \x02 instead.

function ejsToPlaceholder(text) {
  // Preserve textarea/title/script content unchanged
  const preserved = [];
  text = text.replace(
    /<(textarea|title|script)(?:\s[^>]*)?>[\s\S]*?<\/\1>/gi,
    (match) => {
      preserved.push(match);
      return "\x00".repeat(match.length);
    }
  );

  // <%...%> -> \x01%...%\x02 (skip EJS containing > to avoid breaking attrs)
  text = text.replace(/<(%[^>]*%)>/g, `\x01$1\x02`);

  let i = 0;
  text = text.replace(/\x00+/g, () => preserved[i++]);
  return text;
}

function restoreEjs(str) {
  if (typeof str !== "string") return str;
  return str.replace(/\x01%/g, "<%").replace(/%\x02/g, "%>");
}

function restoreEjsInAst(node) {
  if (!node || typeof node !== "object") return;

  if (node.value) {
    node.value = restoreEjs(node.value);
  }

  if (node.attrs) {
    for (const attr of node.attrs) {
      attr.name = restoreEjs(attr.name);
      attr.value = restoreEjs(attr.value);
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
