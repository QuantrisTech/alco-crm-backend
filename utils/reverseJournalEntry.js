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
    isReversal: false,
  }).session(session);

  console.log("Found posted entries:", originalEntries.length);

  originalEntries.forEach((je) => {
    console.log({
      entryNumber: je.entryNumber,
      status: je.status,
      sourceRef: je.sourceRef.toString(),
      lines: je.lines.map(l => ({
        type: l.type,
        amount: l.amount,
      })),
    });
  });

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

          // ✅ ADD THESE TWO LINES
          isReversal: true,
          originalJournal: original._id,

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
    // for (const line of flippedLines) {
    //   const account = await Account.findById(line.account).session(session);
    //   if (!account) continue;

    //   const isDebitNormal = ["asset", "expense"].includes(account.type);
    //   const delta =
    //     line.type === "debit"
    //       ? isDebitNormal
    //         ? line.amount
    //         : -line.amount
    //       : isDebitNormal
    //       ? -line.amount
    //       : line.amount;

    //   account.currentBalance += delta;
    //   await account.save({ session });
    // }

    for (const line of flippedLines) {
      const account = await Account.findById(line.account).session(session);

      if (!account) {
        console.log("Account NOT FOUND:", line.account);
        continue;
      }

      console.log("--------------------------------");
      console.log("Account:", account.code);
      console.log("Type:", account.type);
      console.log("Line Type:", line.type);
      console.log("Amount:", line.amount);
      console.log("Before:", account.currentBalance);

      const isDebitNormal = ["asset", "expense"].includes(account.type);

      const delta =
        line.type === "debit"
          ? (isDebitNormal ? line.amount : -line.amount)
          : (isDebitNormal ? -line.amount : line.amount);

      console.log("Delta:", delta);

      account.currentBalance += delta;

      console.log("After:", account.currentBalance);

      await account.save({ session });

      const verify = await Account.findById(account._id).session(session);

      console.log("================================");
      console.log("Saved Account:", verify.code);
      console.log("Saved Balance:", verify.currentBalance);
      console.log("================================");

      console.log("Skipping save()");
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