"""
小红书二维码登录 API
支持生成登录二维码、轮询扫码状态、自动获取 Cookie
"""

import os
import sys
import time
import json
import qrcode
import io
import base64
from datetime import datetime
from flask import Flask, request, jsonify, Response
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# 尝试导入 Spider_XHS
try:
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from apis.xhs_pc_login_apis import XHS_Login_Apis
    from apis.xhs_creator_login_apis import XHS_Creator_Login_Apis
    from xhs_utils.common_util import init_config
    SPIDER_XHS_AVAILABLE = True
except ImportError as e:
    print(f"[Warning] Spider_XHS not found: {e}")
    SPIDER_XHS_AVAILABLE = False

# 登录状态存储（生产环境应该用 Redis）
login_sessions = {}

def success_response(data, message='OK'):
    return jsonify({
        'success': True,
        'message': message,
        'data': data,
        'timestamp': datetime.now().isoformat()
    })

def error_response(error, status=400):
    return jsonify({
        'success': False,
        'error': str(error),
        'timestamp': datetime.now().isoformat()
    }), status

# ============ 二维码登录 ============

@app.route('/api/login/qrcode', methods=['GET'])
def generate_qrcode():
    """生成登录二维码"""
    import uuid
    session_id = str(uuid.uuid4())
    
    if not SPIDER_XHS_AVAILABLE:
        # Demo 模式：生成假二维码
        qr = qrcode.QRCode(version=1, box_size=10, border=4)
        qr.add_data(f'https://www.xiaohongshu.com?demo_session={session_id}')
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        
        buf = io.BytesIO()
        img.save(buf, format='PNG')
        img_str = base64.b64encode(buf.getvalue()).decode()
        
        login_sessions[session_id] = {
            'status': 'pending',
            'created_at': time.time(),
            'demo': True
        }
        
        return success_response({
            'sessionId': session_id,
            'qrcode': f'data:image/png;base64,{img_str}',
            'expireIn': 300,
            'mode': 'demo'
        })
    
    try:
        init_config()
        login_api = XHS_Login_Apis()
        
        # 获取二维码
        success, msg, qr_data = login_api.xhs_login_qrcode()
        
        if not success:
            return error_response(f"Failed to generate QR code: {msg}")
        
        # qr_data 包含二维码图片数据
        qrcode_base64 = None
        if isinstance(qr_data, dict) and 'qrcode' in qr_data:
            qrcode_base64 = qr_data['qrcode']
        elif isinstance(qr_data, str):
            qrcode_base64 = qr_data
        
        login_sessions[session_id] = {
            'status': 'pending',
            'created_at': time.time(),
            'qr_data': qr_data,
            'login_api': login_api,
            'demo': False
        }
        
        return success_response({
            'sessionId': session_id,
            'qrcode': qrcode_base64,
            'expireIn': 300,
            'mode': 'production'
        })
        
    except Exception as e:
        return error_response(f"QR code generation failed: {e}")

@app.route('/api/login/qrcode/check', methods=['POST'])
def check_qrcode_status():
    """检查二维码扫码状态"""
    data = request.get_json() or {}
    session_id = data.get('sessionId')
    
    if not session_id or session_id not in login_sessions:
        return error_response('Invalid session ID')
    
    session = login_sessions[session_id]
    
    # 检查是否过期（5分钟）
    if time.time() - session['created_at'] > 300:
        login_sessions[session_id]['status'] = 'expired'
        return success_response({
            'status': 'expired',
            'message': '二维码已过期，请刷新重试'
        })
    
    if session['status'] != 'pending':
        return success_response({
            'status': session['status'],
            'message': session.get('message', '')
        })
    
    if session.get('demo'):
        # Demo 模式：模拟扫码
        elapsed = time.time() - session['created_at']
        if elapsed > 5:  # 5秒后自动确认（demo）
            login_sessions[session_id]['status'] = 'confirmed'
            login_sessions[session_id]['cookies'] = 'demo_cookie_' + session_id[:8]
            login_sessions[session_id]['user'] = {
                'nickname': 'Demo User',
                'userId': 'demo123',
                'redId': 'demo_xhs'
            }
            return success_response({
                'status': 'confirmed',
                'cookies': login_sessions[session_id]['cookies'],
                'user': login_sessions[session_id]['user']
            })
        return success_response({'status': 'pending'})
    
    try:
        login_api = session['login_api']
        qr_data = session['qr_data']
        
        # 检查扫码状态
        success, msg, result = login_api.check_qrcode_login(qr_data)
        
        if success and result:
            # 登录成功
            cookies = result.get('cookies') or result.get('cookie', '')
            user_info = result.get('user', {})
            
            login_sessions[session_id]['status'] = 'confirmed'
            login_sessions[session_id]['cookies'] = cookies
            login_sessions[session_id]['user'] = user_info
            
            return success_response({
                'status': 'confirmed',
                'cookies': cookies,
                'user': user_info
            })
        else:
            # 未扫码或等待中
            status = result.get('status', 'pending') if isinstance(result, dict) else 'pending'
            
            if status == 'scanned':
                login_sessions[session_id]['status'] = 'scanned'
                return success_response({
                    'status': 'scanned',
                    'message': '已扫码，请在手机上确认'
                })
            
            return success_response({'status': 'pending'})
            
    except Exception as e:
        return error_response(f"Check failed: {e}")

@app.route('/api/login/qrcode/cancel', methods=['POST'])
def cancel_qrcode():
    """取消二维码登录"""
    data = request.get_json() or {}
    session_id = data.get('sessionId')
    
    if session_id and session_id in login_sessions:
        login_sessions[session_id]['status'] = 'cancelled'
    
    return success_response({'message': '已取消'})

# ============ Cookie 管理 ============

@app.route('/api/cookies/save', methods=['POST'])
def save_cookies():
    """保存用户 Cookie（关联到租户）"""
    data = request.get_json() or {}
    tenant_id = data.get('tenantId') or request.headers.get('X-Tenant-ID')
    cookies = data.get('cookies', '')
    creator_cookies = data.get('creatorCookies', '')
    
    if not cookies:
        return error_response('Cookies required')
    
    # 保存到环境变量或数据库
    # 这里先保存到内存（生产环境应该用数据库）
    cookie_key = f'xhs_cookies_{tenant_id}' if tenant_id else 'xhs_cookies_default'
    
    os.environ[cookie_key] = cookies
    if creator_cookies:
        creator_key = f'xhs_creator_cookies_{tenant_id}' if tenant_id else 'xhs_creator_cookies_default'
        os.environ[creator_key] = creator_cookies
    
    return success_response({
        'message': 'Cookies saved successfully',
        'tenantId': tenant_id
    })

@app.route('/api/cookies/get', methods=['GET'])
def get_cookies():
    """获取用户 Cookie"""
    tenant_id = request.args.get('tenantId') or request.headers.get('X-Tenant-ID')
    
    cookie_key = f'xhs_cookies_{tenant_id}' if tenant_id else 'xhs_cookies_default'
    cookies = os.environ.get(cookie_key)
    
    if not cookies:
        return success_response({'cookies': None, 'configured': False})
    
    return success_response({
        'cookies': cookies,
        'configured': True
    })

@app.route('/api/cookies/delete', methods=['POST'])
def delete_cookies():
    """删除用户 Cookie"""
    data = request.get_json() or {}
    tenant_id = data.get('tenantId') or request.headers.get('X-Tenant-ID')
    
    cookie_key = f'xhs_cookies_{tenant_id}' if tenant_id else 'xhs_cookies_default'
    creator_key = f'xhs_creator_cookies_{tenant_id}' if tenant_id else 'xhs_creator_cookies_default'
    
    if cookie_key in os.environ:
        del os.environ[cookie_key]
    if creator_key in os.environ:
        del os.environ[creator_key]
    
    return success_response({'message': 'Cookies deleted'})

# ============ 账号列表 ============

@app.route('/api/accounts', methods=['GET'])
def list_accounts():
    """获取已保存的账号列表"""
    # 从数据库或存储中获取（这里用内存模拟）
    accounts = []
    
    # 扫描环境变量中的 Cookie
    for key, value in os.environ.items():
        if key.startswith('xhs_cookies_') and value:
            tenant_id = key.replace('xhs_cookies_', '')
            accounts.append({
                'tenantId': tenant_id,
                'connected': True,
                'lastUsed': datetime.now().isoformat()
            })
    
    return success_response({'accounts': accounts})

# ============ 创作者平台登录 ============

@app.route('/api/creator/login/qrcode', methods=['GET'])
def creator_generate_qrcode():
    """生成创作者平台登录二维码"""
    import uuid
    session_id = str(uuid.uuid4())
    
    if not SPIDER_XHS_AVAILABLE:
        qr = qrcode.QRCode(version=1, box_size=10, border=4)
        qr.add_data(f'https://creator.xiaohongshu.com?demo_session={session_id}')
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        
        buf = io.BytesIO()
        img.save(buf, format='PNG')
        img_str = base64.b64encode(buf.getvalue()).decode()
        
        login_sessions[f'creator_{session_id}'] = {
            'status': 'pending',
            'created_at': time.time(),
            'type': 'creator',
            'demo': True
        }
        
        return success_response({
            'sessionId': f'creator_{session_id}',
            'qrcode': f'data:image/png;base64,{img_str}',
            'expireIn': 300,
            'mode': 'demo'
        })
    
    try:
        init_config()
        creator_login = XHS_Creator_Login_Apis()
        
        success, msg, qr_data = creator_login.xhs_creator_login_qrcode()
        
        if not success:
            return error_response(f"Failed to generate creator QR code: {msg}")
        
        qrcode_base64 = None
        if isinstance(qr_data, dict) and 'qrcode' in qr_data:
            qrcode_base64 = qr_data['qrcode']
        
        login_sessions[f'creator_{session_id}'] = {
            'status': 'pending',
            'created_at': time.time(),
            'qr_data': qr_data,
            'login_api': creator_login,
            'type': 'creator',
            'demo': False
        }
        
        return success_response({
            'sessionId': f'creator_{session_id}',
            'qrcode': qrcode_base64,
            'expireIn': 300,
            'mode': 'production'
        })
        
    except Exception as e:
        return error_response(f"Creator QR code generation failed: {e}")

# ============ 健康检查 ============

@app.route('/health', methods=['GET'])
def health():
    return success_response({
        'status': 'healthy',
        'spider_xhs_available': SPIDER_XHS_AVAILABLE,
        'active_sessions': len([s for s in login_sessions.values() if s.get('status') == 'pending'])
    })

# ============ 启动 ============

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"🚀 Starting XHS Login Service on port {port}")
    print(f"   Spider_XHS: {'Available' if SPIDER_XHS_AVAILABLE else 'Not Available (Demo Mode)'}")
    app.run(host='0.0.0.0', port=port, debug=True)
