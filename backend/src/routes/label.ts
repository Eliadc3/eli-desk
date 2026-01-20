import { Router } from "express";
import QRCode from "qrcode";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../lib/httpError.js";

export const labelRouter = Router();

// GET /label/:id?size=a6|small
labelRouter.get("/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const size = (req.query.size as string | undefined) ?? "a6";

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: { org: true, requester: true, assignee: true },
    });
    if (!ticket) throw new HttpError(404, "Ticket not found");

    const publicUrl = `${req.protocol}://${req.get("host")}/tickets/${ticket.id}`;
    const qrDataUrl = await QRCode.toDataURL(publicUrl, { margin: 1, scale: 6 });

    const isSmall = size === "small";
    const width = isSmall ? "62mm" : "148mm";
    const height = isSmall ? "29mm" : "105mm";

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(`<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Ticket Label</title>
  <style>
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial; padding:16px;}
    .label{border:1px solid #111; border-radius:10px; width:${width}; height:${height}; padding:10px; display:flex; gap:12px; box-sizing:border-box;}
    .left{flex:1; min-width:0;}
    .row{display:flex; gap:10px; font-size:${isSmall ? "10px" : "14px"}; line-height:1.25;}
    .k{font-weight:700; white-space:nowrap;}
    .v{min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;}
    .subject{font-size:${isSmall ? "12px" : "18px"}; font-weight:800; margin-bottom:6px;}
    .qr{width:${isSmall ? "24mm" : "40mm"}; height:auto; align-self:center;}
    @media print{
      body{padding:0; margin:0;}
      .no-print{display:none;}
      .label{border:1px solid #000; margin:0;}
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom:10px; display:flex; gap:8px;">
    <button onclick="window.print()">Print</button>
    <a href="${publicUrl}" target="_blank" rel="noreferrer">Open Ticket</a>
  </div>

  <div class="label">
    <div class="left">
      <div class="subject">${escapeHtml(`#${ticket.number} ${ticket.subject}`)}</div>
      <div class="row"><div class="k">Priority</div><div class="v">${ticket.priority}</div></div>
      <div class="row"><div class="k">Status</div><div class="v">${ticket.status}</div></div>
      <div class="row"><div class="k">Org</div><div class="v">${escapeHtml(ticket.org?.name ?? "-")}</div></div>
      <div class="row"><div class="k">Requester</div><div class="v">${escapeHtml(ticket.requester?.name ?? "-")}</div></div>
      <div class="row"><div class="k">Assignee</div><div class="v">${escapeHtml(ticket.assignee?.name ?? "-")}</div></div>
      <div class="row"><div class="k">Created</div><div class="v">${new Date(ticket.createdAt).toLocaleString()}</div></div>
    </div>
    <img class="qr" src="${qrDataUrl}" alt="QR"/>
  </div>
</body>
</html>`);
  } catch (e) {
    next(e);
  }
});

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
