module.exports = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
    .header { background: #2B4C7E; padding: 32px 24px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 22px; }
    .body { padding: 32px 24px; }
    .body p { color: #444; font-size: 15px; line-height: 1.6; }
    .btn { display: inline-block; margin: 24px 0 8px; padding: 14px 32px; background: #f5a623; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; }
    .footer { text-align: center; padding: 16px; color: #aaa; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📖 Your Book is Ready!</h1>
    </div>
    <div class="body">
      <p>Hi <strong>{{UserName}}</strong>,</p>
      <p>Thank you for your interest! Your free book <strong>"{{BookTitle}}"</strong> is ready to download.</p>
      <p style="text-align:center;">
        <a href="{{BookUrl}}" class="btn">Download Your Book</a>
      </p>
      <p>If the button doesn't work, copy this link:<br/>
        <a href="{{BookUrl}}" style="color:#2B4C7E; word-break:break-all;">{{BookUrl}}</a>
      </p>
      <p>Enjoy your read! 🚀</p>
    </div>
    <div class="footer">Al-and-co &copy; 2025. All rights reserved.</div>
  </div>
</body>
</html>
`;