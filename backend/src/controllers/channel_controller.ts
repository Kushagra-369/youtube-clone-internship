import { Request, Response } from "express";
import Channel from "../models/channel_model";
import User from "../models/user_model";

export const createChannel = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const {
            ownerId,
            channelName,
            description,
            bannerUrl,
        } = req.body;

        // Check if user exists
        const user = await User.findById(ownerId);
        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found",
            });
            return;
        }

        const existingChannel = await Channel.findOne({
            ownerId,
        });

        if (existingChannel) {
            res.status(400).json({
                success: false,
                message: "Channel already exists",
            });
            return;
        }

        const channel = await Channel.create({
            ownerId,
            channelName: channelName || `${user.name}'s Channel`,
            description: description || "",
            bannerUrl: bannerUrl || "",
        });

        res.status(201).json({
            success: true,
            data: channel,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

export const getChannelByOwner = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const ownerId = req.params.ownerId as string;

        const channel = await Channel.findOne({
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
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

export const getChannelById = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { channelId } = req.params;

        const channel = await Channel.findById(channelId);

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
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

export const subscribeChannel = async (
    req: Request,
    res: Response
): Promise<void> => {
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

        const channel = await Channel.findById(channelId);

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
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

export const unsubscribeChannel = async (
    req: Request,
    res: Response
): Promise<void> => {
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

        const channel = await Channel.findById(channelId);

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
        channel.subscribedBy = channel.subscribedBy.filter(
            (id) => id !== userId
        );
        channel.subscribers = channel.subscribedBy.length;
        await channel.save();

        res.status(200).json({
            success: true,
            message: "Unsubscribed successfully",
            data: channel,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

export const checkSubscription = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const channelId = req.params.channelId as string;
        const userId = req.params.userId as string;

        const channel = await Channel.findById(channelId);

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
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};