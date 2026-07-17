// Markdown Importer — dialog.js
// Uses foundry.applications.api.DialogV2 (Foundry v13+)

export function askImportType(filename) {
  return new Promise(resolve => {
    foundry.applications.api.DialogV2.wait({
      window: { title: "Markdown Importer" },
      position: { width: 700 },
      content: `
        <div style="padding:8px 4px 4px 4px; font-family:var(--font-primary,sans-serif)">
          <p style="font-size:15px; font-weight:600; margin:0 0 6px 0; word-break:break-all">
            ${filename}
          </p>
          <p style="font-size:13px; margin:0 0 4px 0">
            What should this file become in Foundry?
          </p>
          <div style="border-top:1px solid #444; padding:12px 0 4px 0; margin-top:12px">
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
        </div>
      `,
      buttons: [
        {
          icon:     "fa-dragon",
          label:    "NPC Actor",
          action:   "npc",
          callback: (event, button, dialog) => ({
            type: "npc",
            useLookup: dialog.element.querySelector("#md-lookup")?.checked ?? false,
          }),
        },
        {
          icon:     "fa-user",
          label:    "Player Character",
          action:   "pc",
          callback: (event, button, dialog) => ({
            type: "pc",
            useLookup: dialog.element.querySelector("#md-lookup")?.checked ?? false,
          }),
        },
        {
          icon:     "fa-book-open",
          label:    "Journal Entry",
          action:   "journal",
          callback: () => ({ type: "journal", useLookup: false }),
        },
        {
          icon:     "fa-times",
          label:    "Cancel",
          action:   "cancel",
          callback: () => null,
        },
      ],
      close: () => resolve(null),
    }).then(result => resolve(result)).catch(() => resolve(null));
  });
}
