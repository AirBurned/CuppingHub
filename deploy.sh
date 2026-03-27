#!/bin/bash
# Deploy CuppingHub to production server
set -e

SERVER="user@91.188.215.105"
APP_DIR="~/cupping-hub"

echo "==> Pushing to GitHub..."
git push origin main

echo "==> Deploying to server..."
ssh $SERVER "cd $APP_DIR && git pull origin main && npm install && npx prisma generate && npm run build && pm2 restart cupping-hub"

echo "==> Done! Site: http://91.188.215.105"
