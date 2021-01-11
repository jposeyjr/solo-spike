const AWS = require('aws-sdk');
const bucketName = 'gamifyclassroom';

const s3 = new AWS.S3({
  apiVersion: '2006-03-01',
  params: { Bucket: bucketName },
});

const files = './sample.png';
if (!files.length) {
  return console.log('Please choose a file to upload');
}

const file = process.argv[2];

const fs = require('fs');
const fileStream = fs.createReadStream(file);
fileStream.on('error', function (error) {
  console.log('File upload error', error);
});
let uploadParams = { Bucket: bucketName, Key: '', Body: '' };
uploadParams.Body = fileStream;
const path = require('path');
uploadParams.Key = path.basename(file);
s3.upload(uploadParams, function (err, data) {
  if (err) {
    console.log('Error', err);
  }
  if (data) {
    console.log('Upload Success', data.Location);
  }
});
