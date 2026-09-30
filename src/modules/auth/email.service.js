const nodemailer = require('nodemailer')

// ─────────────────────────────────────────────────────────
// MAIL TRANSPORTER
// ─────────────────────────────────────────────────────────

const transporter = nodemailer.createTransport({
  host:process.env.MAIL_HOST ||'smtp.gmail.com',
  port:Number(process.env.MAIL_PORT) || 587,
  secure:Number(process.env.MAIL_PORT) === 465,
  auth: {
    user:process.env.MAIL_USER,
    pass:process.env.MAIL_PASSWORD,
  },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 15000,
})

// ─────────────────────────────────────────────────────────
// EMAIL VERIFICATION
// ─────────────────────────────────────────────────────────

const sendVerificationEmail = async ({
  email,
  fname,
  verificationUrl,
}) => {
  await transporter.sendMail({
    from:process.env.MAIL_FROM ||process.env.MAIL_USER,

    to: email,

    subject:'Verify your SmartCity account',

    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <title>Verify your SmartCity account</title>
        </head>

        <body
          style="
            margin: 0;
            padding: 0;
            background: #f8fafc;
            font-family:
              Arial,
              Helvetica,
              sans-serif;
          "
        >
          <div
            style="
              max-width: 600px;
              margin: 40px auto;
              background: #ffffff;
              border: 1px solid #e5e7eb;
              border-radius: 16px;
              overflow: hidden;
            "
          >

            <!-- Header -->
            <div
              style="
                padding: 28px 32px;
                border-bottom: 1px solid #e5e7eb;
              "
            >
              <div
                style="
                  display: inline-block;
                  width: 42px;
                  height: 42px;
                  line-height: 42px;
                  text-align: center;
                  background: #2563eb;
                  color: #ffffff;
                  border-radius: 10px;
                  font-size: 20px;
                  font-weight: bold;
                "
              >
                S
              </div>

              <span
                style="
                  margin-left: 10px;
                  vertical-align: top;
                  line-height: 42px;
                  font-size: 20px;
                  font-weight: 700;
                  color: #111827;
                "
              >
                SmartCity
              </span>
            </div>

            <!-- Content -->
            <div
              style="
                padding: 36px 32px;
              "
            >
              <h1
                style="
                  margin: 0 0 16px;
                  color: #111827;
                  font-size: 26px;
                  line-height: 1.3;
                "
              >
                Verify your email
              </h1>

              <p
                style="
                  margin: 0 0 16px;
                  color: #374151;
                  font-size: 16px;
                  line-height: 1.6;
                "
              >
                Hi ${fname || 'there'},
              </p>

              <p
                style="
                  margin: 0 0 24px;
                  color: #4b5563;
                  font-size: 15px;
                  line-height: 1.7;
                "
              >
                Thanks for creating your SmartCity
                account. Please verify your email
                address to confirm that it belongs to you.
              </p>

              <!-- Button -->
              <div
                style="
                  margin: 28px 0;
                "
              >
                <a
                  href="${verificationUrl}"
                  style="
                    display: inline-block;
                    padding: 13px 24px;
                    background: #2563eb;
                    color: #ffffff;
                    text-decoration: none;
                    border-radius: 8px;
                    font-size: 15px;
                    font-weight: 600;
                  "
                >
                  Verify Email
                </a>
              </div>

              <p
                style="
                  margin: 0 0 12px;
                  color: #6b7280;
                  font-size: 13px;
                  line-height: 1.6;
                "
              >
                This verification link will expire
                in <strong>15 minutes</strong>.
              </p>

              <p
                style="
                  margin: 20px 0 0;
                  color: #9ca3af;
                  font-size: 12px;
                  line-height: 1.6;
                  word-break: break-all;
                "
              >
                If the button does not work, copy and
                paste this link into your browser:
                <br />
                ${verificationUrl}
              </p>
            </div>

            <!-- Footer -->
            <div
              style="
                padding: 20px 32px;
                background: #f9fafb;
                border-top: 1px solid #e5e7eb;
              "
            >
              <p
                style="
                  margin: 0;
                  color: #9ca3af;
                  font-size: 12px;
                  line-height: 1.5;
                "
              >
                If you did not create a SmartCity
                account, you can safely ignore this email.
              </p>
            </div>

          </div>
        </body>
      </html>
    `,
  })
}

// ─────────────────────────────────────────────────────────
// PASSWORD RESET
// ─────────────────────────────────────────────────────────

const sendPasswordResetEmail = async ({
  email,
  fname,
  resetUrl,
}) => {
  await transporter.sendMail({
    from:process.env.MAIL_FROM ||process.env.MAIL_USER,

    to: email,

    subject:
      'Reset your SmartCity password',

    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <title>Reset your SmartCity password</title>
        </head>

        <body
          style="
            margin: 0;
            padding: 0;
            background: #f8fafc;
            font-family:
              Arial,
              Helvetica,
              sans-serif;
          "
        >
          <div
            style="
              max-width: 600px;
              margin: 40px auto;
              background: #ffffff;
              border: 1px solid #e5e7eb;
              border-radius: 16px;
              overflow: hidden;
            "
          >

            <!-- Header -->
            <div
              style="
                padding: 28px 32px;
                border-bottom: 1px solid #e5e7eb;
              "
            >
              <div
                style="
                  display: inline-block;
                  width: 42px;
                  height: 42px;
                  line-height: 42px;
                  text-align: center;
                  background: #2563eb;
                  color: #ffffff;
                  border-radius: 10px;
                  font-size: 20px;
                  font-weight: bold;
                "
              >
                S
              </div>

              <span
                style="
                  margin-left: 10px;
                  vertical-align: top;
                  line-height: 42px;
                  font-size: 20px;
                  font-weight: 700;
                  color: #111827;
                "
              >
                SmartCity
              </span>
            </div>

            <!-- Content -->
            <div
              style="
                padding: 36px 32px;
              "
            >
              <h1
                style="
                  margin: 0 0 16px;
                  color: #111827;
                  font-size: 26px;
                  line-height: 1.3;
                "
              >
                Reset your password
              </h1>

              <p
                style="
                  margin: 0 0 16px;
                  color: #374151;
                  font-size: 16px;
                  line-height: 1.6;
                "
              >
                Hi ${fname || 'there'},
              </p>

              <p
                style="
                  margin: 0 0 24px;
                  color: #4b5563;
                  font-size: 15px;
                  line-height: 1.7;
                "
              >
                We received a request to reset the
                password for your SmartCity account.
                Click the button below to create a new
                password.
              </p>

              <!-- Button -->
              <div
                style="
                  margin: 28px 0;
                "
              >
                <a
                  href="${resetUrl}"
                  style="
                    display: inline-block;
                    padding: 13px 24px;
                    background: #2563eb;
                    color: #ffffff;
                    text-decoration: none;
                    border-radius: 8px;
                    font-size: 15px;
                    font-weight: 600;
                  "
                >
                  Reset Password
                </a>
              </div>

              <p
                style="
                  margin: 0 0 12px;
                  color: #6b7280;
                  font-size: 13px;
                  line-height: 1.6;
                "
              >
                This password reset link will expire
                in <strong>15 minutes</strong>.
              </p>

              <p
                style="
                  margin: 20px 0 0;
                  color: #9ca3af;
                  font-size: 12px;
                  line-height: 1.6;
                  word-break: break-all;
                "
              >
                If the button does not work, copy and
                paste this link into your browser:
                <br />
                ${resetUrl}
              </p>
            </div>

            <!-- Footer -->
            <div
              style="
                padding: 20px 32px;
                background: #f9fafb;
                border-top: 1px solid #e5e7eb;
              "
            >
              <p
                style="
                  margin: 0;
                  color: #9ca3af;
                  font-size: 12px;
                  line-height: 1.5;
                "
              >
                If you did not request a password reset,
                you can safely ignore this email.
              </p>
            </div>

          </div>
        </body>
      </html>
    `,
  })
}

// ─────────────────────────────────────────────────────────

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
}