module.exports = `<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Payment Plan is Ready</title>
</head>

<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td
              style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%);padding:20px 25px 30px;text-align:center;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="left" style="padding-bottom:15px;">
                    <img src="https://res.cloudinary.com/dmbpjv9e8/image/upload/h_110,q_100,f_png/v1777543091/logo-white_xg7uyj.webp"
                      alt="AL&CO"
                      width="120"
                      style="height:35px;width:auto;max-width:120px;display:inline-block;border:0;outline:none;text-decoration:none;color:#ffffff;font-size:18px;font-weight:700;font-family:'Segoe UI',Arial,sans-serif;" />
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <table cellpadding="0" cellspacing="0" style="margin:0 auto 20px;">
                      <tr>
                        <td
                          style="width:54px;height:54px;background:rgba(200,168,75,0.15);border:2px solid #c8a84b;border-radius:50%;text-align:center;vertical-align:middle;font-size:24px;line-height:50px;">
                          💳</td>
                      </tr>
                    </table>
                    <h1 style="margin:0;font-size:26px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">Payment Plan
                      Ready</h1>
                    <p style="margin:10px 0 0;font-size:14px;color:#94a3b8;">Your payment schedule has been set up
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>


          <!-- Body -->
          <tr>
            <td style="padding:40px;">

              <p style="margin:0 0 20px;font-size:15px;color:#374151;">Dear <strong>{{UserName}}</strong>,</p>

              <p style="margin:0 0 28px;font-size:15px;color:#4b5563;line-height:1.7;">
                Your payment plan for <strong style="color:#1a1a2e;">{{ProgramName}}</strong> has been finalized.
                Please review the details below and complete your contract if you haven't already.
              </p>

              <!-- Payment Summary Cards -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td width="48%"
                    style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:10px;padding:20px;text-align:center;">
                    <p
                      style="margin:0 0 6px;font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;">
                      Total Amount</p>
                    <p style="margin:0;font-size:22px;font-weight:700;color:#1a1a2e;">{{TotalAmount}}</p>
                  </td>
                  <td width="4%"></td>
                  <td width="48%"
                    style="background:#fdf6e3;border:1px solid #e8d5a3;border-radius:10px;padding:20px;text-align:center;">
                    <p
                      style="margin:0 0 6px;font-size:11px;font-weight:700;color:#c8a84b;text-transform:uppercase;letter-spacing:0.1em;">
                      Advance Payment</p>
                    <p style="margin:0;font-size:22px;font-weight:700;color:#1a1a2e;">{{AdvanceAmount}}</p>
                  </td>
                </tr>
              </table>

              <!-- Installments info -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#f0f4ff;border:1px solid #c7d2fe;border-radius:10px;margin-bottom:32px;">
                <tr>
                  <td style="padding:20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:13px;color:#4b5563;">
                          <span style="font-size:18px;">📅</span>
                          &nbsp; Total <strong>{{Installments}} monthly installments</strong> after advance payment
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Info box -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#fff8e8;border-left:4px solid #c8a84b;border-radius:0 8px 8px 0;margin-bottom:32px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
                      <strong>Important:</strong> Please complete your contract and make the advance payment to confirm
                      your enrollment.
                      Your spot will be reserved once the advance is received.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                <tr>
                  <td align="center">
                    <a href="{{DashboardLink}}"
                      style="display:inline-block;background:linear-gradient(135deg,#c8a84b,#e8c96b);color:#1a1a2e;font-size:15px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:8px;letter-spacing:0.03em;">
                      View My Payment Plan →
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e5e7eb;padding:24px 40px;text-align:center;">
              <img src="https://res.cloudinary.com/dmbpjv9e8/image/upload/h_80,q_100,f_auto/v1777543090/logo_gx6cud.webp"
                alt="AL&CO"
                width="120"
                style="height:40px;width:auto;max-width:120px;display:block;margin:0 auto 8px;border:0;outline:none;text-decoration:none;color:#1a1a2e;font-size:16px;font-weight:700;font-family:'Segoe UI',Arial,sans-serif;" />
              <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;">Center for Human Brilliance & Behavioral
                Reengineering</p>
              <p style="margin:0;font-size:12px;color:#9ca3af;">Questions? Contact us at <a
                  href="mailto:{{SupportEmail}}" style="color:#EF9F27;text-decoration:none;">{{SupportEmail}}</a></p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>

</html>`;