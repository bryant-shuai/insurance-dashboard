#!/bin/bash

# 保险仪表盘开发环境启动脚本
# 同时启动前端和后端服务

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目路径
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$PROJECT_DIR/server"

# 端口
FRONTEND_PORT=5173
BACKEND_PORT=3001

# 清理函数
cleanup() {
    echo -e "\n${YELLOW}正在停止服务...${NC}"
    
    # 停止前端服务
    if [ -n "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
        echo -e "${GREEN}前端服务已停止${NC}"
    fi
    
    # 停止后端服务
    if [ -n "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
        echo -e "${GREEN}后端服务已停止${NC}"
    fi
    
    # 清理端口占用
    lsof -ti:$FRONTEND_PORT | xargs kill -9 2>/dev/null || true
    lsof -ti:$BACKEND_PORT | xargs kill -9 2>/dev/null || true
    
    exit 0
}

# 设置信号处理
trap cleanup INT TERM EXIT

# 检查端口占用并清理
check_and_kill_port() {
    local port=$1
    local name=$2
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}发现 $name 端口 $port 被占用，正在清理...${NC}"
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
}

# 检查依赖
check_dependencies() {
    echo -e "${BLUE}检查依赖...${NC}"
    
    # 检查前端依赖
    if [ ! -d "$PROJECT_DIR/node_modules" ]; then
        echo -e "${YELLOW}前端依赖未安装，正在安装...${NC}"
        cd "$PROJECT_DIR" && npm install
    fi
    
    # 检查后端依赖
    if [ ! -d "$SERVER_DIR/node_modules" ]; then
        echo -e "${YELLOW}后端依赖未安装，正在安装...${NC}"
        cd "$SERVER_DIR" && npm install
    fi
    
    echo -e "${GREEN}依赖检查完成${NC}"
}

# 启动后端服务
start_backend() {
    echo -e "${BLUE}启动后端服务...${NC}"
    
    cd "$SERVER_DIR"
    npm start > "$PROJECT_DIR/server.log" 2>&1 &
    BACKEND_PID=$!
    
    # 等待后端启动
    for i in {1..30}; do
        if curl -s http://localhost:$BACKEND_PORT/api/datasets >/dev/null 2>&1; then
            echo -e "${GREEN}后端服务已启动: http://localhost:$BACKEND_PORT${NC}"
            return 0
        fi
        sleep 0.5
    done
    
    echo -e "${RED}后端服务启动失败，请检查 server.log${NC}"
    return 1
}

# 启动前端服务
start_frontend() {
    echo -e "${BLUE}启动前端服务...${NC}"
    
    cd "$PROJECT_DIR"
    npm run dev > "$PROJECT_DIR/frontend.log" 2>&1 &
    FRONTEND_PID=$!
    
    # 等待前端启动
    for i in {1..30}; do
        if curl -s http://localhost:$FRONTEND_PORT/ >/dev/null 2>&1; then
            echo -e "${GREEN}前端服务已启动: http://localhost:$FRONTEND_PORT${NC}"
            return 0
        fi
        sleep 0.5
    done
    
    echo -e "${RED}前端服务启动失败，请检查 frontend.log${NC}"
    return 1
}

# 主函数
main() {
    echo -e "${BLUE}=================================${NC}"
    echo -e "${BLUE}  保险仪表盘开发环境启动脚本${NC}"
    echo -e "${BLUE}=================================${NC}"
    echo ""
    
    # 清理端口
    check_and_kill_port $FRONTEND_PORT "前端"
    check_and_kill_port $BACKEND_PORT "后端"
    
    # 检查依赖
    check_dependencies
    
    echo ""
    
    # 启动后端
    start_backend
    if [ $? -ne 0 ]; then
        exit 1
    fi
    
    # 启动前端
    start_frontend
    if [ $? -ne 0 ]; then
        exit 1
    fi
    
    echo ""
    echo -e "${GREEN}=================================${NC}"
    echo -e "${GREEN}  所有服务已启动成功！${NC}"
    echo -e "${GREEN}=================================${NC}"
    echo -e "${BLUE}前端地址: http://localhost:$FRONTEND_PORT${NC}"
    echo -e "${BLUE}后端地址: http://localhost:$BACKEND_PORT${NC}"
    echo ""
    echo -e "${YELLOW}按 Ctrl+C 停止所有服务${NC}"
    echo ""
    
    # 保持脚本运行
    while true; do
        sleep 1
        
        # 检查服务是否还在运行
        if ! kill -0 $BACKEND_PID 2>/dev/null; then
            echo -e "${RED}后端服务意外停止${NC}"
            break
        fi
        
        if ! kill -0 $FRONTEND_PID 2>/dev/null; then
            echo -e "${RED}前端服务意外停止${NC}"
            break
        fi
    done
}

# 运行主函数
main
