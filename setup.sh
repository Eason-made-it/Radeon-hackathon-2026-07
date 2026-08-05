#!/bin/bash
# ============================================================
# NodeFlow — 文件恢复脚本 (GPU 实例重置后使用)
# 
# 此脚本不再创建旧版文件,仅用于检查环境
# 实际部署请使用 start.sh
# ============================================================

echo "============================================"
echo "  NodeFlow — 环境检查"
echo "============================================"
echo ""

# 检查项目文件是否存在
echo "[1] 检查项目文件..."
BACKEND_OK=false
FRONTEND_OK=false

if [ -f "/workspace/ai-canvas/backend/main.py" ]; then
    echo "  ✓ 后端代码存在: /workspace/ai-canvas/backend/"
    BACKEND_OK=true
else
    echo "  ✗ 后端代码缺失! 需要从 Git 恢复"
fi

if [ -f "/workspace/open-canvas/package.json" ]; then
    echo "  ✓ 前端代码存在: /workspace/open-canvas/"
    FRONTEND_OK=true
else
    echo "  ✗ 前端代码缺失! 需要从 Git 恢复"
fi

if [ -f "/workspace/ai-canvas/start.sh" ]; then
    echo "  ✓ 启动脚本存在: /workspace/ai-canvas/start.sh"
else
    echo "  ⚠ 启动脚本缺失"
fi

# 检查环境
echo ""
echo "[2] 检查运行环境..."
echo "  Python: $(python3 --version 2>&1 || echo 'not found')"
echo "  Node.js: $(node --version 2>&1 || echo 'not found')"
echo "  npm: $(npm --version 2>&1 || echo 'not found')"

if command -v rocm-smi &> /dev/null; then
    echo "  ROCm: ✓"
    rocm-smi --showproductname 2>/dev/null | grep -i "card" | head -1 || true
else
    echo "  ROCm: not in PATH (may still work via PyTorch)"
fi

if python3 -c "import torch; print(torch.cuda.is_available())" 2>/dev/null | grep -q "True"; then
    echo "  PyTorch CUDA: ✓"
    python3 -c "import torch; print(f'  GPU: {torch.cuda.get_device_name(0)}')" 2>/dev/null || true
else
    echo "  PyTorch CUDA: ✗ (need to install requirements.txt)"
fi

echo ""
if [ "$BACKEND_OK" = true ] && [ "$FRONTEND_OK" = true ]; then
    echo "============================================"
    echo "  环境检查完成! 运行 start.sh 开始部署:"
    echo "    cd /workspace/ai-canvas && ./start.sh"
    echo "============================================"
else
    echo "============================================"
    echo "  部分文件缺失! 请从 Git 恢复:"
    echo "    cd /workspace"
    echo "    git clone <your-repo> open-canvas"
    echo "    git clone <your-repo> ai-canvas"
    echo "============================================"
fi
