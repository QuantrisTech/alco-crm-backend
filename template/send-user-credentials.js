module.exports = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
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
<td style="padding:24px 32px; border-bottom:1px solid #e2e8f0;">
  <h2 style="margin:0; color:#1a202c;">{{YourCompanyName}}</h2>
  <p style="margin:6px 0 0; color:#718096; font-size:13px;">
    Your account has been created
  </p>
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
  <strong>Email:</strong> {{UserEmail}} <br/>
  <strong>Password:</strong> {{UserPassword}}
</td>
</tr>
</table>

<!-- Button -->
<table width="100%" style="margin-top:24px;" cellpadding="0" cellspacing="0">
<tr>
<td align="center">
  <a href="{{LoginLink}}"
    style="background:#185FA5; color:#ffffff; padding:12px 22px;
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
<td style="padding:16px 32px; border-top:1px solid #e2e8f0; font-size:12px; color:#718096;">
  Need help? Contact 
  <a href="mailto:{{SupportEmail}}" style="color:#185FA5; text-decoration:none;">
    {{SupportEmail}}
  </a>
</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>`;