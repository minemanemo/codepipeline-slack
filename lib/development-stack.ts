import * as cdk from '@aws-cdk/core';
import { Runtime, Code } from '@aws-cdk/aws-lambda';
import { EventField } from '@aws-cdk/aws-events';

import { SlackSNS } from './slack-sns-construct';
import { ConnectPipelineToSns } from './connect-codepipeline-to-sns';

import { language } from './config/language';
import { CODEPIPELINE_DETAIL_TYPE } from './config/codepipeline';
import { SUCCESS_COLOR, CONFIRM_COLOR, FAIL_COLOR } from './config/slack';

export class DevelopmentStack extends cdk.Stack {
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

    const { SSP_DB_SQL, DSP_AD_APP, SSP_CORE, MOTOV_AUTH } = language;

    // ssp_database SQL
    new ConnectPipelineToSns(this, 'ADPlatform-SQL', {
      snsTopic: slackSns.topic,
      codepipelineArn: process.env.ARN_PIPELINE_SSP_DATABASE || '',
      eventOptions: [
        // Develop Success Message
        {
          data: { color: SUCCESS_COLOR, author_name: SSP_DB_SQL.SUCCESS_DEV },
          eventPattern: {
            detailType: [CODEPIPELINE_DETAIL_TYPE.STAGE],
            detail: {
              state: ['SUCCEEDED'],
              stage: ['Apply_Develop_Enviroment'],
            },
          },
        },
        // Staging Success Message
        {
          data: { color: SUCCESS_COLOR, author_name: SSP_DB_SQL.SUCCESS_STG },
          eventPattern: {
            detailType: [CODEPIPELINE_DETAIL_TYPE.STAGE],
            detail: {
              state: ['SUCCEEDED'],
              stage: ['Apply_Staging_Enviroment'],
            },
          },
        },
        // Manual Notice
        {
          data: {
            color: CONFIRM_COLOR,
            author_name: SSP_DB_SQL.MANUAL_REQ,
            text: SSP_DB_SQL.MANUAL_DESC,
          },
          eventPattern: {
            detailType: [CODEPIPELINE_DETAIL_TYPE.ACTION],
            detail: { state: ['STARTED'], stage: ['Manual'] },
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

    // dsp-ad-app
    new ConnectPipelineToSns(this, 'DSP-AD-APP', {
      snsTopic: slackSns.topic,
      codepipelineArn: process.env.ARN_PIPELINE_DSP_AD_APP || '',
      eventOptions: [
        // Develop Success Message
        {
          data: {
            color: SUCCESS_COLOR,
            author_name: DSP_AD_APP.SUCCESS_DEV,
            actions: [
              {
                type: 'button',
                text: '🛠 광고주 사이트 - develop',
                url: 'http://dev-ad.motov.co.kr',
              },
            ],
          },
          eventPattern: {
            detailType: [CODEPIPELINE_DETAIL_TYPE.STAGE],
            detail: {
              state: ['SUCCEEDED'],
              stage: ['Deploy'],
            },
          },
        },
        // Staging Success Message
        {
          data: {
            color: SUCCESS_COLOR,
            author_name: DSP_AD_APP.SUCCESS_STG,
            actions: [
              {
                type: 'button',
                text: '🛠 광고주 사이트 - QA',
                url: 'http://qa-ad.motov.co.kr/',
              },
            ],
          },
          eventPattern: {
            detailType: [CODEPIPELINE_DETAIL_TYPE.STAGE],
            detail: {
              state: ['SUCCEEDED'],
              stage: ['Deploy_Staging'],
            },
          },
        },
        // Manual Notice
        {
          data: {
            color: CONFIRM_COLOR,
            author_name: DSP_AD_APP.MANUAL_REQ,
            text: DSP_AD_APP.MANUAL_DESC,
          },
          eventPattern: {
            detailType: [CODEPIPELINE_DETAIL_TYPE.ACTION],
            detail: { state: ['STARTED'], stage: ['Manual_Approval'] },
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

    // ssp-core
    new ConnectPipelineToSns(this, 'SSP-CORE', {
      snsTopic: slackSns.topic,
      codepipelineArn: process.env.ARN_PIPELINE_SSP_CORE || '',
      eventOptions: [
        // Develop Success Message
        {
          data: { color: SUCCESS_COLOR, author_name: SSP_CORE.SUCCESS_DEV },
          eventPattern: {
            detailType: [CODEPIPELINE_DETAIL_TYPE.STAGE],
            detail: {
              state: ['SUCCEEDED'],
              stage: ['Deploy'],
            },
          },
        },
        // Staging Success Message
        {
          data: { color: SUCCESS_COLOR, author_name: SSP_CORE.SUCCESS_STG },
          eventPattern: {
            detailType: [CODEPIPELINE_DETAIL_TYPE.STAGE],
            detail: {
              state: ['SUCCEEDED'],
              stage: ['Deploy_Staging'],
            },
          },
        },
        // Manual Notice
        {
          data: {
            color: CONFIRM_COLOR,
            author_name: SSP_CORE.MANUAL_REQ,
            text: SSP_CORE.MANUAL_DESC,
          },
          eventPattern: {
            detailType: [CODEPIPELINE_DETAIL_TYPE.ACTION],
            detail: { state: ['STARTED'], stage: ['Manual_Approval'] },
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

    // motov-auth
    new ConnectPipelineToSns(this, 'MOTOV-AUTH', {
      snsTopic: slackSns.topic,
      codepipelineArn: process.env.ARN_PIPELINE_MOTOV_AUTH || '',
      eventOptions: [
        // Develop Success Message
        {
          data: { color: SUCCESS_COLOR, author_name: MOTOV_AUTH.SUCCESS_DEV },
          eventPattern: {
            detailType: [CODEPIPELINE_DETAIL_TYPE.STAGE],
            detail: { state: ['SUCCEEDED'], stage: ['Deploy'] },
          },
        },
        // Staging Success Message
        {
          data: { color: SUCCESS_COLOR, author_name: MOTOV_AUTH.SUCCESS_STG },
          eventPattern: {
            detailType: [CODEPIPELINE_DETAIL_TYPE.STAGE],
            detail: { state: ['SUCCEEDED'], stage: ['Deploy_Staging'] },
          },
        },
        // Manual Notice
        {
          data: {
            color: CONFIRM_COLOR,
            author_name: MOTOV_AUTH.MANUAL_REQ,
            text: MOTOV_AUTH.MANUAL_DESC,
          },
          eventPattern: {
            detailType: [CODEPIPELINE_DETAIL_TYPE.ACTION],
            detail: { state: ['STARTED'], stage: ['Manual_Approval'] },
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
