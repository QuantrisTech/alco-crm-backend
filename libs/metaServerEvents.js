// libs/metaServerEvents.js — Backend (Node/Express, CommonJS)
const crypto = require("crypto");

const CAPI_ENDPOINT = process.env.WEBSITE_CAPI_URL || "https://arslanlarik.com/api/fb-conversion";
const INTERNAL_SECRET = process.env.INTERNAL_CAPI_SECRET;

async function sendServerSideStageEvent({ lead, eventName, value }) {
    if (!lead.email && !lead.phone) {
        console.warn(`[Meta CAPI] Lead ${lead._id} has no email/phone — skipping ${eventName}`);
        return;
    }
    if (!lead.fbc) {
        console.warn(`[Meta CAPI] Lead ${lead._id} has no fbc — event will still send, attribution weaker`);
    }

    const eventId = crypto.randomUUID();

    try {
        const res = await fetch(CAPI_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(INTERNAL_SECRET && { "x-internal-secret": INTERNAL_SECRET }),
            },
            body: JSON.stringify({
                eventName,
                eventId,
                eventSourceUrl: "https://arslanlarik.com",
                email: lead.email,
                phone: lead.phone,
                firstName: lead.first_name,
                lastName: lead.last_name,
                fbc: lead.fbc || undefined,
                fbp: lead.fbp || undefined,
                actionSource: "system_generated",
                ...(value ? { customData: { value, currency: "USD" } } : {}),
            }),
        });

        const result = await res.json();
        console.log(`[Meta CAPI] ${eventName} sent for lead ${lead._id}`, result);
        return result;
    } catch (err) {
        console.error(`[Meta CAPI] ${eventName} failed for lead ${lead._id}:`, err.message);
    }
}

module.exports = { sendServerSideStageEvent };