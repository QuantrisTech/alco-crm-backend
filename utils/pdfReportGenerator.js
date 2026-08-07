// utils/pdfReportGenerator.js
const PDFDocument = require("pdfkit");

const PAGE_WIDTH = 545; // usable width (A4 minus margins)
const LEFT = 50;
const RIGHT = 545;

const formatMoney = (n) => {
  const num = Number(n || 0);
  const sign = num < 0 ? "-" : "";
  return `${sign}Rs ${Math.abs(num).toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// ── Common header ──────────────────────────────────────────────
function addHeader(doc, companyName, reportTitle, subtitle) {
  doc.font("Helvetica-Bold").fontSize(16).fillColor("#111").text(companyName, LEFT, 50);
  doc.font("Helvetica").fontSize(9).fillColor("#888").text("CRM of the company", LEFT, doc.y + 2);

  doc.moveDown(0.8);
  doc.font("Helvetica-Bold").fontSize(13).fillColor("#111").text(reportTitle, LEFT);
  if (subtitle) {
    doc.font("Helvetica").fontSize(9).fillColor("#666").text(subtitle, LEFT, doc.y + 2);
  }

  doc.moveDown(1);
  doc.moveTo(LEFT, doc.y).lineTo(RIGHT, doc.y).lineWidth(0.5).strokeColor("#333").stroke();
  doc.moveDown(0.7);
}

// ── One line item row (code + name .... amount) ────────────────
function addLine(doc, { code, name, amount, indent = 12, bold = false, color = "#222" }) {
  const y = doc.y;
  doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(9.5).fillColor(color);

  const label = code ? `${code}   ${name}` : name;
  doc.text(label, LEFT + indent, y, { width: 320 });
  doc.text(formatMoney(amount), LEFT, y, { width: PAGE_WIDTH - LEFT, align: "right" });
  doc.moveDown(0.55);
}

// ── Section title (Assets / Liabilities / Equity) ──────────────
function addSectionHeading(doc, title) {
  doc.font("Helvetica-Bold").fontSize(10.5).fillColor("#111").text(title, LEFT, doc.y);
  doc.moveDown(0.4);
}

// ── Subtotal row with top border ───────────────────────────────
function addSubtotal(doc, label, amount, { indent = 12 } = {}) {
  doc.moveTo(LEFT + indent, doc.y).lineTo(RIGHT, doc.y).lineWidth(0.5).strokeColor("#ccc").stroke();
  doc.moveDown(0.25);
  addLine(doc, { name: label, amount, indent, bold: true });
}

function addDoubleLine(doc) {
  doc.moveTo(LEFT, doc.y).lineTo(RIGHT, doc.y).lineWidth(0.75).strokeColor("#111").stroke();
  doc.moveDown(0.15);
  doc.moveTo(LEFT, doc.y).lineTo(RIGHT, doc.y).lineWidth(0.75).strokeColor("#111").stroke();
  doc.moveDown(0.5);
}

function checkPageBreak(doc, neededSpace = 100) {
  if (doc.y + neededSpace > doc.page.height - 50) {
    doc.addPage();
  }
}

// ── Balance Sheet PDF ────────────────────────────────────────────
function buildBalanceSheetPDF(res, data, mode) {
  const doc = new PDFDocument({ margin: 50, size: "A4" });
  const filename = `balance-sheet-${new Date(data.asOf).toISOString().slice(0, 10)}.pdf`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `${mode === "download" ? "attachment" : "inline"}; filename="${filename}"`
  );
  doc.pipe(res);

  addHeader(
    doc,
    "Arslan Larik & Company",
    "Balance Sheet",
    `As of: ${new Date(data.asOf).toLocaleDateString("en-GB")}`
  );

  // ── Assets ──
  addSectionHeading(doc, "Assets");
  data.assets.lines.forEach(a => addLine(doc, { code: a.code, name: a.name, amount: a.balance }));
  addSubtotal(doc, "Total Assets", data.assets.total);
  doc.moveDown(0.8);

  checkPageBreak(doc);

  // ── Liabilities ──
  addSectionHeading(doc, "Liabilities");
  data.liabilities.lines.forEach(a => addLine(doc, { code: a.code, name: a.name, amount: a.balance }));
  addSubtotal(doc, "Total Liabilities", data.liabilities.total);
  doc.moveDown(0.8);

  checkPageBreak(doc);

  // ── Equity ──
  addSectionHeading(doc, "Equity");
  data.equity.lines.forEach(a => addLine(doc, { code: a.code, name: a.name, amount: a.balance }));
  addSubtotal(doc, "Total Equity", data.equity.total);
  doc.moveDown(1);

  checkPageBreak(doc, 120);

  // ── Grand totals ──
  addDoubleLine(doc);
  addLine(doc, { name: "Total Liabilities + Equity", amount: data.totalLiabilitiesAndEquity, indent: 0, bold: true });
  addLine(doc, { name: "Total Assets", amount: data.assets.total, indent: 0, bold: true });
  doc.moveDown(0.5);

  doc.font("Helvetica-Bold").fontSize(9.5)
     .fillColor(data.isBalanced ? "#1a7f37" : "#c0342c")
     .text(data.isBalanced ? "✓ Balanced" : "⚠ Not Balanced", LEFT, doc.y);

  doc.end();
}

// ── Profit & Loss PDF ────────────────────────────────────────────
function buildProfitLossPDF(res, data, mode) {
  const doc = new PDFDocument({ margin: 50, size: "A4" });
  const filename = `profit-loss-${new Date(data.period.from).toISOString().slice(0, 10)}.pdf`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `${mode === "download" ? "attachment" : "inline"}; filename="${filename}"`
  );
  doc.pipe(res);

  addHeader(
    doc,
    "Arslan Larik & Company",
    "Profit & Loss Statement",
    `Period: ${new Date(data.period.from).toLocaleDateString("en-GB")} - ${new Date(data.period.to).toLocaleDateString("en-GB")}`
  );

  addSectionHeading(doc, "Income");
  data.income.lines.forEach(a => addLine(doc, { code: a.code, name: a.name, amount: a.amount }));
  addSubtotal(doc, "Total Income", data.income.total);
  doc.moveDown(0.8);

  checkPageBreak(doc);

  addSectionHeading(doc, "Expenses");
  data.expenses.lines.forEach(a => addLine(doc, { code: a.code, name: a.name, amount: a.amount }));
  addSubtotal(doc, "Total Expenses", data.expenses.total);
  doc.moveDown(1);

  checkPageBreak(doc, 100);

  addDoubleLine(doc);
  addLine(doc, {
    name: `Net ${data.netProfit >= 0 ? "Profit" : "Loss"}`,
    amount: Math.abs(data.netProfit),
    indent: 0,
    bold: true,
    color: data.netProfit >= 0 ? "#1a7f37" : "#c0342c",
  });
  addLine(doc, { name: "Profit Margin", amount: `${data.profitMargin}%`, indent: 0, bold: true });

  doc.end();
}

module.exports = { buildBalanceSheetPDF, buildProfitLossPDF };