import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

import type { ScheduledLambdaConfig } from './lambda';
import { buildScheduledLambdaOptions, createScheduledLambda } from './lambda';
import { createSecretParameter } from './ssmParams';

const config = new pulumi.Config();
const databaseUrl = config.requireSecret('databaseUrl');
const directUrl = config.requireSecret('directUrl');
const jwtSecret = config.requireSecret('jwtSecret');
const adminSecret = config.requireSecret('adminSecret');
const graphqlHiveAccessToken = config.requireSecret('graphqlHiveAccessToken');
const redisUsername = config.requireSecret('redisUsername');
const redisPassword = config.requireSecret('redisPassword');
const redisHost = config.requireSecret('redisHost');
const redisPort = config.requireSecret('redisPort');
const newRelicLicenseKey = config.requireSecret('newRelicLicenseKey');
const newRelicAppName = config.requireSecret('newRelicAppName');
/** Optional: EC2 key pair name for SSH (create in EC2 → Key Pairs, then set and redeploy). */
const keyName = config.get('keyName');

const lambdasConfig = (config.getObject<ScheduledLambdaConfig[]>('lambdas') ??
  []) as ScheduledLambdaConfig[];

const awsConfig = new pulumi.Config('aws');
const region = awsConfig.get('region') || 'us-east-1';

// Use default VPC and first subnet (public in default VPC)
const defaultVpc = aws.ec2.getVpc({ default: true });
const defaultSubnetIds = defaultVpc.then((v) =>
  aws.ec2.getSubnets({ filters: [{ name: 'vpc-id', values: [v.id] }] }),
);
const subnetId = defaultSubnetIds.then((s) => s.ids[0]);
const vpcId = defaultVpc.then((v) => v.id);

// Get current AWS account for ECR and IAM
const callerIdentity = aws.getCallerIdentity({});
const accountId = callerIdentity.then((id) => id.accountId);

// ECR repository for the backend Docker image (workflow pushes here)
const ecrRepo = new aws.ecr.Repository('backend', {
  name: 'game-brain-backend',
  imageTagMutability: 'MUTABLE',
  forceDelete: true,
});

const ecrRepoUrl = ecrRepo.repositoryUrl;
const imageUri = pulumi.interpolate`${accountId}.dkr.ecr.${region}.amazonaws.com/${ecrRepo.name}:latest`;

// SSM parameters for secrets
const dbParam = createSecretParameter('databaseUrl', databaseUrl);
const directParam = createSecretParameter('directUrl', directUrl);
const jwtParam = createSecretParameter('jwtSecret', jwtSecret);
const adminSecretParam = createSecretParameter('adminSecret', adminSecret);
const graphqlHiveAccessTokenParam = createSecretParameter(
  'graphqlHiveAccessToken',
  graphqlHiveAccessToken,
);
const redisUsernameParam = createSecretParameter('redisUsername', redisUsername);
const redisPasswordParam = createSecretParameter('redisPassword', redisPassword);
const redisHostParam = createSecretParameter('redisHost', redisHost);
const redisPortParam = createSecretParameter('redisPort', redisPort);
const newRelicLicenseKeyParam = createSecretParameter('newRelicLicenseKey', newRelicLicenseKey);
const newRelicAppNameParam = createSecretParameter('newRelicAppName', newRelicAppName);

// --- ECS task execution role (ECR pull + SSM read for task secrets) ---
const taskExecutionRole = new aws.iam.Role('ecsTaskExecutionRole', {
  assumeRolePolicy: JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'sts:AssumeRole',
        Effect: 'Allow',
        Principal: { Service: 'ecs-tasks.amazonaws.com' },
      },
    ],
  }),
});

new aws.iam.RolePolicyAttachment('taskExecutionRoleECR', {
  role: taskExecutionRole.name,
  policyArn: 'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
});

new aws.iam.RolePolicy('taskExecutionSsm', {
  role: taskExecutionRole.id,
  policy: pulumi
    .all([
      dbParam.arn,
      directParam.arn,
      jwtParam.arn,
      adminSecretParam.arn,
      graphqlHiveAccessTokenParam.arn,
      redisUsernameParam.arn,
      redisPasswordParam.arn,
      redisHostParam.arn,
      redisPortParam.arn,
      newRelicLicenseKeyParam.arn,
      newRelicAppNameParam.arn,
    ])
    .apply((arns) =>
      JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['ssm:GetParameter', 'ssm:GetParameters'],
            Resource: arns,
          },
        ],
      }),
    ),
});

// --- Instance role for ECS container instance (ECS for EC2 + ECR pull + SSM) ---
const instanceRole = new aws.iam.Role('ecsInstanceRole', {
  assumeRolePolicy: JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'sts:AssumeRole',
        Effect: 'Allow',
        Principal: { Service: 'ec2.amazonaws.com' },
      },
    ],
  }),
});

new aws.iam.RolePolicyAttachment('instanceRoleEcs', {
  role: instanceRole.name,
  policyArn: 'arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role',
});

new aws.iam.RolePolicy('instanceEcrPull', {
  role: instanceRole.id,
  policy: pulumi.interpolate`{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Action": ["ecr:GetAuthorizationToken"],
      "Resource": "*"
    }, {
      "Effect": "Allow",
      "Action": [
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage"
      ],
      "Resource": "${ecrRepo.arn}"
    }]
  }`,
});

new aws.iam.RolePolicy('instanceSsmParams', {
  role: instanceRole.id,
  policy: pulumi
    .all([
      dbParam.arn,
      directParam.arn,
      jwtParam.arn,
      adminSecretParam.arn,
      graphqlHiveAccessTokenParam.arn,
      redisUsernameParam.arn,
      redisPasswordParam.arn,
      redisHostParam.arn,
      redisPortParam.arn,
      newRelicLicenseKeyParam.arn,
      newRelicAppNameParam.arn,
    ])
    .apply((arns) =>
      JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['ssm:GetParameter', 'ssm:GetParameters'],
            Resource: arns,
          },
        ],
      }),
    ),
});

const instanceProfile = new aws.iam.InstanceProfile('ecsInstanceProfile', {
  role: instanceRole.name,
});

// Security group: SSH (optional), app port from anywhere
const sg = new aws.ec2.SecurityGroup('backendSg', {
  vpcId: vpcId,
  description: 'Game brain backend - port 8080 for Cloudflare proxy',
  ingress: [
    {
      protocol: 'tcp',
      fromPort: 8080,
      toPort: 8080,
      cidrBlocks: ['0.0.0.0/0'],
      description: 'GraphQL (Cloudflare DNS proxy)',
    },
    { protocol: 'tcp', fromPort: 22, toPort: 22, cidrBlocks: ['0.0.0.0/0'], description: 'SSH' },
  ],
  egress: [
    {
      protocol: '-1',
      fromPort: 0,
      toPort: 0,
      cidrBlocks: ['0.0.0.0/0'],
      description: 'All outbound',
    },
  ],
});

// Elastic IP (associated with instance via EipAssociation below)
const eip = new aws.ec2.Eip('backendEip', {
  domain: 'vpc',
});

// ECS cluster
const cluster = new aws.ecs.Cluster('backend', {
  name: 'game-brain-backend',
});

// ECS-optimized AMI (Amazon Linux 2023, arm64 to match t4g.small)
const ecsAmiId = aws.ssm.getParameter({
  name: '/aws/service/ecs/optimized-ami/amazon-linux-2023/arm64/recommended/image_id',
});

const instance = new aws.ec2.Instance('backend', {
  ami: ecsAmiId.then((parameter) => parameter.value),
  instanceType: 't4g.small',
  subnetId,
  vpcSecurityGroupIds: [sg.id],
  iamInstanceProfile: instanceProfile.name,
  userData: cluster.name.apply((clusterName) =>
    Buffer.from(
      `#!/bin/bash
echo ECS_CLUSTER=${clusterName} >> /etc/ecs/ecs.config
`,
      'utf-8',
    ).toString('base64'),
  ),
  ...(keyName ? { keyName } : {}),
  rootBlockDevice: {
    volumeSize: 30,
    volumeType: 'gp3',
  },
  tags: {
    Name: 'game-brain-backend',
  },
});

new aws.ec2.EipAssociation('backendEipAssoc', {
  instanceId: instance.id,
  allocationId: eip.allocationId,
});

// Task definition: host network, image :latest, secrets from SSM (no CloudWatch; logs on instance)
const taskDefinition = new aws.ecs.TaskDefinition('backend', {
  family: 'game-brain-backend',
  networkMode: 'host',
  requiresCompatibilities: ['EC2'],
  runtimePlatform: {
    cpuArchitecture: 'ARM64',
  },
  cpu: '512',
  memory: '512',
  executionRoleArn: taskExecutionRole.arn,
  containerDefinitions: pulumi
    .all([
      imageUri,
      dbParam.name,
      directParam.name,
      jwtParam.name,
      adminSecretParam.name,
      graphqlHiveAccessTokenParam.name,
      redisUsernameParam.name,
      redisPasswordParam.name,
      redisHostParam.name,
      redisPortParam.name,
      newRelicLicenseKeyParam.name,
      newRelicAppNameParam.name,
    ])
    .apply(
      ([
        img,
        dbName,
        directName,
        jwtName,
        adminSecretName,
        hiveTokenName,
        redisUsernameName,
        redisPasswordName,
        redisHostName,
        redisPortName,
        newRelicLicenseKeyName,
        newRelicAppNameName,
      ]) =>
        JSON.stringify([
          {
            name: 'backend',
            image: img,
            essential: true,
            portMappings: [{ containerPort: 8080, hostPort: 8080, protocol: 'tcp' }],
            environment: [{ name: 'PORT', value: '8080' }],
            secrets: [
              { name: 'DATABASE_URL', valueFrom: dbName },
              { name: 'DIRECT_URL', valueFrom: directName },
              { name: 'JWT_SECRET', valueFrom: jwtName },
              { name: 'ADMIN_SECRET', valueFrom: adminSecretName },
              { name: 'GRAPHQL_HIVE_ACCESS_TOKEN', valueFrom: hiveTokenName },
              { name: 'REDIS_USERNAME', valueFrom: redisUsernameName },
              { name: 'REDIS_PASSWORD', valueFrom: redisPasswordName },
              { name: 'REDIS_HOST', valueFrom: redisHostName },
              { name: 'REDIS_PORT', valueFrom: redisPortName },
              { name: 'NEW_RELIC_LICENSE_KEY', valueFrom: newRelicLicenseKeyName },
              { name: 'NEW_RELIC_APP_NAME', valueFrom: newRelicAppNameName },
            ],
          },
        ]),
    ),
});

// ECS service: one task on EC2, no ALB
const service = new aws.ecs.Service('backend', {
  name: 'game-brain-backend',
  cluster: cluster.arn,
  taskDefinition: taskDefinition.arn,
  desiredCount: 1,
  launchType: 'EC2',
  schedulingStrategy: 'REPLICA',
  deploymentMinimumHealthyPercent: 0,
  deploymentMaximumPercent: 200,
});

// Origin URL for reference (e.g. point api.game-brain.net A record to this IP; Cloudflare proxy handles HTTPS)
export const ec2OriginUrl = pulumi.interpolate`http://${eip.publicIp}:8080`;

lambdasConfig.forEach((entry) => {
  createScheduledLambda(buildScheduledLambdaOptions(entry, { ec2OriginUrl, adminSecretParam }));
});

export const ecrRepositoryUrl = ecrRepoUrl;
export const ecrRepositoryName = ecrRepo.name;
export const ecsClusterName = cluster.name;
export const ecsServiceName = service.name;
