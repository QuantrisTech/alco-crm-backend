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
            <td style="padding:28px 32px 20px; border-bottom:1px solid #e2e8f0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-size:15px; font-weight:600; color:#1a202c;">{{YourCompanyName}}</td>
                  <td align="right">
                    <span style="background:#E6F1FB; color:#185FA5; padding:4px 10px;
                      border-radius:6px; font-size:11px; font-weight:600;">
                      Account update
                    </span>
                  </td>
                </tr>
              </table>
              <p style="font-size:18px; font-weight:600; color:#1a202c; margin:14px 0 4px;">
                Your account details were updated
              </p>
              <p style="font-size:13px; color:#718096; margin:0;">Administrator action</p>
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
            <td style="padding:16px 32px; border-top:1px solid #e2e8f0;">
              <p style="font-size:12px; color:#718096; margin:0;">
                Need help? Contact
                <a href="mailto:{{SupportEmail}}"
                  style="color:#185FA5; text-decoration:none;">{{SupportEmail}}</a>
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;