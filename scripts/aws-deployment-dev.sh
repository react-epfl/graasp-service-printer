#!/bin/bash

# fail the build on any failed command
set -e

# generate task definition
python /deploy/scripts/generate_dev_task_definition.py

# register task definition
aws ecs register-task-definition --cli-input-json file:///deploy/tasks/dev.json
