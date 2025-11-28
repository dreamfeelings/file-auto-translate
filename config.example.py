# API配置示例（请复制为config.py并填入真实的API密钥）
API_BASE_URL = "https://api.ephone.ai"  # 或你的API地址
API_KEY = "your-api-key-here"  # 替换为你的真实API密钥
MODEL = "gpt-4o"

# 支持的AI模型配置
AI_MODELS = {
    'gpt-4o': {
        'name': 'GPT-4O',
        'base_url': 'https://api.ephone.ai',
        'model': 'gpt-4o',
        'description': 'OpenAI GPT-4O (最强大)'
    },
    'gpt-3.5': {
        'name': 'GPT-3.5 Turbo',
        'base_url': 'https://api.ephone.ai',
        'model': 'gpt-3.5-turbo',
        'description': 'OpenAI GPT-3.5 (快速)'
    },
    'kimi': {
        'name': 'Kimi (月之暗面)',
        'base_url': 'https://api.ephone.ai',
        'model': 'moonshot-v1-8k',
        'description': 'Moonshot Kimi (长文本)'
    },
    'qwen': {
        'name': 'Qwen (通义千问)',
        'base_url': 'https://api.ephone.ai',
        'model': 'qwen-max',
        'description': '阿里通义千问 (中文优化)'
    },
    'zhipu': {
        'name': 'GLM-4 (智谱)',
        'base_url': 'https://api.ephone.ai',
        'model': 'glm-4',
        'description': '智谱清言 (中文理解)'
    },
    'deepseek': {
        'name': 'DeepSeek',
        'base_url': 'https://api.ephone.ai',
        'model': 'deepseek-chat',
        'description': 'DeepSeek (高性价比)'
    }
}

# 文件上传配置
UPLOAD_FOLDER = 'uploads'
MAX_FILE_SIZE = 16 * 1024 * 1024  # 16MB
ALLOWED_EXTENSIONS = {'pdf', 'docx', 'doc', 'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'}

# 支持的语言
LANGUAGES = {
    'zh-CN': '中文（简体）',
    'zh-TW': '中文（繁体）',
    'en': 'English',
    'ja': '日本語',
    'ko': '한국어',
    'fr': 'Français',
    'de': 'Deutsch',
    'es': 'Español',
    'ru': 'Русский',
    'ar': 'العربية',
    'pt': 'Português',
    'it': 'Italiano'
}

# Flask配置
SECRET_KEY = 'your-secret-key-change-this-in-production'  # 生产环境请更改
DEBUG = True

# 翻译优化配置
BATCH_SIZE = 15  # 每批翻译的段落数（10-20段最佳）
MAX_WORKERS = 3  # 线程池最大并发数（建议2-5）
