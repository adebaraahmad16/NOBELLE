import path from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { randomUUID } from 'crypto';
import { ENV } from '../config/env';
import { ApiError } from '../utils/apiError';
export const settingsAssetDirectory=()=>path.resolve(ENV.UPLOAD_DIR,'settings');
export function validateSettingsImage(file:Express.Multer.File,kind:string){
 const bytes=file.buffer;let extension='';
 if(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) && file.mimetype==='image/png' && /\.png$/i.test(file.originalname))extension='png';
 if(bytes[0]===255 && bytes[1]===216 && bytes[2]===255 && file.mimetype==='image/jpeg' && /\.jpe?g$/i.test(file.originalname))extension='jpg';
 if(bytes.toString('ascii',0,4)==='RIFF' && bytes.toString('ascii',8,12)==='WEBP' && file.mimetype==='image/webp' && /\.webp$/i.test(file.originalname))extension='webp';
 if(kind==='favicon' && bytes.length>=6 && bytes.readUInt16LE(0)===0 && bytes.readUInt16LE(2)===1 && ['image/x-icon','image/vnd.microsoft.icon'].includes(file.mimetype) && /\.ico$/i.test(file.originalname))extension='ico';
 if(!extension)throw ApiError.unprocessable('Upload a valid PNG, JPG or WEBP image. Favicons also support ICO files.');
 if(file.size>(kind==='favicon'?512*1024:5*1024*1024))throw ApiError.unprocessable(kind==='favicon'?'Favicons must be 512 KB or smaller':'Images must be 5 MB or smaller');
 if(extension==='png' && bytes.length>=24 && (bytes.readUInt32BE(16)>8192 || bytes.readUInt32BE(20)>8192))throw ApiError.unprocessable('Image dimensions must not exceed 8192 pixels');
 return extension;
}
export class SettingsAssetService{static async upload(file:Express.Multer.File|undefined,kind:string){if(!['logo','favicon','avatar','social'].includes(kind))throw ApiError.badRequest('Unsupported image type');if(!file)throw ApiError.badRequest('Choose an image');const extension=validateSettingsImage(file,kind),filename=`${randomUUID()}.${extension}`;await mkdir(settingsAssetDirectory(),{recursive:true});await writeFile(path.join(settingsAssetDirectory(),filename),file.buffer,{flag:'wx'});return {url:`/api/v1/store-assets/${filename}`};}}
