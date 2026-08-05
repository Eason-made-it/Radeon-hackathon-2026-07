#!/bin/bash
# ============================================================
# NodeFlow — 一键部署脚本 (GPU 实例)
# 在 AMD Radeon Cloud GPU 实例的 Terminal 里运行
# AMD Radeon GPU + Flux schnell + React/Excalidraw 前端
# ============================================================

set -e

echo "============================================"
echo "  NodeFlow — GPU 实例部署脚本"
echo "  AMD Radeon GPU + Flux schnell"
echo "============================================"
echo ""

# ---- 配置 ----
BACKEND_DIR="/workspace/ai-canvas/backend"
FRONTEND_DIR="/workspace/ai-canvas/frontend"
VENV_DIR="/persistent/venv"
BACKEND_PORT=8000
FRONTEND_PORT=5173

# ---- Step 1: 检查环境 ----
echo "[1/6] 检查环境..."

# 检查 ROCm
if command -v rocm-smi &> /dev/null; then
    echo "  ✓ ROCm 检测到"
    rocm-smi --showproductname 2>/dev/null | head -3 || true
else
    echo "  ⚠ 未检测到 rocm-smi, 检查 PyTorch CUDA..."
fi

# 检查 Python
if ! command -v python3 &> /dev/null; then
    echo "  ✗ Python3 未安装"
    exit 1
fi
echo "  ✓ Python: $(python3 --version)"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "  ⚠ Node.js 未安装, 尝试安装..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi
echo "  ✓ Node.js: $(node --version)"

# ---- 环境变量: HuggingFace 镜像 + Token + 持久化缓存 ----
# 实例不能直连 huggingface.co，必须走镜像
# Flux schnell 是 gated repo，需要 token
export HF_ENDPOINT=https://hf-mirror.com
# Flux schnell / gated repo 需要 token，从环境变量读取，勿硬编码
export HF_TOKEN="${HF_TOKEN:-hf_YOUR_HF_TOKEN_HERE}"
export HUGGING_FACE_HUB_TOKEN="$HF_TOKEN"
export HF_HOME=/persistent/hf_cache
mkdir -p "$HF_HOME"
echo "  ✓ HF mirror: $HF_ENDPOINT"
echo "  ✓ HF cache: $HF_HOME"

# ---- Step 2: 创建/激活虚拟环境 ----
echo ""
echo "[2/6] 配置 Python 虚拟环境..."
if [ ! -d "$VENV_DIR" ]; then
    python3 -m venv "$VENV_DIR"
    echo "  ✓ 虚拟环境已创建: $VENV_DIR"
else
    echo "  ✓ 虚拟环境已存在: $VENV_DIR"
fi
source "$VENV_DIR/bin/activate"

# ---- Step 3: 安装后端依赖 ----
echo ""
echo "[3/6] 安装后端依赖 (FastAPI + diffusers + PyTorch)..."
cd "$BACKEND_DIR"
pip install --quiet -r requirements.txt 2>&1 | tail -5
echo "  ✓ 后端依赖安装完成"

# 验证 PyTorch + ROCm
python3 -c "
import torch
if torch.cuda.is_available():
    print(f'  ✓ PyTorch CUDA 可用 — GPU: {torch.cuda.get_device_name(0)}')
    props = torch.cuda.get_device_properties(0)
    print(f'  ✓ VRAM: {props.total_memory / 1e9:.1f} GB')
else:
    print('  ⚠ CUDA 不可用, 将使用 CPU (非常慢)')
"

# ---- Step 4: 启动后端 ----
echo ""
echo "[4/6] 启动后端 (FastAPI + Flux schnell)..."
echo "  首次启动需要下载模型 (~12GB), 请耐心等待..."
cd "$BACKEND_DIR"
uvicorn main:app --host 0.0.0.0 --port $BACKEND_PORT &
BACKEND_PID=$!
echo "  后端 PID: $BACKEND_PID"

# 等待后端就绪
echo "  等待 Flux 模型加载..."
for i in $(seq 1 180); do
    if curl -s http://localhost:$BACKEND_PORT/ > /dev/null 2>&1; then
        echo "  ✓ 后端就绪!"
        curl -s http://localhost:$BACKEND_PORT/api/health | python3 -m json.tool 2>/dev/null || true
        break
    fi
    sleep 3
    if [ $((i % 10)) -eq 0 ]; then
        echo "  仍在加载... ($((i*3))s)"
    fi
done

# ---- Step 5: 安装前端依赖 ----
echo ""
echo "[5/6] 配置前端 (React + Excalidraw)..."
cd "$FRONTEND_DIR"
if [ ! -d "node_modules" ]; then
    echo "  安装 npm 依赖 (可能需要几分钟)..."
    npm install --legacy-peer-deps 2>&1 | tail -5
else
    echo "  ✓ node_modules 已存在, 跳过安装"
fi

# ---- Step 6: 启动前端 ----
echo ""
echo "[6/6] 启动前端 (Vite + React)..."
cd "$FRONTEND_DIR"
npm run dev &
FRONTEND_PID=$!
echo "  前端 PID: $FRONTEND_PID"

# 等待前端就绪
echo "  等待前端启动..."
for i in $(seq 1 30); do
    if curl -s http://localhost:$FRONTEND_PORT > /dev/null 2>&1; then
        echo "  ✓ 前端就绪!"
        break
    fi
    sleep 2
done

# ---- 完成 ----
echo ""
echo "============================================"
echo "  NodeFlow 已启动!"
echo "============================================"
echo ""
echo "  前端: http://localhost:$FRONTEND_PORT"
echo "  后端: http://localhost:$BACKEND_PORT"
echo "  健康检查: http://localhost:$BACKEND_PORT/api/health"
echo ""
echo "  SSH 端口转发 (在本地电脑终端运行):"
echo "    ssh -L ${FRONTEND_PORT}:localhost:${FRONTEND_PORT} -L ${BACKEND_PORT}:localhost:${BACKEND_PORT} <user>@<gpu-ip>"
echo ""
echo "  然后在浏览器打开: http://localhost:${FRONTEND_PORT}"
echo ""
echo "  停止服务: kill $BACKEND_PID $FRONTEND_PID"
echo "  或按 Ctrl+C 退出"
echo ""

# 退出时清理
trap "echo 'Shutting down...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
