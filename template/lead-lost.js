module.exports = `<!DOCTYPE html>
<html>

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Request Update</title>
</head>

<body style="margin:0; padding:0; background:#f6f9fc; font-family:Arial, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f6f9fc; padding:32px 16px;">
    <tr>
      <td align="center">

        <table width="560" cellpadding="0" cellspacing="0" border="0"
          style="background:#ffffff; border:1px solid #e2e8f0; border-radius:10px; overflow:hidden;">

          <!-- HEADER -->
            <tr>
            <td
              style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%);padding:20px 20px 10px;text-align:center;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <div style="display: flex; align-items:flex-start; justify-content: space-between;">
                    <div>
                      <img src="https://res.cloudinary.com/dmbpjv9e8/image/upload/h_110,q_100,f_png/v1777543091/logo-white_xg7uyj.webp" alt="Arslan Larik & Company"
                        style="height:55px;width:auto;display:block;" />
                      <p style="font-size:18px; font-weight:600; color:#ffffff; text-align: left; line-height: 2px;">
                        Update on your request
                      </p>
                      <p style="font-size:13px; color:#94a3b8; text-align: left;">Important information regarding your application</p>
                    </div>
                    <div style="margin: 5px 10px 0px 0px;">
                    <span style="background:rgb(254, 242, 242, 0.75); color:#991b1b; padding:4px 10px;
                      border-radius:6px; font-size:11px; font-weight:600;">
                      Request Update
                    </span>
                    </div>
                  </div>
                </tr>
              </table>

            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:24px 32px;">

              <p style="font-size:14px; color:#1a202c; margin:0 0 16px;">
                Hi <strong>{{UserName}}</strong>,
              </p>

              <p style="font-size:14px; color:#4a5568; line-height:1.7; margin:0 0 20px;">
                Thank you for your interest in our programs. After careful
                consideration, we are unable to proceed with your application
                at this time.
              </p>

              <!-- Reason Box -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                style="border:1px solid #e2e8f0; border-radius:8px; overflow:hidden; margin-bottom:20px;">
                <tr>
                  <td width="35%" style="padding:12px 16px; background:#f8fafc; font-size:12px; color:#718096; font-weight:600;">
                    Reason
                  </td>
                  <td style="padding:12px 16px; font-size:14px; color:#1a202c;">
                    {{LostReason}}
                  </td>
                </tr>
              </table>

              <!-- Info box -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:4px;">
                <tr>
                  <td width="3" style="background:#EF9F27;">&nbsp;</td>
                  <td style="background:#FAEEDA; padding:12px 16px; font-size:13px; color:#633806;">
                    We encourage you to reach out to our support team if you
                    have any questions or would like to discuss other available
                    options. We'd love to help you find the right fit.
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e5e7eb;padding:24px 40px;text-align:center;">
              <img src="https://res.cloudinary.com/dmbpjv9e8/image/upload/h_80,q_100,f_auto/v1777543090/logo_gx6cud.webp" alt="Arslan Larik & Company" style="height:40px;width:auto;display:block;margin:0 auto 8px;" />
              <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;">Center for Human Brilliance & Behavioral Reengineering</p>
              <p style="margin:0;font-size:12px;color:#9ca3af;">Questions? Contact us at <a href="mailto:{{SupportEmail}}" style="color:#EF9F27;text-decoration:none;">{{SupportEmail}}</a></p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;