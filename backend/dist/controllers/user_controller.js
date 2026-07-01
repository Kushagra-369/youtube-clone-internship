"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserWatchTime = exports.updateWatchTime = exports.verifyPhoneOTP = exports.sendPhoneOTP = exports.updatePhoneNumber = exports.verifyEmailOTP = exports.sendEmailOTP = exports.validateUser = exports.upgradeWatchPlan = exports.getUserByEmail = exports.upgradeToPremium = exports.getUserById = exports.getUsers = exports.createUser = void 0;
const user_model_1 = __importDefault(require("../models/user_model"));
const email_service_1 = require("../services/email_service");
const email_service_2 = require("../services/email_service");
const twilio_1 = __importDefault(require("twilio"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const client = (0, twilio_1.default)(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const createUser = async (req, res) => {
    try {
        const { name, email, state, phone } = req.body;
        if (!name || !email) {
            res.status(400).json({
                success: false,
                message: "Name and email are required",
            });
            return;
        }
        const existingUser = await user_model_1.default.findOne({
            email,
        });
        if (existingUser) {
            res.status(400).json({
                success: false,
                message: "User already exists",
            });
            return;
        }
        const user = await user_model_1.default.create({ name, email, phone, state });
        res.status(201).json({
            success: true,
            message: "User created successfully",
            data: user,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
exports.createUser = createUser;
const getUsers = async (req, res) => {
    try {
        const { excludeUserId } = req.query; // Current user ID to exclude
        // Build query
        const query = {};
        if (excludeUserId) {
            query._id = { $ne: excludeUserId };
        }
        // Get users with pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        const [users, total] = await Promise.all([
            user_model_1.default.find(query)
                .select("-password -__v -createdAt -updatedAt") // Exclude sensitive fields
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            user_model_1.default.countDocuments(query),
        ]);
        res.status(200).json({
            success: true,
            data: users,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    }
    catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch users",
        });
    }
};
exports.getUsers = getUsers;
const getUserById = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await user_model_1.default.findById(userId);
        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found",
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: user,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
exports.getUserById = getUserById;
const upgradeToPremium = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await user_model_1.default.findById(userId);
        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found",
            });
            return;
        }
        user.plan = "premium";
        await user.save();
        res.status(200).json({
            success: true,
            message: "User upgraded to premium",
            data: user,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
exports.upgradeToPremium = upgradeToPremium;
const getUserByEmail = async (req, res) => {
    try {
        const email = req.params.email;
        const user = await user_model_1.default.findOne({
            email,
        });
        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found",
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: user,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
exports.getUserByEmail = getUserByEmail;
const upgradeWatchPlan = async (req, res) => {
    try {
        const { userId } = req.params;
        const { watchPlan } = req.body;
        const user = await user_model_1.default.findById(userId);
        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found",
            });
            return;
        }
        user.watchPlan = watchPlan;
        await user.save();
        const amounts = {
            bronze: 10,
            silver: 50,
            gold: 100,
        };
        const amount = amounts[watchPlan] ?? 0;
        await (0, email_service_1.sendPlanInvoice)(user.email, user.name, watchPlan, amount);
        res.status(200).json({
            success: true,
            message: "Watch plan updated successfully",
            data: user,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
exports.upgradeWatchPlan = upgradeWatchPlan;
const validateUser = async (req, res) => {
    const email = req.params.email;
    const user = await user_model_1.default.findOne({
        email,
    });
    if (!user) {
        return res.status(404).json({
            success: false,
        });
    }
    return res.status(200).json({
        success: true,
        data: user,
    });
};
exports.validateUser = validateUser;
const sendEmailOTP = async (req, res) => {
    try {
        const { email } = req.body;
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        let user = await user_model_1.default.findOne({
            email,
        });
        if (!user) {
            user = await user_model_1.default.create({
                name: "temp",
                email,
            });
        }
        user.otp = otp;
        user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
        user.isOtpVerified = false;
        await user.save();
        await (0, email_service_2.sendOTP)(email, otp);
        console.log(process.env.EMAIL_USER);
        console.log(process.env.EMAIL_PASS);
        res.json({
            success: true,
            message: "OTP sent",
        });
    }
    catch (error) {
        console.error("SEND OTP ERROR:", error);
        res.status(500).json({
            success: false,
        });
    }
};
exports.sendEmailOTP = sendEmailOTP;
const verifyEmailOTP = async (req, res) => {
    const { email, otp } = req.body;
    const user = await user_model_1.default.findOne({
        email,
    });
    if (!user) {
        return res.status(404).json({
            success: false,
        });
    }
    if (user.otp !== otp ||
        !user.otpExpiry ||
        user.otpExpiry < new Date()) {
        return res.status(400).json({
            success: false,
            message: "Invalid OTP",
        });
    }
    user.otp = "";
    user.otpExpiry = null;
    user.isOtpVerified = true;
    await user.save();
    return res.json({
        success: true,
    });
};
exports.verifyEmailOTP = verifyEmailOTP;
const updatePhoneNumber = async (req, res) => {
    try {
        const { userId } = req.params;
        const { phone } = req.body;
        const user = await user_model_1.default.findById(userId);
        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found",
            });
            return;
        }
        user.phone = phone;
        user.isOtpVerified = false;
        await user.save();
        res.status(200).json({
            success: true,
            message: "Phone updated successfully",
            data: user,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
exports.updatePhoneNumber = updatePhoneNumber;
const sendPhoneOTP = async (req, res) => {
    try {
        console.log(process.env.TWILIO_ACCOUNT_SID);
        console.log(process.env.TWILIO_AUTH_TOKEN);
        console.log(process.env.TWILIO_VERIFY_SERVICE_SID);
        const { phone } = req.body;
        const user = await user_model_1.default.findOne({
            phone,
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        await client.verify.v2
            .services(process.env.TWILIO_VERIFY_SERVICE_SID)
            .verifications.create({
            to: `+91${phone}`,
            channel: "sms",
        });
        return res.json({
            success: true,
            message: "OTP sent successfully",
        });
    }
    catch (error) {
        console.error("Twilio Send OTP Error:", error);
        return res.status(500).json({
            success: false,
            message: error.message ||
                "Failed to send OTP",
        });
    }
};
exports.sendPhoneOTP = sendPhoneOTP;
const verifyPhoneOTP = async (req, res) => {
    try {
        const { phone, otp } = req.body;
        const user = await user_model_1.default.findOne({
            phone,
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        const verification = await client.verify.v2
            .services(process.env.TWILIO_VERIFY_SERVICE_SID)
            .verificationChecks.create({
            to: `+91${phone}`,
            code: otp,
        });
        if (verification.status !==
            "approved") {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP",
            });
        }
        user.isOtpVerified = true;
        await user.save();
        return res.json({
            success: true,
            message: "OTP verified",
            data: user,
        });
    }
    catch (error) {
        console.error("Twilio Verify Error:", error);
        return res.status(500).json({
            success: false,
            message: error.message ||
                "OTP verification failed",
        });
    }
};
exports.verifyPhoneOTP = verifyPhoneOTP;
// Update user's watch time
const updateWatchTime = async (req, res) => {
    try {
        const { userId } = req.params;
        const { watchTime } = req.body;
        if (!userId) {
            res.status(400).json({
                success: false,
                message: "User ID is required",
            });
            return;
        }
        const user = await user_model_1.default.findById(userId);
        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found",
            });
            return;
        }
        user.totalWatchTime = watchTime || 0;
        user.lastWatchDate = new Date();
        await user.save();
        res.status(200).json({
            success: true,
            message: "Watch time updated successfully",
            data: {
                totalWatchTime: user.totalWatchTime,
                lastWatchDate: user.lastWatchDate,
            },
        });
    }
    catch (error) {
        console.error("Update Watch Time Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
exports.updateWatchTime = updateWatchTime;
// Get user's watch time
const getUserWatchTime = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            res.status(400).json({
                success: false,
                message: "User ID is required",
            });
            return;
        }
        const user = await user_model_1.default.findById(userId);
        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found",
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: {
                totalWatchTime: user.totalWatchTime || 0,
                lastWatchDate: user.lastWatchDate,
                watchPlan: user.watchPlan,
            },
        });
    }
    catch (error) {
        console.error("Get Watch Time Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
exports.getUserWatchTime = getUserWatchTime;
//# sourceMappingURL=user_controller.js.map