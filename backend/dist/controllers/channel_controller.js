"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkSubscription = exports.unsubscribeChannel = exports.subscribeChannel = exports.getChannelById = exports.getChannelByOwner = exports.createChannel = void 0;
const channel_model_1 = __importDefault(require("../models/channel_model"));
const user_model_1 = __importDefault(require("../models/user_model"));
const createChannel = async (req, res) => {
    try {
        const { ownerId, channelName, description, bannerUrl, } = req.body;
        // Check if user exists
        const user = await user_model_1.default.findById(ownerId);
        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found",
            });
            return;
        }
        const existingChannel = await channel_model_1.default.findOne({
            ownerId,
        });
        if (existingChannel) {
            res.status(400).json({
                success: false,
                message: "Channel already exists",
            });
            return;
        }
        const channel = await channel_model_1.default.create({
            ownerId,
            channelName: channelName || `${user.name}'s Channel`,
            description: description || "",
            bannerUrl: bannerUrl || "",
        });
        res.status(201).json({
            success: true,
            data: channel,
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
exports.createChannel = createChannel;
const getChannelByOwner = async (req, res) => {
    try {
        const ownerId = req.params.ownerId;
        const channel = await channel_model_1.default.findOne({
            ownerId,
        });
        if (!channel) {
            res.status(404).json({
                success: false,
                message: "Channel not found",
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: channel,
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
exports.getChannelByOwner = getChannelByOwner;
const getChannelById = async (req, res) => {
    try {
        const { channelId } = req.params;
        const channel = await channel_model_1.default.findById(channelId);
        if (!channel) {
            res.status(404).json({
                success: false,
                message: "Channel not found",
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: channel,
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
exports.getChannelById = getChannelById;
const subscribeChannel = async (req, res) => {
    try {
        const { channelId } = req.params;
        const { userId } = req.body;
        if (!userId) {
            res.status(400).json({
                success: false,
                message: "userId is required",
            });
            return;
        }
        const channel = await channel_model_1.default.findById(channelId);
        if (!channel) {
            res.status(404).json({
                success: false,
                message: "Channel not found",
            });
            return;
        }
        // Check if already subscribed
        if (channel.subscribedBy.includes(userId)) {
            res.status(400).json({
                success: false,
                message: "Already subscribed",
            });
            return;
        }
        // Add user to subscribers
        channel.subscribedBy.push(userId);
        channel.subscribers = channel.subscribedBy.length;
        await channel.save();
        res.status(200).json({
            success: true,
            message: "Subscribed successfully",
            data: channel,
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
exports.subscribeChannel = subscribeChannel;
const unsubscribeChannel = async (req, res) => {
    try {
        const { channelId } = req.params;
        const { userId } = req.body;
        if (!userId) {
            res.status(400).json({
                success: false,
                message: "userId is required",
            });
            return;
        }
        const channel = await channel_model_1.default.findById(channelId);
        if (!channel) {
            res.status(404).json({
                success: false,
                message: "Channel not found",
            });
            return;
        }
        // Check if not subscribed
        if (!channel.subscribedBy.includes(userId)) {
            res.status(400).json({
                success: false,
                message: "Not subscribed",
            });
            return;
        }
        // Remove user from subscribers
        channel.subscribedBy = channel.subscribedBy.filter((id) => id !== userId);
        channel.subscribers = channel.subscribedBy.length;
        await channel.save();
        res.status(200).json({
            success: true,
            message: "Unsubscribed successfully",
            data: channel,
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
exports.unsubscribeChannel = unsubscribeChannel;
const checkSubscription = async (req, res) => {
    try {
        const channelId = req.params.channelId;
        const userId = req.params.userId;
        const channel = await channel_model_1.default.findById(channelId);
        if (!channel) {
            res.status(404).json({
                success: false,
                message: "Channel not found",
            });
            return;
        }
        const isSubscribed = channel.subscribedBy.includes(userId);
        res.status(200).json({
            success: true,
            isSubscribed,
            subscribers: channel.subscribers,
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
exports.checkSubscription = checkSubscription;
//# sourceMappingURL=channel_controller.js.map