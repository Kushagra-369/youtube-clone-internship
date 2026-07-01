"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOTP = exports.sendPlanInvoice = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const nodemailer_1 = __importDefault(require("nodemailer"));
const transporter = nodemailer_1.default.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});
const sendPlanInvoice = async (email, name, plan, amount) => {
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
exports.sendPlanInvoice = sendPlanInvoice;
const sendOTP = async (email, otp) => {
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
exports.sendOTP = sendOTP;
//# sourceMappingURL=email_service.js.map