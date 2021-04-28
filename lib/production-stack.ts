import * as cdk from '@aws-cdk/core';
import { Runtime, Code } from '@aws-cdk/aws-lambda';
import { EventField } from '@aws-cdk/aws-events';

import { SlackSNS } from './slack-sns-construct';
import { ConnectPipelineToSns } from './connect-codepipeline-to-sns';

import { language } from './config/language';
import { CODEPIPELINE_DETAIL_TYPE } from './config/codepipeline';
import { SUCCESS_COLOR, CONFIRM_COLOR, FAIL_COLOR } from './config/slack';

export class ProductionStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const slackSns = new SlackSNS(this, 'AdpCiCd', {
      topicProps: {
        topicName: 'ADP-CICD-Slck',
        displayName: 'AD Platform CD/CD Slack',
      },
      lambdaProps: {
        runtime: Runtime.NODEJS_14_X,
        code: Code.fromAsset('lambda'),
        handler: 'send-slack-message.handler',
      },
    });

    const stage = EventField.fromPath('$.detail.stage');
    const action = EventField.fromPath('$.detail.action');
    const state = EventField.fromPath('$.detail.state');
    const failMessage = `${stage} ${action} ${state}`;

    const { PRODUCTION } = language;

    // ssp_database SQL
    new ConnectPipelineToSns(this, 'ADPlatform-SQL', {
      snsTopic: slackSns.topic,
      codepipelineArn: process.env.ARN_PIPELINE_PRODUCTION || '',
      eventOptions: [
        // Manual Notice
        {
          data: {
            color: CONFIRM_COLOR,
            author_name: PRODUCTION.MANUAL_REQ,
            text: PRODUCTION.MANUAL_DESC,
          },
          eventPattern: {
            detailType: [CODEPIPELINE_DETAIL_TYPE.ACTION],
            detail: { state: ['STARTED'], stage: ['Manual_Approve'] },
          },
        },
        // Staging Success Message
        {
          data: { color: SUCCESS_COLOR, author_name: PRODUCTION.DEPLOY },
          eventPattern: {
            detailType: [CODEPIPELINE_DETAIL_TYPE.STAGE],
            detail: { state: ['SUCCEEDED'], stage: ['Deploy'] },
          },
        },
        // All Fail Message
        {
          data: { color: FAIL_COLOR, author_name: failMessage },
          eventPattern: {
            detailType: [CODEPIPELINE_DETAIL_TYPE.ACTION],
            detail: { state: ['FAILED', 'CANCELED', 'ABANDONED'] },
          },
        },
      ],
    });
  }
}

// CodePipeline Event Detail
// https://docs.aws.amazon.com/codepipeline/latest/userguide/detect-state-changes-cloudwatch-events.html
