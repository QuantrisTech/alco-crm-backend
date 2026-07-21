// // utils/postPaymentJournal.js
// const JournalEntry = require("../models/journalEntryModel.js");
// const Account = require("../models/accountModel.js");

// /**
//  * Auto-post a journal entry when a payment is approved.
//  *
//  * DEBIT  → Bank / Cash account  (money received)
//  * CREDIT → Accounts Receivable  (student's balance reduces)
//  *
//  * @param {Object} opts
//  * @param {Number}   opts.amount
//  * @param {String}   opts.method        — "cash" | "bank" | "cheque" | "manual"
//  * @param {ObjectId} opts.paymentId     — Payment._id (sourceRef)
//  * @param {ObjectId} opts.userId        — who approved
//  * @param {String}   opts.description   — human-readable label
//  * @param {Object}   opts.session       — mongoose session (optional)
//  */
// exports.postPaymentJournal = async ({
//   amount,
//   method,
//   paymentId,
//   userId,
//   description,
//   session,
// }) => {
//   // ── Pick debit account based on payment method ────────────
//   // cash → 1001 Cash in Hand
//   // bank / cheque / manual → 1002 Bank Account (HBL)
//   const debitCode = method === "cash" ? "1001" : "1002";

//   const debitAccount    = await Account.findOne({ code: debitCode,  isActive: true });
//   const creditAccount   = await Account.findOne({ code: "1100",     isActive: true }); // Accounts Receivable

//   // Silently skip if accounts not seeded yet
//   if (!debitAccount || !creditAccount) {
//     console.warn("postPaymentJournal: accounts not found — seed first");
//     return null;
//   }

//   const entryData = {
//     description: description || "Payment received",
//     date: new Date(),
//     lines: [
//       {
//         account:     debitAccount._id,
//         type:        "debit",
//         amount,
//         description: `Payment received via ${method}`,
//       },
//       {
//         account:     creditAccount._id,
//         type:        "credit",
//         amount,
//         description: `Student receivable cleared`,
//       },
//     ],
//     sourceType: "payment",
//     sourceRef:  paymentId,
//     entryType:  "auto",
//     status:     "posted",
//     createdBy:  userId,
//   };

//   const opts = session ? { session } : {};
//   const entry = await JournalEntry.create([entryData], opts);

//   // ── Update running balances ───────────────────────────────
//   // Debit  → asset account → balance increases
//   // Credit → asset account (receivable) → balance decreases
//   debitAccount.currentBalance  += amount;
//   creditAccount.currentBalance -= amount;

//   if (session) {
//     await debitAccount.save({ session });
//     await creditAccount.save({ session });
//   } else {
//     await debitAccount.save();
//     await creditAccount.save();
//   }

//   return entry[0];
// };

// /**
//  * Auto-post journal entry when an Invoice is created.
//  *
//  * DEBIT  → Accounts Receivable  (student owes us)
//  * CREDIT → Tuition Fee Income   (revenue recognized)
//  *
//  * @param {Object} opts
//  * @param {Number}   opts.amount
//  * @param {ObjectId} opts.invoiceId
//  * @param {ObjectId} opts.userId
//  * @param {String}   opts.description
//  * @param {Object}   opts.session
//  */
// exports.postInvoiceJournal = async ({
//   amount,
//   invoiceId,
//   userId,
//   description,
//   session,
// }) => {
//   const receivableAccount = await Account.findOne({ code: "1100", isActive: true });
//   const incomeAccount     = await Account.findOne({ code: "4001", isActive: true }); // Tuition Fee Income

//   if (!receivableAccount || !incomeAccount) {
//     console.warn("postInvoiceJournal: accounts not found — seed first");
//     return null;
//   }

//   const entryData = {
//     description: description || "Invoice created",
//     date: new Date(),
//     lines: [
//       {
//         account:     receivableAccount._id,
//         type:        "debit",
//         amount,
//         description: "Student fee receivable",
//       },
//       {
//         account:     incomeAccount._id,
//         type:        "credit",
//         amount,
//         description: "Tuition fee income recognized",
//       },
//     ],
//     sourceType: "invoice",
//     sourceRef:  invoiceId,
//     entryType:  "auto",
//     status:     "posted",
//     createdBy:  userId,
//   };

//   const opts = session ? { session } : {};
//   const entry = await JournalEntry.create([entryData], opts);

//   // Update balances
//   receivableAccount.currentBalance += amount; // asset debit increases
//   incomeAccount.currentBalance     += amount; // income credit increases

//   if (session) {
//     await receivableAccount.save({ session });
//     await incomeAccount.save({ session });
//   } else {
//     await receivableAccount.save();
//     await incomeAccount.save();
//   }

//   return entry[0];
// };

// utils/postPaymentJournal.js
const JournalEntry = require("../models/journalEntryModel.js");
const Account = require("../models/accountModel.js");
const generateUniqueNumber = require("./generateUniqueNumber.js");

// exports.postInvoiceJournal = async ({

exports.postInvoiceJournal = async ({
  amount, invoiceId, userId, description, session, date
}) => {
  const receivableAccount = await Account.findOne({ code: "1100", isActive: true }).session(session);
  const incomeAccount = await Account.findOne({ code: "4001", isActive: true }).session(session);

  if (!receivableAccount || !incomeAccount) {
    console.warn("postInvoiceJournal: accounts not found — seed first");
    return null;
  }

  const entryDate = date || new Date();
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);


  if (absAmount === 0) return null;

  const entryData = {
    description: description || "Invoice created",
    date: entryDate,
    lines: isNegative
      ? [
        { account: incomeAccount._id, type: "debit", amount: absAmount, description: "Tuition fee income decreased" },
        { account: receivableAccount._id, type: "credit", amount: absAmount, description: "Student fee receivable decreased" },
      ]
      : [
        { account: receivableAccount._id, type: "debit", amount: absAmount, description: "Student fee receivable" },
        { account: incomeAccount._id, type: "credit", amount: absAmount, description: "Tuition fee income recognized" },
      ],
    sourceType: "invoice",
    sourceRef: invoiceId,
    entryType: "auto",
    status: "posted",
    createdBy: userId,
    entryNumber: generateUniqueNumber("JE"),
    isReversal: false,
    originalJournal: null,
    period: {
      month: entryDate.getMonth() + 1,
      year: entryDate.getFullYear(),
    },
  };

  const opts = session ? { session } : {};
  const entry = await JournalEntry.create([entryData], opts);

  console.log("Journal Entry:");
  console.log(JSON.stringify(entryData, null, 2));

  console.log("Receivable Before:", receivableAccount.currentBalance);
  console.log("Income Before:", incomeAccount.currentBalance);

  if (isNegative) {
    receivableAccount.currentBalance -= absAmount;
    incomeAccount.currentBalance -= absAmount;
  } else {
    receivableAccount.currentBalance += absAmount;
    incomeAccount.currentBalance += absAmount;
  }

  console.log("Receivable After:", receivableAccount.currentBalance);
  console.log("Income After:", incomeAccount.currentBalance);

  console.log("Skipping JournalEntry.create()");
  console.log("Skipping Account.save()");

  // return null;

  if (session) {
    await receivableAccount.save({ session });
    await incomeAccount.save({ session });
  } else {
    await receivableAccount.save();
    await incomeAccount.save();
  }

  return entry[0];
};