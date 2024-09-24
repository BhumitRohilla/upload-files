import { CompleteMultipartUploadCommand, CompletedPart, CreateMultipartUploadCommand, GetObjectCommand, S3 } from '@aws-sdk/client-s3'
import { UploadPartCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import {PresignedPostOptions, createPresignedPost} from  '@aws-sdk/s3-presigned-post'
const {AWS_ENDPOINT, BUCKET_NAME, AWS_KEY, AWS_SECRETE, AWS_REGION} = process.env;

if (!AWS_ENDPOINT || !BUCKET_NAME || !AWS_KEY || !AWS_SECRETE || !AWS_REGION) {
    console.error('AWS CONFIG NOT AVAILABLE');
    process.exit()
}

const client = new S3({
    forcePathStyle: false,
    endpoint: AWS_ENDPOINT,
    region: AWS_REGION,
    credentials: {
        accessKeyId: AWS_KEY,
        secretAccessKey: AWS_SECRETE,
    }
})


export function CreatePresignedURL(location: string, contentType: string){
    const params: PresignedPostOptions  = {
        Bucket: (BUCKET_NAME as string),
        Key: location,
        Expires: 120,
        Conditions: [
            ['eq', '$Content-Type', contentType],
            ['content-length-range', 0, 20 * 1024 * 1024 * 1024],
        ],
        Fields: {
            'Content-Type': contentType,
        },
    }
    return createPresignedPost(client, params)
}

export async function CreatePresignedCommand(location: string, uploadId: string, numberOfParts: number) {
    const presignedUrls: Array<string> = new Array(numberOfParts);
    const promiseArray = [];
    for (let i = 1; i <= numberOfParts; ++i ) {
        promiseArray.push(getSignedUrl(client, new UploadPartCommand({
            Bucket: (BUCKET_NAME as string),
            Key: location,
            UploadId: uploadId,
            PartNumber: i ,
        })).then((result) => {
            presignedUrls[i - 1] = result
        }))
    }
    await Promise.all(promiseArray);
    return presignedUrls
}

export async function initiateMultipartUpload(location: string, contentType: string) {
    const command = new CreateMultipartUploadCommand({
        Bucket: (BUCKET_NAME as string),
        Key: location,
        ContentType: contentType,
    });
    const response = await client.send(command);
    const uploadId = response.UploadId;
    if (!uploadId) {
        throw new Error(`Unable to get the uploadId`);
    }
    return uploadId;
}

export async function CreatePresignedMultipartURL(location: string, fileSize: number, contentType: string) {
    const numberOfParts = Math.ceil( fileSize / (20 * 1024 * 1024))
    const uploadId = await initiateMultipartUpload(location, contentType);
    const urls = await CreatePresignedCommand(location, uploadId, numberOfParts);
    return {uploadId, urls}
}

export async function commitUploadFile(location: string, uploadId: string, parts: CompletedPart[] ) {
    const completeMultiPartUpload = new CompleteMultipartUploadCommand({
        Bucket: (BUCKET_NAME as string),
        Key: location,
        UploadId: uploadId,
        MultipartUpload: {
            Parts: parts
        }
    })
    return client.send(completeMultiPartUpload);
}


export async function getDownloadURL(location: string) {
    location = location.replace(`/${BUCKET_NAME}/`, '');
    return await getSignedUrl(client, new GetObjectCommand({
        Bucket: (BUCKET_NAME as string),
        Key: location,
        ResponseContentDisposition: 'attachment;'
    }))
}
