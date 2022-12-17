#!/bin/bash
echo "Starting Minecraft Server Bot"

echo "Installing pm2..."
yarn global add pm2

echo "Linking pm2..."
if [ -z "$PM2_KEY" ]; then
  echo "No PM2 key found, please set the PM2_KEY environment variable."
else
  pm2 link $PM2_KEY
fi

echo "Installing NPM dependencies..."
yarn build