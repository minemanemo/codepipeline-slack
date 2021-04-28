#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';

import { DevelopmentStack } from '../lib/development-stack';
import { ProductionStack } from '../lib/production-stack';

import * as dotenv from 'dotenv';

const result = dotenv.config();

if (result.error) throw result.error;

const app = new cdk.App();
new DevelopmentStack(app, 'DevelopmentStack', {
  env: {
    account: process.env.CDK_DEVELOPMENT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

new ProductionStack(app, 'ProductionStack', {
  env: {
    account: process.env.CDK_PRODUCTION_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
