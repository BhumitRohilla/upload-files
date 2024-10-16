import { findOne, updateOne, save } from '../services'
import { displaystatus } from '../constant'

export function addFileToUser(objToSave: {
    url: string,
    token: string,
    expireTime: Date,
    contentType: string,
    primeUser?: boolean,
}) {
    return save(objToSave)
}

export async function findUrlByToken(token: string): Promise<{
    url: string, token: string, expireTime: Date, contentType: string,
} | null> {
    const result = await findOne({
        token: token,
    }, {
        url: 1, token: 1, contentType: 1, displayStatus: 1,
    }, {lean: true});
    if (result) {
        return {
            url: result.url,
            token: result.token,
            expireTime: result.expireTime,
            contentType: result.contentType,
        }
    }
    return null
}

export async function updateUploadStatus(token: string) {
    return await updateOne(
        {
            token: token,
        }, {
            $set: {
                displaystatus: displaystatus.active,
            }
        }, {}
    );
}