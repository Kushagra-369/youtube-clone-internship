import { Request, Response } from "express";
import Channel from "../models/channel_model";

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

        const existingChannel =
            await Channel.findOne({
                ownerId,
            });

        if (existingChannel) {
            res.status(400).json({
                success: false,
                message:
                    "Channel already exists",
            });
            return;
        }

        const channel =
            await Channel.create({
                ownerId,
                channelName,
                description,
                bannerUrl,
            });

        res.status(201).json({
            success: true,
            data: channel,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message:
                "Internal Server Error",
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
                message:
                    "Channel not found",
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
            message:
                "Internal Server Error",
        });
    }
};

export const subscribeChannel = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { channelId } =
            req.params;

        const { userId } =
            req.body;

        const channel =
            await Channel.findById(
                channelId
            );

        if (!channel) {
            res.status(404).json({
                success: false,
                message:
                    "Channel not found",
            });
            return;
        }

        if (
            channel.subscribedBy.includes(
                userId
            )
        ) {
            res.status(400).json({
                success: false,
                message:
                    "Already subscribed",
            });
            return;
        }

        channel.subscribedBy.push(
            userId
        );

        channel.subscribers =
            channel.subscribedBy.length;

        await channel.save();

        res.status(200).json({
            success: true,
            message:
                "Subscribed successfully",
            data: channel,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message:
                "Internal Server Error",
        });
    }
};

export const unsubscribeChannel = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { channelId } =
            req.params;

        const { userId } =
            req.body;

        const channel =
            await Channel.findById(
                channelId
            );

        if (!channel) {
            res.status(404).json({
                success: false,
                message:
                    "Channel not found",
            });
            return;
        }

        channel.subscribedBy =
            channel.subscribedBy.filter(
                (id) => id !== userId
            );

        channel.subscribers =
            channel.subscribedBy.length;

        await channel.save();

        res.status(200).json({
            success: true,
            message:
                "Unsubscribed successfully",
            data: channel,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message:
                "Internal Server Error",
        });
    }
};