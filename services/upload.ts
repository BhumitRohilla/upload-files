import { FilterQuery, QueryOptions, Document} from 'mongoose';
import { connectDB } from '../lib/dbConnection'
import Model from '../modal/index'

const {UploadModal} = Model;

export async function save(obj: {token: string, url: string}){
    await connectDB();
    return new UploadModal(obj).save();
}

export async function findOne(criteria: any,projection: {[key: string]: 1 | -1}, options: QueryOptions) {
    await connectDB();
    return UploadModal.findOne(criteria, projection, options);
}
