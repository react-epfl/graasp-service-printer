import json
import os

S3_HOST = os.getenv('S3_HOST', '')
S3_BUCKET = os.getenv('S3_BUCKET', '')
AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID', '')
AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY', '')
TAG = os.getenv('CI_BRANCH', 'develop')
DOCKER_REPOSITORY = os.getenv('DOCKER_REPOSITORY', '')
EXECUTION_ROLE_ARN = os.getenv('EXECUTION_ROLE_ARN', '')

data = {
  'executionRoleArn': EXECUTION_ROLE_ARN,
  'containerDefinitions': [
    {
      'logConfiguration': {
        'logDriver': 'awslogs',
        'options': {
          'awslogs-group': '/ecs/graasp-printer-dev',
          'awslogs-region': 'us-east-1',
          'awslogs-stream-prefix': 'ecs',
        },
      },
      'entryPoint': [],
      'portMappings': [
        {
          'hostPort': 9696,
          'protocol': 'tcp',
          'containerPort': 9696,
        },
      ],
      'command': [],
      'cpu': 0,
      'environment': [
        {
          'name': 'S3_HOST',
          'value': S3_HOST,
        },
        {
          'name': 'S3_BUCKET',
          'value': S3_BUCKET,
        },
        {
          'name': 'AWS_ACCESS_KEY_ID',
          'value': AWS_ACCESS_KEY_ID,
        },
        {
          'name': 'AWS_SECRET_ACCESS_KEY',
          'value': AWS_SECRET_ACCESS_KEY,
        },
        {
          'name': 'GRAASP_HOST',
          'value': 'http://dev.graasp.eu',
        },
        {
          'name': 'TMP_PATH',
          'value': '/var/tmp'
        },
        {
          'name': 'DEBUG',
          'value': False
        }
      ],
      'mountPoints': [],
      'memory': 500,
      'memoryReservation': 300,
      'volumesFrom': [],
      'image': DOCKER_REPOSITORY + ':' + TAG,
      'links': [],
      'name': 'graasp-printer-dev',
    },
  ],
  'memory': '512',
  'family': 'graasp-printer-dev',
  'requiresCompatibilities': [
    'FARGATE',
  ],
  'networkMode': 'awsvpc',
  'cpu': '256',
  'volumes': [],
}

directory = os.path.join(os.path.dirname(__file__), '../tasks')
filename = os.path.join(directory, 'dev.json')

if not os.path.isdir(directory):
  os.mkdir(directory)

with open(filename, 'w+') as f:
  json.dump(data, f, ensure_ascii=False)
