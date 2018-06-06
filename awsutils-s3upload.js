#!/usr/bin/env node

'use strict'
const program = require('commander')
const AWS = require('aws-sdk')
const fs = require('fs')
const path = require('path')

program
  .option('-s, --sourceDir <sourceDir>', 'Specify the directory containing all resources')
  .option('-t, --targetDir <targetDir>', 'Specify the target directory where data will be uploaded')
  .option('-c, --awsConfig <awsConfig>', 'AWS configuration file')
  .option('-s3, --s3Config <s3Config>', 'S3 configuration file')
  .option('-b, --bucketName <bucketName>', 'S3 Bucket name')
  .parse(process.argv)


const awsConfig = program.awsConfig ? program.awsConfig : __dirname+'/configs/aws/config.json'
AWS.config.loadFromPath(awsConfig)
const s3 = new AWS.S3()

const s3ConfigFile = program.s3Config ? program.s3Config : __dirname+'/configs/aws-config.json'
const s3Config = JSON.parse(fs.readFileSync(s3ConfigFile, 'utf8'))

const sourceDir = program.sourceDir ? program.sourceDir : './'
const targetDir = program.targetDir ? program.targetDir : s3Config.targetFolder
const bucketName = program.bucketName ? program.bucketName : s3Config.bucketName
const contentTypes = JSON.parse(fs.readFileSync(__dirname+'/configs/contentypes.json', 'utf8'))

readFilesFromLocalFolder(sourceDir, bucketName, targetDir, errorLogging)

async function readFilesFromLocalFolder(sourcePath, bucketName, targetPath, onError) {
  fs.readdir(sourcePath, async function(err, filenames) {
    if (err) {
      onError(err)
      return
    }
    let promises = filenames.map((fileName) => parallelUploadToS3(sourcePath, bucketName, targetPath, fileName))
    let results = await Promise.all(promises)
    console.log(results)
  })
}

function parallelUploadToS3(sourcePath, bucketName, targetPath, filename) {
  return new Promise((resolve, reject) => {
    let fileStream = fs.createReadStream(sourcePath + filename)
    let extension = path.extname(filename).substr(1)
    s3.upload({
        Bucket: bucketName,
        Key: targetPath+'/'+filename,
        Body: fileStream,
        ACL: 'public-read',
        ContentType: contentTypes[extension]
      }, function (err, data) {
        if (err) {
          console.log('ERROR UPLOADING FILE '+filename+':', err)
        } else {
          console.log('Successfully uploaded data for file '+filename)
        }
      })
  })
}

function errorLogging(err) {
  console.log(err)
}