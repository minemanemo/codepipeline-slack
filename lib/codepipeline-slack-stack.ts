import * as cdk from '@aws-cdk/core';
import { Runtime, Code } from '@aws-cdk/aws-lambda';
import { EventField } from '@aws-cdk/aws-events';

import { SlackSNS } from './slack-sns-construct';
import { ConnectPipelineToSns } from './connect-codepipeline-to-sns';

export class CodepipelineSlackStack extends cdk.Stack {
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

    new ConnectPipelineToSns(this, 'ADPlatform-SQL', {
      snsTopic: slackSns.topic,
      codepipelineArn: `arn:aws:codepipeline:ap-northeast-2:643250700441:ADPlatform-SQL`,
      eventOptions: [
        // Develop Success Message
        {
          data: {
            color: '#69db7c',
            author_name: `develop 환경의 ssp_database SQL 적용 성공 (flyway)`,
          },
          eventPattern: {
            detailType: ['CodePipeline Stage Execution State Change'],
            detail: {
              state: ['SUCCEEDED'],
              stage: ['Apply_Develop_Enviroment'],
            },
          },
        },
        // Staging Success Message
        {
          data: {
            color: '#69db7c',
            author_name: `staging 환경의 ssp_database SQL 적용 성공 (flyway)`,
          },
          eventPattern: {
            detailType: ['CodePipeline Stage Execution State Change'],
            detail: {
              state: ['SUCCEEDED'],
              stage: ['Apply_Staging_Enviroment'],
            },
          },
        },
        // Manual Notice
        {
          data: {
            color: '#4c6ef5',
            author_name: `Staging 배포 수동 승인 요청`,
            text: `Console에서 검토 버튼 클릭 시 staging 환경 배포를 시작합니다.`,
          },
          eventPattern: {
            detailType: ['CodePipeline Action Execution State Change'],
            detail: { state: ['STARTED'], stage: ['Manual'] },
          },
        },
        // All Fail Message
        {
          data: {
            color: '#f03e3e',
            author_name: `${stage} ${action} ${state}`,
          },
          eventPattern: {
            detailType: ['CodePipeline Action Execution State Change'],
            detail: { state: ['FAILED', 'CANCELED', 'ABANDONED'] },
          },
        },
      ],
    });
  }
}

// CodePipeline Event Detail
// https://docs.aws.amazon.com/codepipeline/latest/userguide/detect-state-changes-cloudwatch-events.html
