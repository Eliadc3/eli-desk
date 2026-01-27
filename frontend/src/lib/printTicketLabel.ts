// frontend/src/lib/printTicketLabel.ts
// Prints a small "label" with ticket details, fully client-side (no server storage).

export type TicketLabelData = {
  number: string | number;
  department?: string | null;
  requester?: string | null;
  assignee?: string | null;
  createdAt?: string | Date | null;
  subject?: string | null;
  description?: string | null;
};

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}


function fmtDate(d?: string | Date | null) {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleString("he-IL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildLabelHtml(data: TicketLabelData) {
  const number = escapeHtml(String(data.number ?? ""));
  const department = escapeHtml(data.department ?? "—");
  const requester = escapeHtml(data.requester ?? "—");
  const assignee = escapeHtml(data.assignee ?? "לא משויך");
  const createdAt = escapeHtml(fmtDate(data.createdAt));

  const subject = escapeHtml((data.subject ?? "").trim());
  const description = escapeHtml((data.description ?? "").trim());


  // Default label size: 90mm x 57mm (common label printers)
  return `<!doctype html>
<html lang="he" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Ticket ${number}</title>
    <style>
      @page { size: 90mm 57mm; margin: 3mm; }
      * { box-sizing: border-box; }
      html, body { height: 100%; }
      body {
        margin: 0;
        font-family: system-ui, -apple-system, "Segoe UI", Arial, "Noto Sans Hebrew", "Noto Sans", sans-serif;
        color: #111;
      }
      .label {
        height: calc(57mm - 6mm);
        width: calc(90mm - 6mm);
        border: 1px solid #111;
        border-radius: 6px;
        padding: 8px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .top {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 8px;
      }
      .ticketNo {
        font-size: 16px;
        font-weight: 800;
        letter-spacing: 0.2px;
        white-space: nowrap;
      }
      .date {
        font-size: 11px;
        color: #333;
        white-space: nowrap;
      }
      .grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 6px 10px;
      }
      .row { display: flex; gap: 6px; min-width: 0; }
      .k { font-size: 10px; color: #444; white-space: nowrap; }
      .v { font-size: 12px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .content {
        margin-top: 2px;
        padding-top: 6px;
        border-top: 1px dashed #777;
        font-size: 11px;
        line-height: 1.25;
        white-space: pre-wrap;
        overflow: hidden;
        display: -webkit-box;
        -webkit-line-clamp: 6;
        -webkit-box-orient: vertical;
      }
      .hint { display: none; }
      @media screen {
        body { background: #f6f7f8; padding: 12px; }
        .hint { display: block; margin-top: 10px; font-size: 12px; color: #444; }
      }
    </style>
  </head>
  <body>
    <div class="label">
      <div class="top">
        <div class="ticketNo">קריאה #${number}</div>
        <div class="date">${createdAt}</div>
      </div>

      <div class="grid">
        <div class="row"><div class="k">מחלקה:</div><div class="v">${department}</div></div>
        <div class="row"><div class="k">טכנאי:</div><div class="v">${assignee}</div></div>
        <div class="row" style="grid-column: 1 / -1"><div class="k">פותח:</div><div class="v" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${requester}</div></div>
      </div>

      <div class="content"><div class="v">נושא: \t</div><div class="k">${subject}</div><div class="v">\nפירוט: \t</div><div class="k">${description}</div></div>
    </div>
    <div class="hint">אם המדפסת שלך היא מדפסת מדבקות, בחר גודל נייר מתאים בחלון ההדפסה.</div>
    <script>
      window.addEventListener('load', () => {
        setTimeout(() => {
          window.focus();
          window.print();
          setTimeout(() => window.close(), 250);
        }, 50);
      });
    </script>
  </body>
</html>`;
}

export function printTicketLabel(data: TicketLabelData) {
  const html = buildLabelHtml(data);

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const w = window.open(url, "_blank", "noopener,noreferrer,width=520,height=520");
  if (!w) {
    URL.revokeObjectURL(url);
    throw new Error("Popup was blocked. Please allow popups for this site and try again.");
  }

  setTimeout(() => {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  }, 30_000);
}
