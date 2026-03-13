import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

const ssmPrefix = '/game-brain/backend';

export function createSecretParameter(name: string, value: pulumi.Input<string>) {
  return new aws.ssm.Parameter(name, {
    name: `${ssmPrefix}/${name}`,
    type: 'SecureString',
    value,
  });
}
