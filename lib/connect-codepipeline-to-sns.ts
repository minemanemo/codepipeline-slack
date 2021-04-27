import { Construct } from '@aws-cdk/core';
import { Pipeline, IPipeline } from '@aws-cdk/aws-codepipeline';
import { Topic } from '@aws-cdk/aws-sns';
import { RuleTargetInput, EventPattern } from '@aws-cdk/aws-events';
import { SnsTopic } from '@aws-cdk/aws-events-targets';

interface SlackMessage {
  pretext?: string;
  author_name?: string;
  title?: string;
  title_link?: string;
  text?: string;
  footer?: string;
  footer_icon?: string;
  color?: string;
  actions?: Array<{ type: string; text: string; url: string }>;
}
export interface CustomEventOptions {
  data: SlackMessage;
  eventPattern: EventPattern;
}

export interface ConnectPipelineToSnsProps {
  codepipelineArn: string;
  eventOptions: CustomEventOptions[];
  snsTopic: Topic;
}

export class ConnectPipelineToSns extends Construct {
  public readonly pipeline: IPipeline;
  public readonly snsTopic: Topic;

  public readonly slackSendData: SlackMessage;
  public readonly consoleURL: string;
  public readonly footerIconURL: string;

  constructor(scope: Construct, id: string, props: ConnectPipelineToSnsProps) {
    super(scope, id);

    const { codepipelineArn, eventOptions, snsTopic } = props;
    const spArr = codepipelineArn.split(':');
    const pipelineId = spArr.length ? spArr[spArr.length - 1] : 'Unknown';

    this.pipeline = Pipeline.fromPipelineArn(this, pipelineId, codepipelineArn);
    this.snsTopic = snsTopic;
    this.consoleURL = `https://console.aws.amazon.com/codesuite/codepipeline/pipelines/${this.pipeline.pipelineName}/view?region=ap-northeast-2`;
    this.footerIconURL = `https://i2.wp.com/www.awsomeblog.com/wp-content/uploads/2016/05/aws-codepipeline.png?resize=150%2C150&ssl=1`;

    this.slackSendData = {
      pretext: `⛓ Pipeline Name : *${this.pipeline.pipelineName}*`,
      footer: 'AWS CodePipeline',
      footer_icon: this.footerIconURL,
    };
    const defaultButton = {
      type: 'button',
      text: '⚙️ Console 바로가기',
      url: this.consoleURL,
    };

    eventOptions.map((option: CustomEventOptions, index: number) => {
      const eventId = `pipelineIdEvent${index}`;
      const msgData = {
        attachments: [
          {
            ...this.slackSendData,
            ...option.data,
            actions: [defaultButton],
          },
        ],
      };
      this.pipeline.onEvent(eventId, {
        target: new SnsTopic(this.snsTopic, {
          message: RuleTargetInput.fromText(JSON.stringify(msgData)),
        }),
        eventPattern: option.eventPattern,
      });
    });
  }
}
