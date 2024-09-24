'use server'

import { CustomError, commitUploadFile } from "@/lib";
import { z, ZodError } from 'zod';
import logger from '../../../lib/logger';
import redis, { redisConstants } from "@/lib/redis";
import { NextResponse } from "next/server";

// Define the schema for multipart upload completion
const multiPartUploadSchema = z.object({
    token: z.string().min(1, "Token is required"),
    parts: z.array(z.object({
        ETag: z.string().min(1, "ETag is required"),
        PartNumber: z.number().min(1, "Part number must be a positive integer")
    })).nonempty("Parts cannot be empty")
});

export const POST = async (req: Request) => {
    try {
        const body = await req.json();
        const data = multiPartUploadSchema.parse(body);
        const { token, parts } = data;
        const metaData = await redis.hgetall(redisConstants.getKeyForMultiPartUploadHset(token));
        await commitUploadFile(metaData['location'], metaData['uploadId'], parts);
        return NextResponse.json({ msg: 'Success'}, { status: 200 });
    } catch (error) {
        logger.error({ err: error }, 'Error handling file upload');
        if (error instanceof ZodError) {
            return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 })
        } else if (error instanceof CustomError) {
            return error.constructResponse();
        } else {
            return NextResponse.json({error: 'Internal Server Error'}, { status: 500 });
        }
    }
}
