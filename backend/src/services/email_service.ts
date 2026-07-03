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
  try {
    console.log("Inside sendPlanInvoice");
    console.log(process.env.EMAIL_USER);
    console.log(process.env.EMAIL_PASS);
    console.log(email);

    const info = await transporter.sendMail({
      from: `"YouTube Clone" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Watch Plan Activated",
      html: `
    <h2>Hello ${name}</h2>
    <p>Your ${plan.toUpperCase()} plan has been activated successfully.</p>
    <p>Amount Paid: ₹${amount}</p>
  `,
    });

    console.log("Mail sent successfully:", info.messageId);
  } catch (error) {
    console.error("sendPlanInvoice Error:", error);
    throw error;
  }
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

