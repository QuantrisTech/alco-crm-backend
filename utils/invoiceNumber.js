const Invoice = require("../models/invoiceModel.js");
const Lead = require("../models/leadModel.js");
const Counter = require("../models/counterModel.js");

// async function invoiceNumberExists(invoiceNumber) {
//   const invoiceExists = await Invoice.findOne({ invoiceNumber }).select("_id").lean();
//   if (invoiceExists) return true;
//   const leadExists = await Lead.findOne({
//     "paymentPlan.invoiceNumber": invoiceNumber,
//   }).select("_id").lean();
//   return !!leadExists;
// }

// NAYA
async function invoiceNumberExists(invoiceNumber, excludeLeadId = null) {
    const invoiceExists = await Invoice.findOne({ invoiceNumber }).select("_id").lean();
    if (invoiceExists) return true;

    const leadQuery = { "paymentPlan.invoiceNumber": invoiceNumber };
    if (excludeLeadId) {
        leadQuery._id = { $ne: excludeLeadId };
    }

    const leadExists = await Lead.findOne(leadQuery).select("_id").lean();

    return !!leadExists;
}

const STARTING_POINT = 2092; 

async function reserveNextInvoiceNumber() {
    // ── Har baar counter ko existing max ke against sync karo ──
    // (Invoice collection + Lead.paymentPlan dono se, jaisa legacy scan karta tha)
    const [invoices, leadsWithInvoices] = await Promise.all([
        Invoice.find({ invoiceNumber: { $regex: /^\d+$/ } }).select("invoiceNumber").lean(),
        Lead.find({ "paymentPlan.invoiceNumber": { $regex: /^\d+$/ } }).select("paymentPlan.invoiceNumber").lean(),
    ]);

    let maxExisting = invoices.reduce((max, inv) => {
        const num = parseInt(inv.invoiceNumber, 10);
        return num > max ? num : max;
    }, STARTING_POINT);

    maxExisting = leadsWithInvoices.reduce((max, lead) => {
        const num = parseInt(lead.paymentPlan?.invoiceNumber, 10);
        return !isNaN(num) && num > max ? num : max;
    }, maxExisting);

    // ── Counter ko max(existing, current counter) pe sync karo ──
    const currentCounter = await Counter.findById("invoiceNumber").lean();
    if (!currentCounter || currentCounter.seq < maxExisting) {
        await Counter.findOneAndUpdate(
            { _id: "invoiceNumber" },
            { $set: { seq: maxExisting } },
            { upsert: true }
        );
    }

    // ── Ab safely increment karo ──
    let candidate;
    do {
        const counter = await Counter.findOneAndUpdate(
            { _id: "invoiceNumber" },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );
        candidate = String(counter.seq);
    } while (await invoiceNumberExists(candidate));

    return candidate;
}

module.exports = { invoiceNumberExists, reserveNextInvoiceNumber };