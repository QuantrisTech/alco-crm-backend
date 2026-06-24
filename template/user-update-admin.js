module.exports = `<!DOCTYPE html>
<html>

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Account Update Notification</title>
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
                        Your account details were updated
                      </p>
                      <p style="font-size:13px; color:#94a3b8; text-align: left;">Administrator action</p>
                    </div>
                    <div style="margin: 5px 10px 0px 0px;">
                    <span style="background:rgb(254, 242, 242, 0.75); color:#991b1b; padding:4px 10px;
                      border-radius:6px; font-size:11px; font-weight:600;">
                       Account update
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

              <p style="font-size:14px; color:#4a5568; line-height:1.7; margin:0 0 12px;">
                The following changes were made to your account by an administrator:
              </p>

              <!-- Changes table -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                style="border:1px solid #e2e8f0; border-radius:6px; overflow:hidden; font-size:13px;">

                <!-- Table head -->
                <tr style="background:#f7fafc;">
                  <td width="33%" style="padding:9px 12px; border-bottom:1px solid #e2e8f0;
                    border-right:1px solid #e2e8f0; font-size:11px; font-weight:600;
                    color:#718096; text-transform:uppercase; letter-spacing:0.5px;">
                    Field
                  </td>
                  <td width="33%" style="padding:9px 12px; border-bottom:1px solid #e2e8f0;
                    border-right:1px solid #e2e8f0; font-size:11px; font-weight:600;
                    color:#718096; text-transform:uppercase; letter-spacing:0.5px;">
                    Before
                  </td>
                  <td width="34%" style="padding:9px 12px; border-bottom:1px solid #e2e8f0;
                    font-size:11px; font-weight:600; color:#718096;
                    text-transform:uppercase; letter-spacing:0.5px;">
                    After
                  </td>
                </tr>

                {{ChangedRows}}

              </table>

              <!-- Warning box -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0 0;">
                <tr>
                  <td width="3" style="background:#EF9F27;">&nbsp;</td>
                  <td style="background:#FAEEDA; padding:12px 16px; font-size:13px; color:#633806;">
                    If you did not authorize these changes, please contact support immediately.
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e5e7eb;padding:24px 40px;text-align:center;">
              <img src="https://res.cloudinary.com/dmbpjv9e8/image/upload/h_80,q_100,f_auto/v1777543090/logo_gx6cud.webp" alt="Arslan Larik & Company"
                style="height:40px;width:auto;display:block;margin:0 auto 8px;" />
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