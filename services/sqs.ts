import { DeleteMessageCommand, ReceiveMessageCommand, SQS } from "@aws-sdk/client-sqs";
import { S3Event } from 'aws-lambda'

import logger from '../lib/logger'
import  { updateUploadStatus } from '../controller/uploadController'

interface SQSConsumerProp {
    region: string,
    queueURL: string,
    MaxNumberOfMessage: number,
    WaitTimeSecond: number,
    credentials: {
        assessKeyId: string,
        secretAccessKey: string,
    }
}


export async function createSQSConsumer(config: SQSConsumerProp) {
    const client = new SQS({
        region: config.region,
        credentials: {
            accessKeyId: config.credentials.assessKeyId,
            secretAccessKey: config.credentials.secretAccessKey,
        },
    });
    while(true) {
        try {
            const command = new ReceiveMessageCommand({
                QueueUrl: config.queueURL,
                MaxNumberOfMessages: config.MaxNumberOfMessage,
                WaitTimeSeconds: 20,
            })
            const messages = await client.send(command);
            logger.info('New Message Arrived');
            for (let message of  (messages.Messages ?? []) ) {
                try {
                    const messages = JSON.parse(message.Body ?? '') as (S3Event );
                    if ('Event' in messages && typeof 'Event' === 'string' && messages.Event === 's3:TestEvent') {
                        await client.deleteMessage({
                            QueueUrl: config.queueURL,
                            ReceiptHandle: message.ReceiptHandle,
                        })
                        return;
                    }
                    for (let record of (messages?.Records ?? [])) {
                        if (record.eventName  === 's3:TestEvent') {
                            continue;
                        }
                        const token = record.s3.object.key.split('/')?.[1];
                        if (!token) {
                            throw new Error('Token not found');
                        }
                        const result = await updateUploadStatus(token);
                        logger.info('SQS Updated Result: ', result.matchedCount);
                    }
                    await client.deleteMessage({
                        QueueUrl: config.queueURL,
                        ReceiptHandle: message.ReceiptHandle,
                    })
                } catch (error) {
                    logger.error("==========================================================================================");
                    logger.error(message);
                    logger.error(error);
                    logger.error("==========================================================================================");
                }
            }
        } catch (error) {
            logger.error(error);
            await new Promise((resolve) => setTimeout(resolve, 10000));
        }

    }
    
}

