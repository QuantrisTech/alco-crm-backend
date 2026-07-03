module.exports = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Contract Received</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%);padding:40px 40px 30px;text-align:center;">
              <div style="width:64px;height:64px;background:rgba(200,168,75,0.15);border:2px solid #c8a84b;border-radius:50%;margin:0 auto 20px;line-height:64px;text-align:center;font-size:28px;">✅</div>
              <h1 style="margin:0;font-size:26px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">Contract Received!</h1>
              <p style="margin:10px 0 0;font-size:14px;color:#94a3b8;">Thank you for completing your agreement</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">

              <p style="margin:0 0 20px;font-size:15px;color:#374151;">Dear <strong>{{UserName}}</strong>,</p>

              <p style="margin:0 0 28px;font-size:15px;color:#4b5563;line-height:1.7;">
                We have successfully received your signed contract for 
                <strong style="color:#1a1a2e;">{{ProgramName}}</strong>. 
                Our team will review it shortly and get back to you with the next steps.
              </p>

              <!-- Status Timeline -->
              <p style="margin:0 0 16px;font-size:13px;font-weight:700;color:#1a1a2e;text-transform:uppercase;letter-spacing:0.08em;">Your Enrollment Status:</p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">

                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;">
                    <table cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td width="36">
                          <div style="width:28px;height:28px;background:#dcfce7;border-radius:50%;text-align:center;line-height:28px;font-size:13px;">✓</div>
                        </td>
                        <td style="padding-left:12px;">
                          <p style="margin:0;font-size:14px;font-weight:600;color:#166534;">Application Submitted</p>
                          <p style="margin:2px 0 0;font-size:12px;color:#9ca3af;">Completed</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;">
                    <table cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td width="36">
                          <div style="width:28px;height:28px;background:#dcfce7;border-radius:50%;text-align:center;line-height:28px;font-size:13px;">✓</div>
                        </td>
                        <td style="padding-left:12px;">
                          <p style="margin:0;font-size:14px;font-weight:600;color:#166534;">Shortlisted</p>
                          <p style="margin:2px 0 0;font-size:12px;color:#9ca3af;">Completed</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;">
                    <table cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td width="36">
                          <div style="width:28px;height:28px;background:#dcfce7;border-radius:50%;text-align:center;line-height:28px;font-size:13px;">✓</div>
                        </td>
                        <td style="padding-left:12px;">
                          <p style="margin:0;font-size:14px;font-weight:600;color:#166534;">Contract Signed</p>
                          <p style="margin:2px 0 0;font-size:12px;color:#9ca3af;">Completed — Just now</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;">
                    <table cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td width="36">
                          <div style="width:28px;height:28px;background:#fef3c7;border:2px solid #c8a84b;border-radius:50%;text-align:center;line-height:24px;font-size:13px;">⏳</div>
                        </td>
                        <td style="padding-left:12px;">
                          <p style="margin:0;font-size:14px;font-weight:600;color:#92400e;">Advance Payment</p>
                          <p style="margin:2px 0 0;font-size:12px;color:#9ca3af;">Pending — Next step</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding:12px 0;">
                    <table cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td width="36">
                          <div style="width:28px;height:28px;background:#f3f4f6;border-radius:50%;text-align:center;line-height:28px;font-size:13px;color:#9ca3af;">○</div>
                        </td>
                        <td style="padding-left:12px;">
                          <p style="margin:0;font-size:14px;font-weight:600;color:#9ca3af;">Enrollment Active</p>
                          <p style="margin:2px 0 0;font-size:12px;color:#9ca3af;">Awaiting payment</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>

              <!-- Info box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4ff;border:1px solid #c7d2fe;border-radius:10px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#3730a3;">What happens next?</p>
                    <p style="margin:0;font-size:13px;color:#4b5563;line-height:1.7;">
                      Our team will review your contract and contact you regarding the advance payment. 
                      Once the advance is received, your enrollment will be activated and you'll get full access to the program.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.7;">
                If you have any questions, feel free to reach out to us at 
                <a href="mailto:{{SupportEmail}}" style="color:#c8a84b;text-decoration:none;font-weight:600;">{{SupportEmail}}</a>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e5e7eb;padding:24px 40px;text-align:center;">
              <img src="https://res.cloudinary.com/dmbpjv9e8/image/upload/h_80,q_100,f_auto/v1777543090/logo_gx6cud.webp"
                alt="AL&CO"
                width="120"
                style="height:40px;width:auto;max-width:120px;display:block;margin:0 auto 8px;border:0;outline:none;text-decoration:none;color:#1a1a2e;font-size:16px;font-weight:700;font-family:'Segoe UI',Arial,sans-serif;" />
              <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;">Center for Human Brilliance & Behavioral Reengineering</p>
              <p style="margin:0;font-size:12px;color:#9ca3af;">Questions? Contact us at <a href="mailto:{{SupportEmail}}" style="color:#c8a84b;text-decoration:none;">{{SupportEmail}}</a></p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;