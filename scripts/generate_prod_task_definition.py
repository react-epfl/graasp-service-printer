import json
import os

MONGODB_URI = os.getenv('MONGODB_URI', '')
SESSION_SECRET = os.getenv('SESSION_SECRET', '')
TAG = os.getenv('CI_BRANCH', 'master')

data = {
  'executionRoleArn': 'arn:aws:iam::743256016950:role/ecsTaskExecutionRole',
  'containerDefinitions': [
    {
      'logConfiguration': {
        'logDriver': 'awslogs',
        'options': {
          'awslogs-group': '/ecs/graasp-api-prod',
          'awslogs-region': 'us-east-1',
          'awslogs-stream-prefix': 'ecs',
        },
      },
      'entryPoint': [],
      'portMappings': [
        {
          'hostPort': 7000,
          'protocol': 'tcp',
          'containerPort': 7000,
        },
      ],
      'command': [],
      'cpu': 0,
      'environment': [
        {
          'name': 'SESSION_SECRET',
          'value': SESSION_SECRET,
        },
        {
          'name': 'MONGODB_URI',
          'value': MONGODB_URI,
        },
        {
          'name': 'NAME',
          'value': 'Graasp API',
        },
        {
          'name': 'GRAASP_HOST',
          'value': 'graasp.eu',
        },
        {
          'name': 'GRAASP_DOMAIN',
          'value': 'graasp.eu'
        }
      ],
      'mountPoints': [],
      'memory': 500,
      'memoryReservation': 300,
      'volumesFrom': [],
      'image': '743256016950.dkr.ecr.us-east-1.amazonaws.com/graasp/api:' + TAG,
      'links': [],
      'name': 'graasp-api-prod',
    },
  ],
  'memory': '512',
  'family': 'graasp-api-prod',
  'requiresCompatibilities': [
    'FARGATE',
  ],
  'networkMode': 'awsvpc',
  'cpu': '256',
  'volumes': [],
}

directory = os.path.join(os.path.dirname(__file__), '../tasks')
filename = os.path.join(directory, 'prod.json')

if not os.path.isdir(directory):
  os.mkdir(directory)

with open(filename, 'w+') as f:
  json.dump(data, f, ensure_ascii=False)
