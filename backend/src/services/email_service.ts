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
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Watch Plan Activated",

    html: `
      <h2>Hello ${name}</h2>

      <p>Your plan has been activated successfully.</p>

      <hr/>

      <h3>Invoice Details</h3>

      <p><b>Plan:</b> ${plan}</p>
      <p><b>Amount Paid:</b> ₹${amount}</p>
      <p><b>Date:</b> ${new Date().toLocaleString()}</p>

      <hr/>

      <p>Thank you for your purchase.</p>
      <p>YouTube Clone Team</p>
    `,
  });
};