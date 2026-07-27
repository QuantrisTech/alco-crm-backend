const cron = require("node-cron");
const { runPaymentCheck } = require("./paymentJob.js");

// ⏰ Every day at 12:00 AM
cron.schedule("0 0 * * *", async () => {
  try {
    console.log("🔄 Running Payment Cron Job...");

    await runPaymentCheck();

    console.log("✅ Payment Cron Completed");
  } catch (error) {
    console.error("❌ Payment Cron Error:", error.message);
  }
});