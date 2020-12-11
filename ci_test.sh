#!/bin/bash
set -e

COMMANDS=(
  'sudo npm install -g @google/clasp'
  'npm i -S @types/google-apps-script'
  'clasp push'
  'clasp run runAllUnitTests'
  'clasp run runAllIntegrationTests'
)

for ((i = 0; i < ${#COMMANDS[@]}; i += 1))
do
  echo ${COMMANDS[$i]}
  ${COMMANDS[$i]}
  echo ''
done
