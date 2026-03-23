const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.init();
  }

  async init() {
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      // Use Gmail SMTP
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      console.log('[Email Service] Initialized Gmail SMTP');
    } else {
      // Generate test SMTP service account from ethereal.email
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: testAccount.user, // generated ethereal user
          pass: testAccount.pass, // generated ethereal password
        },
      });
      console.log('[Email Service] Initialized Ethereal Email (Provide SMTP_USER and SMTP_PASS in .env to use Gmail)');
    }
  }

  async sendLoginEmail(toEmail, name) {
    if (!this.transporter) return;
    try {
      const info = await this.transporter.sendMail({
        from: '"IntelliSCM Notifications" <noreply@intelliscm.local>',
        to: toEmail,
        subject: 'New Login Alert - IntelliSCM',
        text: `Hello ${name},\n\nYou have successfully logged into your IntelliSCM account.\n\nIf this was not you, please secure your account immediately.`,
        html: `<p>Hello <b>${name}</b>,</p><p>You have successfully logged into your IntelliSCM account.</p><p>If this was not you, please secure your account immediately.</p>`,
      });
      console.log(`[Email Service] Login email sent to ${toEmail}. Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    } catch (error) {
      console.error('[Email Service] Error sending login email:', error);
    }
  }

  async sendCRSubmissionEmail(toEmails, crTitle, submitterName, projectName) {
    if (!this.transporter || !toEmails || toEmails.length === 0) return;
    try {
      const info = await this.transporter.sendMail({
        from: '"IntelliSCM Notifications" <noreply@intelliscm.local>',
        to: toEmails.join(', '),
        subject: `[Action Required] New Change Request Submitted: ${crTitle}`,
        text: `Hello,\n\nA new Change Request "${crTitle}" has been submitted by ${submitterName} for the project "${projectName}".\n\nPlease log in to the IntelliSCM dashboard to review it.`,
        html: `<p>Hello,</p><p>A new Change Request <b>"${crTitle}"</b> has been submitted by <i>${submitterName}</i> for the project <b>"${projectName}"</b>.</p><p>Please log in to the IntelliSCM dashboard to review it.</p>`,
      });
      console.log(`[Email Service] CR Submission email sent to ${toEmails.length} recipients. Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    } catch (error) {
      console.error('[Email Service] Error sending CR submission email:', error);
    }
  }
}

module.exports = new EmailService();
