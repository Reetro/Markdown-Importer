// Markdown Importer — journal.js
// Creates Foundry Journal Entries from markdown text

export async function createJournalEntry(text, filename) {
  const m     = text.match(/^#\s+(.+)$/m);
  const title = m ? m[1].replace(/\*\*/g, "").trim() : filename.replace(".md", "");

  return JournalEntry.create({
    name: title,
    pages: [{
      name: title,
      type: "text",
      text: { content: mdToHTML(text), format: 1 },
    }],
  });
}

function mdToHTML(text) {
  return text
    .replace(/^####\s+(.+)$/gm, "<h4>$1</h4>")
    .replace(/^###\s+(.+)$/gm,  "<h3>$1</h3>")
    .replace(/^##\s+(.+)$/gm,   "<h2>$1</h2>")
    .replace(/^#\s+(.+)$/gm,    "<h1>$1</h1>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g,     "<em>$1</em>")
    .replace(/^>\s+(.+)$/gm,     "<blockquote><p>$1</p></blockquote>")
    .replace(/^---+$/gm,         "<hr>")
    .replace(/^-\s+(.+)$/gm,     "<li>$1</li>")
    .replace(/(<li>[\s\S]+?<\/li>)/g, "<ul>$1</ul>")
    .replace(/\n\n/g,            "</p><p>")
    .replace(/^(?!<[hublpd])(.+)$/gm, "<p>$1</p>")
    .replace(/<p><\/p>/g, "")
    .trim();
}
