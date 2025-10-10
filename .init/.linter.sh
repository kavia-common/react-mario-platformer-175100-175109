#!/bin/bash
cd /home/kavia/workspace/code-generation/react-mario-platformer-175100-175109/mario_game_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

