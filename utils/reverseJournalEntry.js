// utils/reverseJournalEntry.js
const Account = require("../models/accountModel.js");
const JournalEntry = require("../models/journalEntryModel.js");
const generateUniqueNumber = require("./generateUniqueNumber.js");

/**
 * Kisi bhi sourceType+sourceRef ki posted journal entry(s) ko reverse karta hai.
 * Debit/Credit flip karke naya entry post karta hai, aur Account.currentBalance
 * ko wapas adjust karta hai. Original entry ko status "reversed" mark karta hai.
 */
async function reverseJournalEntry({ sourceType, sourceRef, userId, description, session }) {
  const originalEntries = await JournalEntry.find({
    sourceType,
    sourceRef,
    status: "posted",
  }).session(session);

  if (!originalEntries.length) return [];

  const reversedEntries = [];

  for (const original of originalEntries) {
    const flippedLines = original.lines.map((line) => ({
      account: line.account,
      type: line.type === "debit" ? "credit" : "debit",
      amount: line.amount,
      description: line.description,
    }));

    const reversal = await JournalEntry.create(
      [
        {
          description: description || `Reversal of ${original.description}`,
          date: new Date(),
          lines: flippedLines,
          sourceType,
          sourceRef,
          entryType: "auto",
          status: "posted",
          createdBy: userId,
          entryNumber: generateUniqueNumber("JE-REV"),
          period: {
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
          },
          notes: `Reversal of entry ${original.entryNumber}`,
        },
      ],
      { session }
    );

    // ── Account balances wapas adjust karo ──────────────────────
    for (const line of flippedLines) {
      const account = await Account.findById(line.account).session(session);
      if (!account) continue;

      const isDebitNormal = ["asset", "expense"].includes(account.type);
      const delta =
        line.type === "debit"
          ? isDebitNormal
            ? line.amount
            : -line.amount
          : isDebitNormal
          ? -line.amount
          : line.amount;

      account.currentBalance += delta;
      await account.save({ session });
    }

    // ── Original entry ko reversed mark karo ────────────────────
    original.status = "reversed";
    original.reversedBy = reversal[0]._id;
    await original.save({ session });

    reversedEntries.push(reversal[0]);
  }

  return reversedEntries;
}

module.exports = reverseJournalEntry;