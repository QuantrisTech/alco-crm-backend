module.exports = `<!DOCTYPE html>
<html>

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome Account Details</title>
</head>

<body style="margin:0; padding:0; background:#f6f9fc; font-family:Arial, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr>
      <td align="center">

        <table width="560" cellpadding="0" cellspacing="0"
          style="background:#ffffff; border-radius:10px; border:1px solid #e2e8f0; overflow:hidden;">

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
                      <p style="font-size:18px; font-weight:600; color:#ffffff; text-align: left; line-height: 4px;">
                        Welcome to Arslan Larik & Company
                      </p>
                      <p style="font-size:13px; color:#94a3b8; text-align: left;">Your account has been created</p>
                    </div>
                  </div>
                </tr>
              </table>

            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:24px 32px;">

              <p style="font-size:14px;">Hi <strong>{{UserName}}</strong>,</p>

              <p style="font-size:14px; color:#4a5568;">
                Your account has been successfully created. Below are your login credentials:
              </p>

              <!-- Credentials Box -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="margin-top:16px; border:1px solid #e2e8f0; border-radius:6px;">
                <tr>
                  <td style="padding:12px; font-size:13px;">
                    <strong>Email:</strong> {{UserEmail}} <br />
                    <strong>Password:</strong> {{UserPassword}}
                  </td>
                </tr>
              </table>

              <!-- Button -->
              <table width="100%" style="margin:30px auto 30px;" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="{{LoginLink}}" style="background:#185FA5; color:#ffffff; padding:12px 22px;
    border-radius:6px; text-decoration:none; font-size:14px; font-weight:600;">
                      Log In To Your Account
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Note -->
              <p style="margin-top:20px; font-size:12px; color:#718096;">
                For security reasons, we strongly recommend changing your password after logging in.
              </p>

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