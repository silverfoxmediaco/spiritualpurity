// spiritualpurity/services/emailService.js

const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Create email transporter
const createTransporter = () => {
  // For development, we'll use Gmail
  // In production, you'd use a service like SendGrid, AWS SES, etc.
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Your Gmail address
      pass: process.env.EMAIL_APP_PASSWORD // Gmail App Password
    }
  });
};

// Generate verification token
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Send verification email
const sendVerificationEmail = async (user, verificationToken) => {
  try {
    const transporter = createTransporter();
    
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}&email=${user.email}`;
    
    const mailOptions = {
      from: {
        name: 'Spiritual Purity',
        address: process.env.EMAIL_USER
      },
      to: user.email,
      subject: 'Welcome to Spiritual Purity - Please Verify Your Email',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: 'Arial', sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f8fafc;
              margin: 0;
              padding: 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: white;
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              background-color: #404040;
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .content {
              padding: 30px;
            }
            .welcome-text {
              font-size: 18px;
              color: #404040;
              margin-bottom: 20px;
            }
            .verify-button {
              display: inline-block;
              background-color: #f59e0b;
              color: white;
              padding: 15px 30px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
              font-size: 16px;
              margin: 20px 0;
              text-align: center;
            }
            .verify-button:hover {
              background-color: #d97706;
            }
            .alternative-link {
              word-break: break-all;
              background-color: #f3f4f6;
              padding: 10px;
              border-radius: 5px;
              font-size: 12px;
              margin: 15px 0;
            }
            .footer {
              background-color: #f8fafc;
              padding: 20px;
              text-align: center;
              font-size: 12px;
              color: #6b7280;
            }
            .verse {
              font-style: italic;
              color: #6b7280;
              border-left: 3px solid #f59e0b;
              padding-left: 15px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🕊️ Spiritual Purity</h1>
              <p>Faith • Community • Growth</p>
            </div>
            
            <div class="content">
              <h2 class="welcome-text">Welcome to our community, ${user.firstName}!</h2>
              
              <p>Thank you for joining Spiritual Purity. We're excited to have you as part of our faith community!</p>
              
              <p>To complete your registration and start connecting with fellow believers, please verify your email address by clicking the button below:</p>
              
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="verify-button">
                  Verify My Email Address
                </a>
              </div>
              
              <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
              <div class="alternative-link">${verificationUrl}</div>
              
              <div class="verse">
                <p>"Therefore encourage one another and build each other up, just as in fact you are doing."</p>
                <p><strong>- 1 Thessalonians 5:11</strong></p>
              </div>
              
              <p>Once verified, you'll be able to:</p>
              <ul>
                <li>Share and receive prayer requests</li>
                <li>Join Bible study discussions</li>
                <li>Connect with fellow believers</li>
                <li>Share your testimony and faith journey</li>
              </ul>
              
              <p>If you didn't create this account, please ignore this email.</p>
              
              <p>Blessings,<br>The Spiritual Purity Team</p>
            </div>
            
            <div class="footer">
              <p>&copy; 2025 Spiritual Purity - Walking in faith together</p>
              <p>This email was sent to ${user.email}</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Verification email sent:', result.messageId);
    return { success: true, messageId: result.messageId };

  } catch (error) {
    console.error('Error sending verification email:', error);
    return { success: false, error: error.message };
  }
};

// Send welcome email (after verification)
const sendWelcomeEmail = async (user) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: {
        name: 'Spiritual Purity',
        address: process.env.EMAIL_USER
      },
      to: user.email,
      subject: 'Welcome to Spiritual Purity! Your email has been verified',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: 'Arial', sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f8fafc;
              margin: 0;
              padding: 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: white;
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #bfdbfe 0%, #f0f9ff 100%);
              color: #404040;
              padding: 30px;
              text-align: center;
            }
            .content {
              padding: 30px;
            }
            .cta-button {
              display: inline-block;
              background-color: #f59e0b;
              color: white;
              padding: 15px 30px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
              font-size: 16px;
              margin: 20px 0;
            }
            .footer {
              background-color: #f8fafc;
              padding: 20px;
              text-align: center;
              font-size: 12px;
              color: #6b7280;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Email Verified Successfully!</h1>
              <p>Welcome to the Spiritual Purity community, ${user.firstName}!</p>
            </div>
            
            <div class="content">
              <p>Your email has been verified and your account is now fully activated!</p>
              
              <p>You can now:</p>
              <ul>
                <li>Complete your profile with your testimony and favorite verse</li>
                <li>Join prayer circles and share requests</li>
                <li>Connect with other believers in your area</li>
                <li>Participate in Bible study discussions</li>
              </ul>
              
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}/profile" class="cta-button">
                  Complete Your Profile
                </a>
              </div>
              
              <p>We're so glad you're here!</p>
              
              <p>Blessings,<br>The Spiritual Purity Team</p>
            </div>
            
            <div class="footer">
              <p>&copy; 2025 Spiritual Purity - Walking in faith together</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent:', result.messageId);
    return { success: true, messageId: result.messageId };

  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  generateVerificationToken,
  sendVerificationEmail,
  sendWelcomeEmail
};