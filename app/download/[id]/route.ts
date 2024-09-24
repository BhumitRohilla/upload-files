'use server'

import { NextResponse } from 'next/server';

import logger from '../../../lib/logger';
import { findUrlByToken } from '../../../controller/uploadController'
import {CustomError} from '../../../lib/error';
import { getDownloadURL } from '@/lib';

export const GET = async (req: Request, { params }: { params : { id: string } }) => {
    try {
    const { id } = params
        const content = await findUrlByToken(id);
        if (!content) throw new CustomError(404, 'Cannot find the file against the given token.', 'Cannot find the file against the given token.');

        const s3Url = new URL(content.url);
        const s3Path = s3Url.pathname;
        console.log(s3Path);
        const url = await getDownloadURL(s3Path);
        return NextResponse.redirect(url)
    } catch (error) {
        logger.error({ err: error }, 'Error handling file upload');
        if (error instanceof CustomError) {
            return error.constructResponse();
        } else {
            return NextResponse.json({error: 'Internal Server Error'}, { status: 500 });
        }
    }
}
