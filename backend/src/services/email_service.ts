import dotenv from "dotenv";
import sgMail from "@sendgrid/mail";

dotenv.config();

// Set the API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

const fromEmail = process.env.EMAIL_FROM || "noreply@yourapp.com";

export const sendOTP = async (email: string, otp: string) => {
  try {
    const msg = {
      to: email,
      from: fromEmail,
      subject: "Your Login OTP",
      html: `
        <h2>Login Verification</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>Valid for 5 minutes.</p>
      `,
    };
    await sgMail.send(msg);
    console.log(`✅ OTP sent to ${email}`);
  } catch (error: any) {
    console.error(`❌ Failed to send OTP to ${email}:`, error.response?.body || error.message);
    throw error;
  }
};

export const sendPlanInvoice = async (
  email: string,
  name: string,
  plan: string,
  amount: number
) => {
  try {
    const msg = {
      to: email,
      from: fromEmail,
      subject: "Watch Plan Activated",
      html: `
        <h2>Hello ${name}</h2>
        <p>Your ${plan.toUpperCase()} plan has been activated successfully.</p>
        <p>Amount Paid: ₹${amount}</p>
      `,
    };
    await sgMail.send(msg);
    console.log(`✅ Invoice sent to ${email}`);
  } catch (error: any) {
    console.error(`❌ Failed to send invoice to ${email}:`, error.response?.body || error.message);
    throw error;
  }
};