import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import * as path from 'path';

export type CreateScheduledLambdaOptions = {
  name: string;
  handlerSubpath: string;
  scheduleExpression: string;
  scheduleExpressionTimezone?: string;
  environment?: Record<string, pulumi.Input<string>>;
  /** Optional inline policy JSON string (e.g. for SSM GetParameter). Use pulumi.all([...]).apply(() => JSON.stringify({...})) if policy references other resources. */
  policy?: pulumi.Input<string>;
};

/**
 * Creates a Lambda function triggered on a schedule by EventBridge Scheduler.
 * Use this for cron-style jobs (e.g. daily challenge creation). Add new Lambdas
 * by adding a handler under lambdas/<name>.ts, building to lambdas/dist/<name>.js,
 * and calling this helper with the same name/handlerSubpath.
 */
export function createScheduledLambda(options: CreateScheduledLambdaOptions): aws.lambda.Function {
  const {
    name,
    handlerSubpath,
    scheduleExpression,
    scheduleExpressionTimezone,
    environment = {},
    policy,
  } = options;

  const lambdaRole = new aws.iam.Role(`${name}LambdaRole`, {
    assumeRolePolicy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: { Service: 'lambda.amazonaws.com' },
        },
      ],
    }),
  });

  new aws.iam.RolePolicyAttachment(`${name}LambdaBasicExecution`, {
    role: lambdaRole.name,
    policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
  });

  if (policy) {
    new aws.iam.RolePolicy(`${name}LambdaPolicy`, {
      role: lambdaRole.id,
      policy,
    });
  }

  // Built artifact: lambdas/dist/<handlerSubpath>.js (run pnpm build:lambdas first)
  const handlerPath = path.join(process.cwd(), 'lambdas', 'dist', `${handlerSubpath}.js`);
  const code = new pulumi.asset.AssetArchive({
    'index.js': new pulumi.asset.FileAsset(handlerPath),
  });

  const lambdaFn = new aws.lambda.Function(`${name}Lambda`, {
    name: `game-brain-${name}`,
    runtime: aws.lambda.Runtime.NodeJS18dX,
    handler: 'index.handler',
    role: lambdaRole.arn,
    code,
    timeout: 60,
    environment: {
      variables: environment as Record<string, string>,
    },
  });

  const schedulerRole = new aws.iam.Role(`${name}SchedulerRole`, {
    assumeRolePolicy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: { Service: 'scheduler.amazonaws.com' },
        },
      ],
    }),
  });

  new aws.iam.RolePolicy(`${name}SchedulerInvokeLambda`, {
    role: schedulerRole.id,
    policy: lambdaFn.arn.apply((arn) =>
      JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: 'lambda:InvokeFunction',
            Resource: arn,
          },
        ],
      }),
    ),
  });

  new aws.lambda.Permission(`${name}SchedulerPermission`, {
    action: 'lambda:InvokeFunction',
    function: lambdaFn.name,
    principal: 'scheduler.amazonaws.com',
  });

  const scheduleArgs: aws.scheduler.ScheduleArgs = {
    groupName: 'default',
    flexibleTimeWindow: { mode: 'OFF' },
    scheduleExpression,
    scheduleExpressionTimezone: scheduleExpressionTimezone ?? undefined,
    target: {
      arn: lambdaFn.arn,
      roleArn: schedulerRole.arn,
    },
  };

  new aws.scheduler.Schedule(`${name}Schedule`, scheduleArgs);

  return lambdaFn;
}

/** Scheduled Lambdas: name, handlerSubpath, scheduleExpression, scheduleExpressionTimezone (optional). Set via lambdas array in stack config. */
export type ScheduledLambdaConfig = {
  name: string;
  handlerSubpath: string;
  scheduleExpression: string;
  scheduleExpressionTimezone?: string;
};

/** Scheduled Lambdas: each entry from config gets environment/policy from stack resources by name */
export function buildScheduledLambdaOptions(
  entry: ScheduledLambdaConfig,
  resources: {
    ec2OriginUrl: pulumi.Output<string>;
    adminSecretParam: aws.ssm.Parameter;
  },
): CreateScheduledLambdaOptions {
  const base: CreateScheduledLambdaOptions = {
    name: entry.name,
    handlerSubpath: entry.handlerSubpath,
    scheduleExpression: entry.scheduleExpression,
    scheduleExpressionTimezone: entry.scheduleExpressionTimezone,
  };
  if (entry.name === 'createDailyChallenge') {
    return {
      ...base,
      environment: {
        BACKEND_GRAPHQL_URL: pulumi.interpolate`${resources.ec2OriginUrl}/graphql`,
        ADMIN_SECRET_PARAM: resources.adminSecretParam.name,
      },
      policy: resources.adminSecretParam.arn.apply((arn) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [{ Effect: 'Allow', Action: 'ssm:GetParameter', Resource: arn }],
        }),
      ),
    };
  }
  return base;
}
