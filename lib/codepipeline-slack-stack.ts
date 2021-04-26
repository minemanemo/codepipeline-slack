import * as cdk from '@aws-cdk/core';
import * as sns from '@aws-cdk/aws-sns';
import * as lambda from '@aws-cdk/aws-lambda';
import { SnsEventSource } from '@aws-cdk/aws-lambda-event-sources';

export class CodepipelineSlackStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const topic = new sns.Topic(this, 'AdpCicdSlackTopic', {
      topicName: 'ADP-CICD-Slck',
      displayName: 'AD Platform CD/CD Slack',
    });

    const fn = new lambda.Function(this, 'SendSlackMessage', {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'send-slack-message.handler',
    });

    fn.addEventSource(new SnsEventSource(topic));
  }
}
