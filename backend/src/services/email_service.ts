import dotenv from "dotenv";

dotenv.config();
import nodemailer from "nodemailer";


const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendPlanInvoice = async (
  email: string,
  name: string,
  plan: string,
  amount: number
) => {
  const invoiceId = `INV-${Date.now()}`;
  const date = new Date().toLocaleString("en-IN");

  await transporter.sendMail({
    from: `"YouTube Clone" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "🎉 Your Watch Plan Has Been Activated",

    html: `
      <div style="font-family: Arial, sans-serif; background:#f5f5f5; padding:30px;">
        <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 0 10px rgba(0,0,0,0.15);">

          <div style="background:#ff0000; color:white; padding:20px; text-align:center;">
            <h1 style="margin:0;">YouTube Clone</h1>
            <p style="margin:5px 0 0;">Watch Plan Invoice</p>
          </div>

          <div style="padding:25px;">

            <h2>Hello ${name}, 👋</h2>

            <p>
              Thank you for upgrading your Watch Plan.
              Your payment has been processed successfully.
            </p>

            <table style="width:100%; border-collapse:collapse; margin-top:20px;">
              <tr>
                <td style="padding:10px; border:1px solid #ddd;"><b>Invoice ID</b></td>
                <td style="padding:10px; border:1px solid #ddd;">${invoiceId}</td>
              </tr>

              <tr>
                <td style="padding:10px; border:1px solid #ddd;"><b>Plan</b></td>
                <td style="padding:10px; border:1px solid #ddd;">${plan.toUpperCase()}</td>
              </tr>

              <tr>
                <td style="padding:10px; border:1px solid #ddd;"><b>Amount Paid</b></td>
                <td style="padding:10px; border:1px solid #ddd;">₹${amount}</td>
              </tr>

              <tr>
                <td style="padding:10px; border:1px solid #ddd;"><b>Transaction Date</b></td>
                <td style="padding:10px; border:1px solid #ddd;">${date}</td>
              </tr>

              <tr>
                <td style="padding:10px; border:1px solid #ddd;"><b>Status</b></td>
                <td style="padding:10px; border:1px solid #ddd; color:green;"><b>SUCCESS</b></td>
              </tr>
            </table>

            <br/>

            <h3>Your Watch Time</h3>

            <ul>
              ${plan === "bronze"
        ? "<li>Watch videos up to <b>7 minutes</b>.</li>"
        : plan === "silver"
          ? "<li>Watch videos up to <b>10 minutes</b>.</li>"
          : "<li><b>Unlimited</b> video watching.</li>"
      }
            </ul>

            <br/>

            <p>
              Thank you for choosing <b>YouTube Clone</b>.
            </p>

            <hr/>

            <p style="font-size:12px; color:#777;">
              This is an automatically generated invoice.
              Please do not reply to this email.
            </p>

          </div>

        </div>
      </div>
    `,
  });
};

export const sendOTP = async (
  email: string,
  otp: string
) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your Login OTP",

    html: `
      <h2>Login Verification</h2>

      <p>Your OTP is:</p>

      <h1>${otp}</h1>

      <p>Valid for 5 minutes.</p>
    `,
  });
};

