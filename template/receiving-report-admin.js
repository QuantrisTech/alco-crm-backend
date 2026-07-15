module.exports = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Receiving Report</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:Arial, Helvetica, sans-serif;">

<div style="width:100%;max-width:600px;margin:0 auto;background:#ffffff;">

  <!-- HEADER -->
  <div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%);padding:32px 44px;">
    <table cellpadding="0" cellspacing="0">
      <tr>
        <td style="vertical-align:middle;">
          <img src="https://res.cloudinary.com/dmbpjv9e8/image/upload/h_110,q_100,f_png/v1777543091/logo-white_xg7uyj.webp" alt="ALCO" style="height:38px;width:auto;display:block;" />
        </td>
        <td style="vertical-align:middle;padding-left:14px;">
          <div style="font-size:18px;font-weight:700;color:#ffffff;">Receiving Report</div>
          <div style="font-size:11px;color:#94a3b8;letter-spacing:0.1em;text-transform:uppercase;margin-top:2px;">Finance Department</div>
        </td>
      </tr>
    </table>
  </div>

  <div style="height:3px;background:linear-gradient(90deg,#c8a84b,#e8c96a,#c8a84b);"></div>

  <!-- BODY -->
  <div style="padding:40px 44px;text-align:center;">

    <p style="font-size:15px;color:#0f1117;font-weight:600;margin:0 0 6px;">Hi {{recipientName}},</p>
    <p style="font-size:13px;color:#4a5060;margin:0 0 6px;">
      A new receiving report has been generated.
    </p>
    <p style="font-size:12px;color:#8a92a6;margin:0 0 32px;">
      Range: <strong style="color:#0f1117;">{{dateRange}}</strong>
      &nbsp;·&nbsp;
      Invoices: <strong style="color:#0f1117;">{{invoiceCount}}</strong>
      &nbsp;·&nbsp;
      Generated: <strong style="color:#0f1117;">{{generatedDate}}</strong>
    </p>

    <!-- DOWNLOAD BUTTONS -->
    <table cellpadding="0" cellspacing="0" align="center" style="margin:0 auto;">
      <tr>
        <td style="padding:0 8px;">
          <a href="{{excelUrl}}"
             style="display:inline-block;padding:16px 32px;background:linear-gradient(135deg,#1a1a2e 0%,#0f3460 100%);color:#ffffff;text-decoration:none;font-family:Calibri,Arial,sans-serif;font-size:14px;font-weight:700;border-radius:12px;letter-spacing:0.03em;">
            ⬇&nbsp;&nbsp;Download Excel
          </a>
        </td>
        <td style="padding:0 8px;">
          <a href="{{pdfUrl}}"
             style="display:inline-block;padding:16px 32px;background:#ffffff;color:#1a1a2e;text-decoration:none;font-family:Calibri,Arial,sans-serif;font-size:14px;font-weight:700;border-radius:12px;letter-spacing:0.03em;border:2px solid #c8a84b;">
            ⬇&nbsp;&nbsp;Download PDF
          </a>
        </td>
      </tr>
    </table>

    <p style="font-size:11px;color:#8a92a6;margin-top:16px;">
      Links 24 ghante ke liye valid hain.
    </p>

  </div>

  <div style="height:3px;background:linear-gradient(90deg,#c8a84b,#e8c96a,#c8a84b);"></div>
  <div style="background:#f4f6fb;padding:18px 44px;font-size:11px;color:#8a92a6;text-align:center;">
    Arslan Larik &amp; Company &nbsp;|&nbsp; Finance Department &nbsp;|&nbsp; NTN: 2826497-5
  </div>

</div>
</body>
</html>
`;

// module.exports = `
// <!DOCTYPE html>
// <html lang="en">
// <head>
// <meta charset="UTF-8"/>
// <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
// <title>Receiving Report</title>
// </head>
// <body style="margin:0;padding:0;background:#f4f6fb;font-family:Arial, Helvetica, sans-serif;">

// <div style="width:100%;max-width:860px;margin:0 auto;background:#ffffff;">

//   <!-- HEADER -->
//   <div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%);padding:32px 44px;">
//     <table cellpadding="0" cellspacing="0">
//       <tr>
//         <td style="vertical-align:middle;">
//           <img src="https://res.cloudinary.com/dmbpjv9e8/image/upload/h_110,q_100,f_png/v1777543091/logo-white_xg7uyj.webp" alt="ALCO" style="height:38px;width:auto;display:block;" />
//         </td>
//         <td style="vertical-align:middle;padding-left:14px;">
//           <div style="font-size:18px;font-weight:700;color:#ffffff;">Receiving Report</div>
//           <div style="font-size:11px;color:#94a3b8;letter-spacing:0.1em;text-transform:uppercase;margin-top:2px;">Finance Department</div>
//         </td>
//       </tr>
//     </table>
//   </div>

//   <div style="height:3px;background:linear-gradient(90deg,#c8a84b,#e8c96a,#c8a84b);"></div>

//   <!-- META -->
//   <div style="padding:24px 44px 0;">
//     <table width="100%" cellpadding="0" cellspacing="0">
//       <tr>
//         <td style="font-size:12px;color:#8a92a6;">
//           Generated on <strong style="color:#0f1117;">{{generatedDate}}</strong>
//           &nbsp;|&nbsp; Range: <strong style="color:#0f1117;">{{dateRange}}</strong>
//           &nbsp;|&nbsp; Total Invoices: <strong style="color:#0f1117;">{{invoiceCount}}</strong>
//         </td>
//       </tr>
//     </table>
//   </div>

//   <!-- BODY -->
//   <div style="padding:24px 44px 32px;">

//     <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #dde2ec;border-radius:12px;overflow:hidden;border-collapse:collapse;">
//       <thead>
//         <tr style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%);">
//           <th style="padding:10px 12px;text-align:left;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#94a3b8;">Invoice #</th>
//           <th style="padding:10px 12px;text-align:left;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#94a3b8;">Student</th>
//           <th style="padding:10px 12px;text-align:left;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#94a3b8;">Program</th>
//           <th style="padding:10px 12px;text-align:right;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#94a3b8;">Total</th>
//           <th style="padding:10px 12px;text-align:right;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#94a3b8;">Paid</th>
//           <th style="padding:10px 12px;text-align:right;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#94a3b8;">Remaining</th>
//           <th style="padding:10px 12px;text-align:center;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#94a3b8;">Status</th>
//         </tr>
//       </thead>
//       <tbody>
//         {{invoiceRows}}
//       </tbody>
//     </table>

//     <!-- SUMMARY -->
//     <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
//       <tr>
//         <td></td>
//         <td style="width:320px;">
//           <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #dde2ec;border-radius:14px;overflow:hidden;border-collapse:collapse;">
//             <tr style="border-bottom:1px solid #dde2ec;">
//               <td style="padding:11px 18px;font-size:13px;color:#4a5060;font-weight:500;">Total Invoiced</td>
//               <td style="padding:11px 18px;text-align:right;font-family:'Courier New',monospace;font-weight:600;color:#0f1117;font-size:13px;">Rs {{totalInvoiced}}</td>
//             </tr>
//             <tr style="border-bottom:1px solid #dde2ec;">
//               <td style="padding:11px 18px;font-size:13px;color:#4a5060;font-weight:500;">Total Received</td>
//               <td style="padding:11px 18px;text-align:right;font-family:'Courier New',monospace;font-weight:600;color:#1a8a57;font-size:13px;">Rs {{totalReceived}}</td>
//             </tr>
//             <tr style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%);">
//               <td style="padding:11px 18px;font-size:14px;color:#94a3b8;font-weight:600;">Total Outstanding</td>
//               <td style="padding:11px 18px;text-align:right;font-family:'Courier New',monospace;font-weight:700;color:#ffffff;font-size:15px;">Rs {{totalOutstanding}}</td>
//             </tr>
//           </table>
//         </td>
//       </tr>
//     </table>


//     <!-- DOWNLOAD BUTTON -->
//     <div style="text-align:center;margin:28px 0 8px;">
//       <a href="{{downloadUrl}}" 
//          style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#1a1a2e 0%,#0f3460 100%);color:#ffffff;text-decoration:none;font-family:Calibri,Arial,sans-serif;font-size:14px;font-weight:700;border-radius:10px;letter-spacing:0.04em;">
//         ⬇&nbsp; Download Excel Report
//       </a>
//       <p style="font-size:11px;color:#8a92a6;margin-top:10px;">
//         Link 24 ghante ke liye valid hai. Ek baar click karte hi Excel download ho jayegi.
//       </p>
//     </div>


//     <div style="margin-top:20px;font-size:11px;color:#8a92a6;">
//       This is a system-generated report. Full data exported as attachment if applicable.
//     </div>

//   </div>

//   <div style="height:3px;background:linear-gradient(90deg,#c8a84b,#e8c96a,#c8a84b);"></div>
//   <div style="background:#f4f6fb;padding:18px 44px;font-size:11px;color:#8a92a6;text-align:center;">
//     Arslan Larik &amp; Company &nbsp;|&nbsp; Finance Department &nbsp;|&nbsp; NTN: 2826497-5
//   </div>

// </div>
// </body>
// </html>
// `;