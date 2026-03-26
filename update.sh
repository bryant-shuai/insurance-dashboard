#!/bin/bash

# 阿里云轻量服务器一键部署脚本

set -e

echo "🚀 开始部署..."

# 配置
REMOTE_HOST="8.134.128.222"
REMOTE_USER="root"
REMOTE_DIR="/home/admin/msq/dist"
SERVER_DIR="/home/admin/msq/insurance-dashboardnew/insurance-dashboard"
SSH_CMD="ssh -F /dev/null"
RSYNC_CMD="rsync -avz -e 'ssh -F /dev/null'"

# 本地构建
echo "📦 构建前端..."
npm run build

# 上传文件到服务器
echo "📤 上传到服务器..."
eval ${RSYNC_CMD} --delete dist/ ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/dist/
eval ${RSYNC_CMD} --exclude 'node_modules' server/ ${REMOTE_USER}@${REMOTE_HOST}:${SERVER_DIR}/server/

# 远程执行部署命令
echo "🔧 在服务器上部署..."
${SSH_CMD} ${REMOTE_USER}@${REMOTE_HOST} << 'REMOTE_SCRIPT'
    # 进入后端目录
    cd /home/admin/msq/insurance-dashboardnew/insurance-dashboard/server
    
    # 安装后端依赖
    npm install
    
    # 使用 pm2 管理后端服务
    pm2 delete insurance-dashboard 2>/dev/null || true
    pm2 start server.js --name insurance-dashboard
    pm2 save
    
    echo "✅ 部署完成！"
REMOTE_SCRIPT

echo "🎉 部署成功！"
echo "前端: http://${REMOTE_HOST}"
echo "后端 (内部): http://127.0.0.1:3001"
