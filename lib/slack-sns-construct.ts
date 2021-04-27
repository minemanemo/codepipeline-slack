import { Construct } from '@aws-cdk/core';
import { Topic, TopicProps } from '@aws-cdk/aws-sns';
import { Function, FunctionProps } from '@aws-cdk/aws-lambda';
import { SnsEventSource } from '@aws-cdk/aws-lambda-event-sources';

export interface SlackSNSProps {
  topicProps: TopicProps;
  lambdaProps: FunctionProps;
}

export class SlackSNS extends Construct {
  public readonly topic: Topic;
  public readonly sendFn: Function;

  constructor(scope: Construct, id: string, props: SlackSNSProps) {
    super(scope, id);

    const topicId = `${id}Topic`;
    this.topic = new Topic(this, topicId, props.topicProps);

    const fnId = `${id}SendSlackMessage`;
    this.sendFn = new Function(this, fnId, props.lambdaProps);

    this.sendFn.addEventSource(new SnsEventSource(this.topic));
  }
}
