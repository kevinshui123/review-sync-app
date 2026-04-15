// XHS API configuration
// 可以配置为使用本地 Node.js 实现或远程 Python 服务

const XHS_API_BASE = import.meta.env.VITE_XHS_API_URL || '/api/xhs';

export const xhsConfig = {
  // API 模式: 'local' (Node.js CLI) 或 'remote' (Python API)
  mode: (import.meta.env.VITE_XHS_API_MODE as 'local' | 'remote') || 'local',
  // 远程 API 地址（当 mode = 'remote' 时使用）
  remoteUrl: import.meta.env.VITE_XHS_API_URL || 'http://localhost:5000',
};

export function getXhsApiUrl(endpoint: string): string {
  if (xhsConfig.mode === 'remote') {
    return `${xhsConfig.remoteUrl}/api${endpoint}`;
  }
  return `/api/xhs${endpoint}`;
}
