module.exports = `<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You've Been Shortlisted!</title>
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
                          🎉</td>
                      </tr>
                    </table>
                    <h1 style="margin:0;font-size:26px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">You've Been
                      Shortlisted!</h1>
                    <p style="margin:10px 0 0;font-size:14px;color:#94a3b8;">Great news — your application has been reviewed
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
              <p style="margin:0 0 24px;font-size:15px;color:#4b5563;line-height:1.7;">
                Congratulations! We are pleased to inform you that you have been <strong
                  style="color:#1a1a2e;">shortlisted for {{ProgramName}}</strong>.
                Our team has reviewed your application and we'd love to have you on board.
              </p>

              <!-- Highlight Box -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#fdf6e3;border:1px solid #e8d5a3;border-radius:12px;margin-bottom:28px;">
                <tr>
                  <td style="padding:24px;">
                    <p
                      style="margin:0 0 8px;font-size:12px;font-weight:700;color:#c8a84b;text-transform:uppercase;letter-spacing:0.1em;">
                      Next Step Required</p>
                    <p style="margin:0;font-size:15px;color:#1a1a2e;font-weight:600;">Complete Your Contract & Personal
                      Details</p>
                    <p style="margin:8px 0 0;font-size:13px;color:#6b7280;line-height:1.6;">
                      To confirm your enrollment, please fill in your contract details and sign the agreement.
                      This only takes a few minutes.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Steps -->
              <p
                style="margin:0 0 16px;font-size:13px;font-weight:700;color:#1a1a2e;text-transform:uppercase;letter-spacing:0.08em;">
                What to do next:</p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td
                          style="width:32px;height:32px;background:#1a1a2e;border-radius:50%;text-align:center;vertical-align:middle;font-size:13px;font-weight:700;color:#c8a84b;">
                          1</td>
                        <td style="padding-left:14px;font-size:14px;color:#374151;">Log in to your dashboard</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td
                          style="width:32px;height:32px;background:#1a1a2e;border-radius:50%;text-align:center;vertical-align:middle;font-size:13px;font-weight:700;color:#c8a84b;">
                          2</td>
                        <td style="padding-left:14px;font-size:14px;color:#374151;">Fill in your contract & personal
                          details</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td
                          style="width:32px;height:32px;background:#1a1a2e;border-radius:50%;text-align:center;vertical-align:middle;font-size:13px;font-weight:700;color:#c8a84b;">
                          3</td>
                        <td style="padding-left:14px;font-size:14px;color:#374151;">Sign the agreement & submit</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td align="center">
                    <a href="{{ContractLink}}"
                      style="display:inline-block;background:linear-gradient(135deg,#c8a84b,#e8c96b);color:#1a1a2e;font-size:15px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:8px;letter-spacing:0.03em;">
                      Complete My Contract →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 6px;font-size:13px;color:#9ca3af;text-align:center;">
                If the button doesn't work, copy this link:
              </p>
              <p style="margin:0;font-size:12px;color:#6b7280;text-align:center;word-break:break-all;">{{ContractLink}}
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