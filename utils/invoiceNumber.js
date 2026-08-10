const Counter = require("../models/counterModel.js");
const Invoice = require("../models/invoiceModel.js");
const Lead = require("../models/leadModel.js");

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

async function reserveNextInvoiceNumber() {
    let candidate;
    do {
        const counter = await Counter.findOneAndUpdate(
            { _id: "invoiceNumber" },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );
        candidate = String(counter.seq);
    } while (await invoiceNumberExists(candidate)); // legacy/manual clash ke against safety
    return candidate;
}

module.exports = { invoiceNumberExists, reserveNextInvoiceNumber };