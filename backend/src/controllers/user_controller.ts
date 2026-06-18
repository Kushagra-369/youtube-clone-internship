import { Request, Response } from "express";
import User from "../models/user_model";
import { sendPlanInvoice } from "../services/email_service";
import { sendOTP } from "../services/email_service";

export const createUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, email, state, phone } = req.body;

    if (!name || !email) {
      res.status(400).json({
        success: false,
        message: "Name and email are required",
      });
      return;
    }

    const existingUser = await User.findOne({
      email,
    });

    if (existingUser) {
      res.status(400).json({
        success: false,
        message: "User already exists",
      });
      return;
    }

    const user = await User.create({ name, email, phone, state });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: user,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const users = await User.find().sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getUserById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

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
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const upgradeToPremium = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

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
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getUserByEmail = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const email = req.params.email as string;

    const user = await User.findOne({
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
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const upgradeWatchPlan = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;
    const { watchPlan } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    user.watchPlan = watchPlan;

    await user.save();
    const amounts: Record<string, number> = {
      bronze: 10,
      silver: 50,
      gold: 100,
    };

    const amount = amounts[watchPlan] ?? 0;

    await sendPlanInvoice(
      user.email,
      user.name,
      watchPlan,
      amount
    );

    res.status(200).json({
      success: true,
      message: "Watch plan updated successfully",
      data: user,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const validateUser = async (req: Request, res: Response) => {

  const email = req.params.email as string;

  const user = await User.findOne({
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

export const sendEmailOTP = async (
  req: Request,
  res: Response
) => {
  try {
    const { email } = req.body;

    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    let user = await User.findOne({
      email,
    });

    if (!user) {
      user = await User.create({
        name: "temp",
        email,
      });
    }

    user.otp = otp;
    user.otpExpiry = new Date(
      Date.now() + 5 * 60 * 1000
    );

    await user.save();

    await sendOTP(email, otp);

    console.log(process.env.EMAIL_USER);
    console.log(process.env.EMAIL_PASS);
    res.json({
      success: true,
      message: "OTP sent",
    });
  } catch (error) {
    console.error(
      "SEND OTP ERROR:",
      error
    );

    res.status(500).json({
      success: false,
    });
  }
};

export const verifyEmailOTP = async (
  req: Request,
  res: Response
) => {
  const { email, otp } = req.body;

  const user = await User.findOne({
    email,
  });

  if (!user) {
    return res.status(404).json({
      success: false,
    });
  }

  if (
    user.otp !== otp ||
    !user.otpExpiry ||
    user.otpExpiry < new Date()
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid OTP",
    });
  }

  user.otp = "";
  user.otpExpiry = null;

  await user.save();

  return res.json({
    success: true,
  });
};