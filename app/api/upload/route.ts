import dayjs from 'dayjs';
import type { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import crypto from 'crypto';
import { CreatePresignedURL, CreatePresignedMultipartURL, CustomError } from "../../../lib";
import { validContentType } from '../../../constant';
import controller from "@/controller";
import { z, ZodError } from 'zod';
import logger from '../../../lib/logger';
import { PresignedPost } from '@aws-sdk/s3-presigned-post';
import redis, { redisConstants } from '../../../lib/redis';
import { NextResponse } from 'next/server';

const uploadSchema = z.object({
    contentType: z.string().min(1),
    fileName: z.string().optional(),
    multiPartUpload: z.boolean().optional(),
    fileSize: z.number().optional(),
});

export const POST = async (req: Request, context: any) => {
    try {
        const parsedBody = await req.json();
        const data = uploadSchema.parse(parsedBody);
        if (!validContentType.some(regex => regex.test(data.contentType))) {
            throw new CustomError(400, 'Unsupported File Type', 'The type of file you are trying to upload is not supported');
        }
        const filePath = `upload/${crypto.randomBytes(20).toString('hex')}/${data.fileName || crypto.randomBytes(20).toString('hex')}`;
        const token = crypto.randomBytes(20).toString('hex');

        const responseObj: Record<string, string | boolean | Array<string> | PresignedPost> = {
            token,
        };
        if (data.multiPartUpload && data.fileSize) {
            const { uploadId, urls } = await CreatePresignedMultipartURL(filePath, data.fileSize, data.contentType);
            await redis.multi()
                .hmset(redisConstants.getKeyForMultiPartUploadHset(token), {
                    uploadId: uploadId,
                    location: filePath,
                })
                .expire(redisConstants.getKeyForMultiPartUploadHset(token), redisConstants.multiPartUploadDataExpireTimeInSecond)
                .exec();
            responseObj.multiPart = true;
            responseObj.uploadUrls = urls;
        } else {
            responseObj.uploadUrl = await CreatePresignedURL(filePath, data.contentType);
        }
        
        await controller.UserController.addFileToUser({
            url: `${process.env.AWS_ENDPOINT}/${process.env.BUCKET_NAME}/${filePath}`,
            token,
            expireTime: dayjs().add(30, 'day').toDate(),
            contentType: data.contentType,
        });
        return NextResponse.json(responseObj);
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
};
