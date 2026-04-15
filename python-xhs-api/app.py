"""
小红书 API 微服务
基于 Spider_XHS 封装，提供 HTTP API 接口
"""

import os
import sys
import json
import asyncio
from datetime import datetime
from functools import wraps
from flask import Flask, request, jsonify, Response
from flask_cors import CORS

# 尝试导入 Spider_XHS，如果没有则提供模拟数据
try:
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from apis.xhs_pc_apis import XHS_Apis
    from apis.xhs_creator_apis import XHS_Creator_Apis
    from xhs_utils.common_util import init_config
    SPIDER_XHS_AVAILABLE = True
except ImportError as e:
    print(f"[Warning] Spider_XHS not found: {e}")
    print("[Info] Running in demo mode with mock data")
    SPIDER_XHS_AVAILABLE = False

app = Flask(__name__)
CORS(app)

# 初始化 Spider_XHS
pc_api = None
creator_api = None

if SPIDER_XHS_AVAILABLE:
    try:
        init_config()
        pc_api = XHS_Apis()
        creator_api = XHS_Creator_Apis()
        print("[OK] Spider_XHS initialized successfully")
    except Exception as e:
        print(f"[Error] Failed to initialize Spider_XHS: {e}")
        SPIDER_XHS_AVAILABLE = False

# ============ 辅助函数 ============

def require_cookies(f):
    """装饰器：检查 Cookie 是否配置"""
    @wraps(f)
    def decorated(*args, **kwargs):
        cookies = os.environ.get('XHS_COOKIES') or os.environ.get('COOKIES')
        if not cookies and not SPIDER_XHS_AVAILABLE:
            return jsonify({
                'success': False,
                'error': 'Cookie not configured. Set XHS_COOKIES or COOKIES environment variable.'
            }), 400
        return f(*args, **kwargs)
    return decorated

def get_cookies():
    """获取 Cookie"""
    return os.environ.get('XHS_COOKIES') or os.environ.get('COOKIES') or ''

def success_response(data, message='OK'):
    """成功响应"""
    return jsonify({
        'success': True,
        'message': message,
        'data': data,
        'timestamp': datetime.now().isoformat()
    })

def error_response(error, status=400):
    """错误响应"""
    return jsonify({
        'success': False,
        'error': str(error),
        'timestamp': datetime.now().isoformat()
    }), status

# ============ 健康检查 ============

@app.route('/health', methods=['GET'])
def health():
    """健康检查"""
    return success_response({
        'status': 'healthy',
        'spider_xhs_available': SPIDER_XHS_AVAILABLE,
        'cookies_configured': bool(get_cookies())
    })

# ============ 账号状态 ============

@app.route('/api/status', methods=['GET'])
@require_cookies
def get_status():
    """获取账号状态"""
    if not SPIDER_XHS_AVAILABLE:
        return success_response({
            'installed': True,
            'loggedIn': True,
            'mode': 'demo',
            'user': {
                'nickname': 'Demo User',
                'userId': 'demo123',
                'followers': 1234,
                'following': 567,
                'likes': 8901
            }
        })
    
    try:
        cookies = get_cookies()
        # 获取用户信息
        success, msg, user_info = pc_api.get_self_info(cookies)
        
        if success:
            return success_response({
                'installed': True,
                'loggedIn': True,
                'mode': 'production',
                'user': user_info
            })
        else:
            return error_response(msg)
    except Exception as e:
        return error_response(f"Failed to get status: {e}")

# ============ 用户信息 ============

@app.route('/api/whoami', methods=['GET'])
@require_cookies
def whoami():
    """获取当前用户信息"""
    if not SPIDER_XHS_AVAILABLE:
        return success_response({
            'user': {
                'nickname': 'Demo User',
                'userId': 'demo123',
                'redId': 'demo_xhs',
                'avatar': '',
                'followers': 1234,
                'following': 567,
                'likes': 8901,
                'notes': 42
            }
        })
    
    try:
        cookies = get_cookies()
        success, msg, user_info = pc_api.get_self_info(cookies)
        
        if success:
            return success_response({'user': user_info})
        else:
            return error_response(msg)
    except Exception as e:
        return error_response(f"Failed to get user info: {e}")

# ============ 搜索笔记 ============

@app.route('/api/search', methods=['POST'])
@require_cookies
def search_notes():
    """搜索笔记"""
    data = request.get_json() or {}
    keyword = data.get('keyword', '')
    page = data.get('page', 1)
    sort = data.get('sort', 'general')  # general / hot / latest
    note_type = data.get('type', 'all')  # all / video / normal
    
    if not keyword:
        return error_response('Keyword is required')
    
    if not SPIDER_XHS_AVAILABLE:
        # 模拟搜索结果
        return success_response({
            'items': [
                {
                    'noteId': f'demo_{i}',
                    'title': f'示例笔记 {i}: {keyword}',
                    'type': 'normal',
                    'user': {
                        'userId': f'user_{i}',
                        'nickname': f'用户{i}',
                        'avatar': ''
                    },
                    'likedCount': 100 + i * 10,
                    'collectedCount': 50 + i * 5,
                    'commentCount': 20 + i * 2,
                    'shareCount': 10 + i,
                    'time': datetime.now().isoformat()
                }
                for i in range(1, 6)
            ]
        })
    
    try:
        cookies = get_cookies()
        success, msg, notes = pc_api.search_some_note(
            keyword, 
            require_num=20,
            cookies=cookies,
            page=page,
            sort=sort,
            note_type=note_type
        )
        
        if success:
            return success_response({'items': notes})
        else:
            return error_response(msg)
    except Exception as e:
        return error_response(f"Search failed: {e}")

# ============ 搜索话题 ============

@app.route('/api/topics', methods=['POST'])
@require_cookies
def search_topics():
    """搜索话题"""
    data = request.get_json() or {}
    keyword = data.get('keyword', '')
    
    if not keyword:
        return error_response('Keyword is required')
    
    if not SPIDER_XHS_AVAILABLE:
        return success_response({
            'topics': [
                {'id': f'topic_{i}', 'name': f'#{keyword}话题{i}', 'noteCount': 10000 * i}
                for i in range(1, 5)
            ]
        })
    
    try:
        cookies = get_cookies()
        success, msg, topics = pc_api.search_topic(keyword, cookies)
        
        if success:
            return success_response({'topics': topics})
        else:
            return error_response(msg)
    except Exception as e:
        return error_response(f"Topic search failed: {e}")

# ============ 获取笔记详情 ============

@app.route('/api/note/<note_id>', methods=['GET'])
@require_cookies
def get_note(note_id):
    """获取笔记详情"""
    if not SPIDER_XHS_AVAILABLE:
        return success_response({
            'note': {
                'noteId': note_id,
                'title': f'示例笔记: {note_id}',
                'content': '这是示例笔记内容...',
                'user': {
                    'userId': 'demo_user',
                    'nickname': 'Demo User'
                },
                'likedCount': 1234,
                'collectedCount': 567,
                'commentCount': 89,
                'shareCount': 45
            }
        })
    
    try:
        cookies = get_cookies()
        # 需要笔记URL
        note_url = data.get('url') if request.args.get('url') else None
        
        if note_url:
            success, msg, note = pc_api.get_note_info(note_url, cookies)
        else:
            # 尝试通过ID获取
            return error_response('Note URL required')
        
        if success:
            return success_response({'note': note})
        else:
            return error_response(msg)
    except Exception as e:
        return error_response(f"Failed to get note: {e}")

# ============ 获取评论 ============

@app.route('/api/comments/<note_id>', methods=['GET'])
@require_cookies
def get_comments(note_id):
    """获取笔记评论"""
    if not SPIDER_XHS_AVAILABLE:
        return success_response({
            'comments': [
                {
                    'commentId': f'c_{i}',
                    'userInfo': {
                        'userId': f'u_{i}',
                        'nickname': f'评论用户{i}',
                        'avatar': ''
                    },
                    'content': f'这是第{i}条评论内容...',
                    'likeCount': i * 5,
                    'subCommentCount': i,
                    'createTime': int(datetime.now().timestamp() * 1000) - i * 3600000
                }
                for i in range(1, 8)
            ]
        })
    
    try:
        cookies = get_cookies()
        # 需要笔记URL
        note_url = request.args.get('url')
        
        if note_url:
            success, msg, comments = pc_api.get_note_comments(note_url, cookies)
        else:
            return error_response('Note URL required')
        
        if success:
            return success_response({'comments': comments})
        else:
            return error_response(msg)
    except Exception as e:
        return error_response(f"Failed to get comments: {e}")

# ============ 获取我的笔记 ============

@app.route('/api/my-notes', methods=['GET'])
@require_cookies
def get_my_notes():
    """获取当前用户的笔记列表"""
    page = request.args.get('page', 1, type=int)
    
    if not SPIDER_XHS_AVAILABLE:
        return success_response({
            'items': [
                {
                    'noteId': f'my_note_{i}',
                    'title': f'我的笔记 {i}',
                    'type': 'normal',
                    'likedCount': 100 + i * 20,
                    'collectedCount': 50 + i * 10,
                    'commentCount': 10 + i * 2,
                    'time': datetime.now().isoformat()
                }
                for i in range(1, 6)
            ]
        })
    
    try:
        cookies = get_cookies()
        success, msg, notes = pc_api.get_self_notes(cookies, page)
        
        if success:
            return success_response({'items': notes})
        else:
            return error_response(msg)
    except Exception as e:
        return error_response(f"Failed to get my notes: {e}")

# ============ 发布笔记 ============

@app.route('/api/post', methods=['POST'])
@require_cookies
def post_note():
    """发布笔记"""
    data = request.get_json() or {}
    title = data.get('title', '')
    body = data.get('body', '')
    images = data.get('images', [])
    topics = data.get('topics', [])
    
    if not title or not body:
        return error_response('Title and body are required')
    
    if not SPIDER_XHS_AVAILABLE:
        return success_response({
            'noteId': f'new_note_{datetime.now().timestamp()}',
            'title': title,
            'status': 'demo'
        }, message='Note posted (demo mode)')
    
    try:
        cookies = get_cookies()
        creator_cookies = os.environ.get('XHS_CREATOR_COOKIES') or cookies
        
        # 构建发布参数
        post_data = {
            'title': title,
            'desc': body,
            'media_type': 'image' if images else 'video',
            'at_users': [],
            'post_time': None
        }
        
        if images:
            post_data['images'] = images
        
        if topics:
            post_data['topic'] = topics[0] if topics else None
        
        success, msg, result = creator_api.post_note(post_data, creator_cookies)
        
        if success:
            return success_response({
                'noteId': result.get('note_id', ''),
                'title': title,
                'status': 'published'
            }, message='Note posted successfully')
        else:
            return error_response(msg)
    except Exception as e:
        return error_response(f"Failed to post note: {e}")

# ============ 互动操作 ============

@app.route('/api/like', methods=['POST'])
@require_cookies
def like_note():
    """点赞笔记"""
    data = request.get_json() or {}
    note_url = data.get('url', '')
    undo = data.get('undo', False)
    
    if not note_url:
        return error_response('Note URL required')
    
    if not SPIDER_XHS_AVAILABLE:
        return success_response({
            'action': 'unlike' if undo else 'like',
            'status': 'demo'
        })
    
    try:
        cookies = get_cookies()
        if undo:
            success, msg, _ = pc_api.unlike_note(note_url, cookies)
        else:
            success, msg, _ = pc_api.like_note(note_url, cookies)
        
        if success:
            return success_response({'action': 'unlike' if undo else 'like'})
        else:
            return error_response(msg)
    except Exception as e:
        return error_response(f"Like operation failed: {e}")

@app.route('/api/favorite', methods=['POST'])
@require_cookies
def favorite_note():
    """收藏笔记"""
    data = request.get_json() or {}
    note_url = data.get('url', '')
    undo = data.get('undo', False)
    
    if not note_url:
        return error_response('Note URL required')
    
    if not SPIDER_XHS_AVAILABLE:
        return success_response({
            'action': 'unfavorite' if undo else 'favorite',
            'status': 'demo'
        })
    
    try:
        cookies = get_cookies()
        if undo:
            success, msg, _ = pc_api.unfavorite_note(note_url, cookies)
        else:
            success, msg, _ = pc_api.favorite_note(note_url, cookies)
        
        if success:
            return success_response({'action': 'unfavorite' if undo else 'favorite'})
        else:
            return error_response(msg)
    except Exception as e:
        return error_response(f"Favorite operation failed: {e}")

# ============ 搜索用户 ============

@app.route('/api/search-user', methods=['POST'])
@require_cookies
def search_user():
    """搜索用户"""
    data = request.get_json() or {}
    keyword = data.get('keyword', '')
    
    if not keyword:
        return error_response('Keyword is required')
    
    if not SPIDER_XHS_AVAILABLE:
        return success_response({
            'users': [
                {
                    'userId': f'u_{i}',
                    'nickname': f'用户{keyword}_{i}',
                    'avatar': '',
                    'followers': 1000 * i,
                    'notes': 50 + i * 10
                }
                for i in range(1, 4)
            ]
        })
    
    try:
        cookies = get_cookies()
        success, msg, users = pc_api.search_user(keyword, cookies)
        
        if success:
            return success_response({'users': users})
        else:
            return error_response(msg)
    except Exception as e:
        return error_response(f"User search failed: {e}")

# ============ 蒲公英 KOL API ============

@app.route('/api/kol/list', methods=['GET'])
@require_cookies
def get_kol_list():
    """获取 KOL 列表"""
    if not SPIDER_XHS_AVAILABLE:
        return success_response({
            'kol_list': [
                {
                    'userId': f'kol_{i}',
                    'nickname': f'KOL博主{i}',
                    'avatar': '',
                    'followers': 100000 * i,
                    'avg_like': 5000 + i * 1000,
                    'avg_collect': 2000 + i * 500,
                    'interaction_rate': 0.05 + i * 0.01
                }
                for i in range(1, 6)
            ]
        })
    
    try:
        from apis.xhs_pugongying_apis import PuGongYingAPI
        pgy = PuGongYingAPI()
        
        cookies = os.environ.get('XHS_PGY_COOKIES') or get_cookies()
        success, msg, kol_list = pgy.get_some_user(num=50, cookies=cookies)
        
        if success:
            return success_response({'kol_list': kol_list})
        else:
            return error_response(msg)
    except Exception as e:
        return error_response(f"Failed to get KOL list: {e}")

# ============ 启动 ============

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    
    print(f"🚀 Starting XHS API Service on port {port}")
    print(f"   Spider_XHS: {'Available' if SPIDER_XHS_AVAILABLE else 'Not Available (Demo Mode)'}")
    print(f"   Cookies: {'Configured' if get_cookies() else 'Not Configured'}")
    
    app.run(host='0.0.0.0', port=port, debug=debug)
