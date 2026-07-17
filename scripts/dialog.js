// Markdown Importer — dialog.js
// Shows the import type selection dialog and returns the user's choice

export function askImportType(filename) {
  return new Promise(resolve => {
    const html = `
      <div style="padding:8px 4px 4px 4px; font-family:var(--font-primary,sans-serif)">
        <p style="font-size:15px; font-weight:600; margin:0 0 6px 0; word-break:break-all">
          ${filename}
        </p>
        <p style="font-size:13px; margin:0 0 4px 0">
          What should this file become in Foundry?
        </p>
      </div>
    `;

    const d = new Dialog({
      title:   "Markdown Importer",
      content: html,
      buttons: {
        npc: {
          icon:     "<i class='fas fa-dragon'></i>",
          label:    "NPC Actor",
          callback: h => resolve({ type: "npc",     useLookup: _getLookup(h) }),
        },
        pc: {
          icon:     "<i class='fas fa-user'></i>",
          label:    "Player Character",
          callback: h => resolve({ type: "pc",      useLookup: _getLookup(h) }),
        },
        journal: {
          icon:     "<i class='fas fa-book-open'></i>",
          label:    "Journal Entry",
          callback: h => resolve({ type: "journal", useLookup: false }),
        },
        cancel: {
          icon:     "<i class='fas fa-times'></i>",
          label:    "Cancel",
          callback: () => resolve(null),
        },
      },
      default: "journal",
      render: (html) => {
        const win  = html.closest(".app");
        const btns = win.find(".dialog-buttons");

        // Inject checkbox after the button row
        btns.after(`
          <div style="border-top:1px solid #444; padding:12px 16px 4px 16px; margin-top:2px">
            <label style="display:flex; align-items:flex-start; gap:10px; background:rgba(255,255,255,0.05); border:1px solid #555; border-radius:4px; padding:10px 12px; cursor:pointer">
              <input type="checkbox" id="md-lookup" style="width:16px; height:16px; margin-top:2px; flex-shrink:0; cursor:pointer">
              <span>
                <strong style="display:block; font-size:13px; margin-bottom:3px">
                  Normalise skill and damage names
                </strong>
                <span style="font-size:12px; line-height:1.4">
                  Formats skill and damage type names to match Foundry's internal naming conventions before importing
                </span>
              </span>
            </label>
          </div>
        `);

        // Force window size via DOM — Foundry v14 ignores width/height constructor options
        const el = win[0];
        if (el) {
          el.style.width     = "700px";
          el.style.minHeight = "280px";
          el.style.height    = "auto";
          el.style.left      = `${Math.max(0, (window.innerWidth - 700) / 2)}px`;
        }
      },
    });

    d.render(true);
  });
}

function _getLookup(html) {
  return html.closest(".app").find("#md-lookup").is(":checked");
}
