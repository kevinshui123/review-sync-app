import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Close,
  QrCode,
  CheckCircle,
  Error as ErrorIcon,
  Refresh,
  PhoneAndroid,
  ContentCopy,
} from '@mui/icons-material';
import { Loader2 } from 'lucide-react';

interface QRCodeLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (cookies: string, user: XHSUser) => void;
  mode?: 'pc' | 'creator';
  tenantId?: string;
}

interface XHSUser {
  nickname?: string;
  userId?: string;
  redId?: string;
  avatar?: string;
  followers?: number;
  following?: number;
  likes?: number;
}

type LoginStatus = 'idle' | 'generating' | 'pending' | 'scanned' | 'confirmed' | 'expired' | 'error';

export function QRCodeLoginModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  mode = 'pc',
  tenantId 
}: QRCodeLoginModalProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [qrcodeUrl, setQrcodeUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<LoginStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(300);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // 生成二维码
  const generateQRCode = useCallback(async () => {
    setStatus('generating');
    setErrorMessage(null);
    
    try {
      const endpoint = mode === 'creator' 
        ? '/api/login/creator/login/qrcode' 
        : '/api/login/qrcode';
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(tenantId && { 'X-Tenant-ID': tenantId }),
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate QR code');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setSessionId(result.data.sessionId);
        setQrcodeUrl(result.data.qrcode);
        setStatus('pending');
        setTimeLeft(result.data.expireIn || 300);
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error: any) {
      console.error('QR code generation error:', error);
      setStatus('error');
      setErrorMessage(error.message || '生成二维码失败');
    }
  }, [mode, tenantId]);

  // 轮询检查扫码状态
  const checkStatus = useCallback(async () => {
    if (!sessionId || status === 'confirmed' || status === 'expired') {
      return;
    }

    try {
      const response = await fetch('/api/login/qrcode/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(tenantId && { 'X-Tenant-ID': tenantId }),
        },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        throw new Error('Failed to check status');
      }

      const result = await response.json();

      if (result.success) {
        const { status: newStatus, cookies, user, message } = result.data;

        if (newStatus === 'confirmed' && cookies) {
          setStatus('confirmed');
          // 保存 Cookie
          await fetch('/api/login/cookies/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              cookies, 
              tenantId,
              creatorCookies: mode === 'creator' ? cookies : undefined 
            }),
          });
          onSuccess(cookies, user);
        } else if (newStatus === 'scanned') {
          setStatus('scanned');
        } else if (newStatus === 'expired') {
          setStatus('expired');
        } else if (newStatus === 'error' || newStatus === 'cancelled') {
          setStatus('error');
          setErrorMessage(message || '登录失败');
        }
      }
    } catch (error: any) {
      console.error('Status check error:', error);
    }
  }, [sessionId, status, tenantId, mode, onSuccess]);

  // 开始轮询
  useEffect(() => {
    if (sessionId && status === 'pending') {
      pollingRef.current = setInterval(checkStatus, 2000);
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [sessionId, status, checkStatus]);

  // 倒计时
  useEffect(() => {
    if (timeLeft > 0 && status === 'pending') {
      const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft <= 0) {
      setStatus('expired');
    }
  }, [timeLeft, status]);

  // 格式化时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 取消登录
  const handleCancel = async () => {
    if (sessionId) {
      try {
        await fetch('/api/login/qrcode/cancel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
      } catch (e) {
        console.error('Cancel error:', e);
      }
    }
    setStatus('idle');
    setSessionId(null);
    setQrcodeUrl(null);
    onClose();
  };

  // 刷新二维码
  const handleRefresh = () => {
    setSessionId(null);
    setQrcodeUrl(null);
    setStatus('idle');
    generateQRCode();
  };

  // 组件挂载时自动生成二维码
  useEffect(() => {
    if (isOpen && status === 'idle') {
      generateQRCode();
    }
  }, [isOpen, status, generateQRCode]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 animate-fade-in"
        onClick={handleCancel}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="bg-[var(--color-surface-raised)] rounded-2xl shadow-2xl w-full max-w-md animate-scale-in overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[var(--color-divider)]">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff4d4d] to-[#ff6b6b] flex items-center justify-center">
                <QrCode style={{ width: 28, height: 28, color: 'white' }} />
              </div>
              <div>
                <h2 className="heading text-lg">
                  {mode === 'creator' ? '创作者平台' : '小红书'} 扫码登录
                </h2>
                <p className="text-sm text-[var(--color-text-muted)]">
                  使用小红书 App 扫码授权
                </p>
              </div>
            </div>
            <button 
              onClick={handleCancel}
              className="w-10 h-10 rounded-full hover:bg-[var(--color-surface)] flex items-center justify-center transition-colors"
            >
              <Close style={{ width: 20, height: 20 }} />
            </button>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* QR Code Area */}
            <div className="flex flex-col items-center">
              {/* QR Code Image */}
              <div className="relative w-64 h-64 bg-white rounded-2xl p-4 mb-6">
                {status === 'generating' ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Loader2 style={{ width: 48, height: 48 }} className="animate-spin text-[var(--color-primary)]" />
                  </div>
                ) : status === 'confirmed' ? (
                  <div className="w-full h-full flex items-center justify-center bg-[var(--color-success-bg)]">
                    <CheckCircle style={{ width: 80, height: 80, color: 'var(--color-success)' }} />
                  </div>
                ) : status === 'error' || status === 'expired' ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-[var(--color-error-bg)]">
                    <ErrorIcon style={{ width: 60, height: 60, color: 'var(--color-error)' }} />
                    <p className="text-sm text-[var(--color-error-text)] mt-2">{errorMessage || '二维码已过期'}</p>
                  </div>
                ) : qrcodeUrl ? (
                  <img 
                    src={qrcodeUrl} 
                    alt="Login QR Code" 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <QrCode style={{ width: 80, height: 80, color: 'var(--color-text-disabled)' }} />
                  </div>
                )}

                {/* Scanning Animation */}
                {status === 'scanned' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="bg-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                      <Loader2 style={{ width: 20, height: 20 }} className="animate-spin text-[var(--color-primary)]" />
                      <span className="font-medium text-sm">已扫码，等待确认...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Status Text */}
              <div className="text-center mb-6">
                {status === 'pending' && (
                  <>
                    <div className="flex items-center justify-center gap-2 text-[var(--color-text-secondary)] mb-2">
                      <PhoneAndroid style={{ width: 20, height: 20 }} />
                      <span className="font-medium">打开小红书 App 扫码</span>
                    </div>
                    <p className="text-sm text-[var(--color-text-muted)]">
                      扫描二维码后在手机上确认登录
                    </p>
                  </>
                )}
                
                {status === 'scanned' && (
                  <p className="text-[var(--color-accent)] font-medium">
                    ✓ 已扫码，请在手机上点击确认
                  </p>
                )}
                
                {status === 'confirmed' && (
                  <p className="text-[var(--color-success)] font-medium">
                    ✓ 登录成功！正在跳转...
                  </p>
                )}
              </div>

              {/* Timer / Refresh */}
              {status === 'pending' && (
                <div className="flex items-center gap-4">
                  <div className="text-sm text-[var(--color-text-muted)]">
                    有效期：<span className="font-mono font-medium">{formatTime(timeLeft)}</span>
                  </div>
                  <button
                    onClick={handleRefresh}
                    className="flex items-center gap-1 text-sm text-[var(--color-primary)] hover:underline"
                  >
                    <Refresh style={{ width: 16, height: 16 }} />
                    刷新
                  </button>
                </div>
              )}

              {(status === 'error' || status === 'expired') && (
                <button
                  onClick={handleRefresh}
                  className="btn btn-primary"
                >
                  <Refresh style={{ width: 18, height: 18 }} />
                  重新生成二维码
                </button>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-[var(--color-surface)] border-t border-[var(--color-divider)]">
            <p className="text-xs text-[var(--color-text-muted)] text-center">
              登录即表示同意《小红书用户协议》和《隐私政策》
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
