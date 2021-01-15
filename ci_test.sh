#!/bin/bash
set -e

COMMANDS=(
  'sudo npm install -g @google/clasp'
  'npm i -S @types/google-apps-script'
  'clasp push'
  'bash check_clasp_run.sh runAllUnitTests'
  'bash check_clasp_run.sh runAllIntegrationTests'
)

for ((i = 0; i < ${#COMMANDS[@]}; i += 1))
do
  echo ${COMMANDS[$i]}
  ${COMMANDS[$i]}
  echo ''
done
