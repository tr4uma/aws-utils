#!/usr/bin/env node

'use strict'
const program = require('commander')
const AWS = require('aws-sdk')
const fs = require('fs')

program
  .option('-s, --source <sourceDir>', 'Specify the directory containing all resources')
  .option('-t, --target <targetDir>', 'Specify the target directory where data will be uploaded')
  .option('-c, --config <awsConfig>', 'AWS configuration file')
  .option('-b, --bucket <bucketName>', 'S3 Bucket name')
  .parse(process.argv)


const awsConfig = program.config === undefined ? __dirname+'/configs/aws/config.json' : program.config
AWS.config.loadFromPath(__dirname+'/configs/aws/config.json')
const s3 = new AWS.S3()

const s3ConfigFile = program.awsConfig === undefined ? __dirname+'/configs/aws-config.json' : program.awsConfig
const s3Config = JSON.parse(fs.readFileSync(__dirname+'/configs/aws-config.json', 'utf8'))

const sourceDir = program.sourceDir ? program.sourceDir : './'
const targetDir = program.targetDir ? program.targetDir : s3Config.targetFolder
const bucketName = program.bucketName ? program.bucketName : s3Config.bucketName

readFilesFromLocalFolder(sourceDir, targetDir, errorLogging)

async function readFilesFromLocalFolder(sourcePath, bucketName, targetPath, onError) {
  fs.readdir(folderPath, async function(err, filenames) {
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
    s3.upload({
        Bucket: bucketName,
        Key: targetPath+'/'+filename,
        Body: fileStream,
        ACL: 'public-read',
        ContentType: 'image/jpeg'
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