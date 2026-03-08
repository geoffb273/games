import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

const config = new pulumi.Config();
const databaseUrl = config.requireSecret('databaseUrl');
const directUrl = config.requireSecret('directUrl');
const jwtSecret = config.requireSecret('jwtSecret');
/** Optional: EC2 key pair name for SSH (create in EC2 → Key Pairs, then set and redeploy). */
const keyName = config.get('keyName');

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
const ssmPrefix = '/game-brain/backend';
const dbParam = new aws.ssm.Parameter('databaseUrl', {
  name: `${ssmPrefix}/databaseUrl`,
  type: 'SecureString',
  value: databaseUrl,
});
const directParam = new aws.ssm.Parameter('directUrl', {
  name: `${ssmPrefix}/directUrl`,
  type: 'SecureString',
  value: directUrl,
});
const jwtParam = new aws.ssm.Parameter('jwtSecret', {
  name: `${ssmPrefix}/jwtSecret`,
  type: 'SecureString',
  value: jwtSecret,
});

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

const _taskExecutionSsmPolicy = new aws.iam.RolePolicy('taskExecutionSsm', {
  role: taskExecutionRole.id,
  policy: pulumi.all([dbParam.arn, directParam.arn, jwtParam.arn]).apply((arns) =>
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

const _instanceEcrPolicy = new aws.iam.RolePolicy('instanceEcrPull', {
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

const _instanceSsmPolicy = new aws.iam.RolePolicy('instanceSsmParams', {
  role: instanceRole.id,
  policy: pulumi.all([dbParam.arn, directParam.arn, jwtParam.arn]).apply((arns) =>
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
  description: 'Game brain backend - port 4000 for Cloudflare Worker',
  ingress: [
    {
      protocol: 'tcp',
      fromPort: 4000,
      toPort: 4000,
      cidrBlocks: ['0.0.0.0/0'],
      description: 'GraphQL (Cloudflare Worker)',
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

// Elastic IP (allocated first; associated in instance user data)
const eip = new aws.ec2.Eip('backendEip', {
  domain: 'vpc',
});

// ECS cluster
const cluster = new aws.ecs.Cluster('backend', {
  name: 'game-brain-backend',
});

// ECS-optimized AMI (Amazon Linux 2)
const ecsAmi = aws.ec2.getAmi({
  mostRecent: true,
  owners: ['amazon'],
  filters: [{ name: 'name', values: ['amzn2-ami-ecs-hvm-2.0.*'] }],
});

const launchTemplateUserData = pulumi
  .all([cluster.name, eip.allocationId])
  .apply(([clusterName, allocationId]) => {
    return Buffer.from(
      `#!/bin/bash
echo ECS_CLUSTER=${clusterName} >> /etc/ecs/ecs.config
INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)
aws ec2 associate-address --instance-id "$INSTANCE_ID" --allocation-id ${allocationId} --region ${region}
`,
      'utf-8',
    ).toString('base64');
  });

const launchTemplate = new aws.ec2.LaunchTemplate('backend', {
  namePrefix: 'game-brain-backend-',
  imageId: ecsAmi.then((a) => a.id),
  instanceType: 't2.micro',
  iamInstanceProfile: { arn: instanceProfile.arn },
  vpcSecurityGroupIds: [sg.id],
  userData: launchTemplateUserData,
  ...(keyName ? { keyName } : {}),
  blockDeviceMappings: [
    {
      deviceName: '/dev/xvda',
      ebs: {
        volumeSize: 20,
        volumeType: 'gp3',
      },
    },
  ],
  tagSpecifications: [
    {
      resourceType: 'instance',
      tags: {
        Name: 'game-brain-backend',
      },
    },
  ],
});

const _asg = new aws.autoscaling.Group('backend', {
  name: 'game-brain-backend',
  minSize: 1,
  maxSize: 1,
  desiredCapacity: 1,
  vpcZoneIdentifiers: [subnetId],
  launchTemplate: {
    id: launchTemplate.id,
    version: '$Latest',
  },
  tags: [
    {
      key: 'Name',
      value: 'game-brain-backend',
      propagateAtLaunch: true,
    },
  ],
});

// Task definition: host network, image :latest, secrets from SSM (no CloudWatch; logs on instance)
const taskDefinition = new aws.ecs.TaskDefinition('backend', {
  family: 'game-brain-backend',
  networkMode: 'host',
  requiresCompatibilities: ['EC2'],
  cpu: '256',
  memory: '512',
  executionRoleArn: taskExecutionRole.arn,
  containerDefinitions: pulumi
    .all([imageUri, dbParam.name, directParam.name, jwtParam.name])
    .apply(([img, dbName, directName, jwtName]) =>
      JSON.stringify([
        {
          name: 'backend',
          image: img,
          essential: true,
          portMappings: [{ containerPort: 4000, hostPort: 4000, protocol: 'tcp' }],
          environment: [{ name: 'PORT', value: '4000' }],
          secrets: [
            { name: 'DATABASE_URL', valueFrom: dbName },
            { name: 'DIRECT_URL', valueFrom: directName },
            { name: 'JWT_SECRET', valueFrom: jwtName },
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
});

// Export for Cloudflare Worker: origin URL (HTTP) to point at EIP:4000
export const ec2OriginUrl = pulumi.interpolate`http://${eip.publicIp}:4000`;
export const ecrRepositoryUrl = ecrRepoUrl;
export const ecrRepositoryName = ecrRepo.name;
export const ecsClusterName = cluster.name;
export const ecsServiceName = service.name;
