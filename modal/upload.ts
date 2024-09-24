import { displaystatus } from '../constant';
import mongoose, { Schema } from 'mongoose'

const schema = new Schema({
    'token': {type: String, required: true},
    'url': {type: String, required: true},
    'expireTime': {type: String, required: true},
    'primeUser': {type: String, default: false}, // this could be identifiable information
    'contentType': {type: String, required: true},
    'displayStatus': {type: Number, required: true, default: displaystatus.active}
}, {timestamps: true})
schema.index({token: 1}, {background: true, unique: true});

const UploadModel = mongoose.models.uploads || mongoose.model('uploads', schema);
export default UploadModel;