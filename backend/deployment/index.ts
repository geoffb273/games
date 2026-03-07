import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

const config = new pulumi.Config();
const databaseUrl = config.requireSecret('databaseUrl');
const directUrl = config.requireSecret('directUrl');
const jwtSecret = config.requireSecret('jwtSecret');

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

// SSM parameters for secrets (EC2 user data will fetch at boot)
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

// IAM role for EC2: allow ECR pull and SSM read
const ec2Role = new aws.iam.Role('ec2Role', {
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

new aws.iam.RolePolicyAttachment('ec2RoleSSM', {
  role: ec2Role.name,
  policyArn: 'arn:aws:iam::aws:policy/AmazonSSMReadOnlyAccess',
});

const _ecrPolicy = new aws.iam.RolePolicy('ec2EcrPull', {
  role: ec2Role.id,
  policy: pulumi.interpolate`{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken"
      ],
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

// Allow EC2 to read our SSM parameters
const _ssmPolicy = new aws.iam.RolePolicy('ec2SsmParams', {
  role: ec2Role.id,
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

const instanceProfile = new aws.iam.InstanceProfile('ec2Profile', {
  role: ec2Role.name,
});

// Security group: SSH (optional), app port from anywhere (Cloudflare Worker or 0.0.0.0/0)
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

const imageUri = pulumi.interpolate`${accountId}.dkr.ecr.${region}.amazonaws.com/${ecrRepo.name}:latest`;

const userData = pulumi
  .all([accountId, imageUri, dbParam.name, directParam.name, jwtParam.name])
  .apply(([aid, img, dbName, directName, jwtName]) => {
    return `#!/bin/bash
set -e
yum update -y
yum install -y docker
systemctl enable docker
systemctl start docker

# Login to ECR and pull image
aws ecr get-login-password --region ${region} | docker login --username AWS --password-stdin ${aid}.dkr.ecr.${region}.amazonaws.com
docker pull ${img} || true

# Fetch secrets from SSM
export DATABASE_URL=$(aws ssm get-parameter --name "${dbName}" --with-decryption --query Parameter.Value --output text)
export DIRECT_URL=$(aws ssm get-parameter --name "${directName}" --with-decryption --query Parameter.Value --output text)
export JWT_SECRET=$(aws ssm get-parameter --name "${jwtName}" --with-decryption --query Parameter.Value --output text)
export PORT=4000

# Run backend (restart on failure)
docker run -d --restart unless-stopped -p 4000:4000 \\
  -e DATABASE_URL -e DIRECT_URL -e JWT_SECRET -e PORT \\
  --name backend ${img}
`;
  });

const ami = aws.ec2.getAmi({
  mostRecent: true,
  owners: ['amazon'],
  filters: [{ name: 'name', values: ['al2023-ami-*-kernel-*-x86_64'] }],
});

const instance = new aws.ec2.Instance('backend', {
  instanceType: 't2.micro',
  ami: ami.then((a) => a.id),
  subnetId: subnetId,
  vpcSecurityGroupIds: [sg.id],
  iamInstanceProfile: instanceProfile.name,
  userData: userData,
  tags: {
    Name: 'game-brain-backend',
  },
});

const eip = new aws.ec2.Eip('backendEip', {
  instance: instance.id,
  domain: 'vpc',
});

// Export for Cloudflare Worker: origin URL (HTTP) to point at EC2
export const ec2OriginUrl = pulumi.interpolate`http://${eip.publicIp}:4000`;
export const ecrRepositoryUrl = ecrRepoUrl;
export const ecrRepositoryName = ecrRepo.name;
export const instanceId = instance.id;
