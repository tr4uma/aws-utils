#!/usr/bin/env node

'use strict'

const program = require('commander')

program
	.version('0.0.1')
	.command('s3upload','Upload resources to s3 bucket')
	.parse(process.argv)