# 📄 在线文件翻译系统

一个基于 Flask 的实时在线文件翻译网站，支持 PDF、Word、图片等多种文件格式，采用 Apple 设计理念，界面简洁美观。

## ✨ 功能特性

- 🔄 **实时翻译**：上传文件后即可实时翻译，左右对照查看
- 📁 **多格式支持**：支持 PDF、Word (docx/doc)、图片 (PNG/JPG/GIF/BMP/WEBP)
- 📝 **格式保留**：PDF和Word文档自动转换为HTML，完美保留原始格式、标题、粗体等
- 🎯 **拖拽上传**：支持拖拽文件到页面上传，操作更便捷
- 🔗 **同步高亮**：悬停或点击任意段落，左右自动高亮并滚动到对应位置
- 🌍 **多语言支持**：支持中文、英文、日文、韩文、法文、德文、西班牙文等多种语言
- 🎨 **Apple 设计风格**：采用苹果设计理念，界面简洁优雅
- 📱 **响应式设计**：完美支持桌面和移动设备
- 💾 **导出功能**：支持导出为TXT或Word格式，仅导出译文并保留格式

## 🚀 快速开始

### 前置要求

- Python 3.8+
- AI API密钥（用于图片识别和翻译）

### 安装依赖

```bash
pip install -r requirements.txt
```

### 配置

在 `config.py` 中配置你的 API 信息（已预配置）：

```python
API_BASE_URL = "https://api.openai.com"
API_KEY = "your-api-key"
MODEL = "gpt-4o"
```

### 运行应用

```bash
python app.py
```

应用将在 `http://localhost:5000` 启动

## 📖 使用说明

1. **上传文件**：
   - 方式一：拖拽文件到虚线区域
   - 方式二：点击虚线区域选择文件
   - 支持格式：PDF、Word (docx/doc)、图片 (PNG/JPG等)
   
2. **选择语言**：在下拉菜单中选择目标翻译语言（默认为中文）

3. **开始翻译**：点击"开始翻译"按钮，等待翻译完成

4. **查看结果**：
   - PDF/Word文档：左右两侧显示完整的文档格式，保留标题、粗体、段落等
   - 图片文件：左侧原文段落，右侧译文段落
   - 交互：悬停高亮、点击同步滚动

5. **导出翻译**：点击"导出TXT"或"导出Word"保存译文（仅译文，保留格式）

## 🛠️ 技术栈

### 后端
- **Flask**：轻量级 Web 框架
- **PyPDF2**：PDF 文件解析（段落模式）
- **PyMuPDF (fitz)**：PDF 格式化解析，保留标题、粗体等
- **python-docx**：Word 文档解析（段落模式）
- **mammoth**：Word 转 HTML，保留文档格式
- **BeautifulSoup4**：HTML 解析和处理
- **Pillow**：图片处理
- **AI Vision API**：图片文字识别（GPT-4O等支持图片的模型）
- **requests**：API 调用

### 前端
- **原生 HTML/CSS/JavaScript**：无需额外框架，加载快速
- **Apple Design Language**：采用苹果设计规范

## 📁 项目结构

```
在线翻译文件/
├── app.py                 # Flask 主应用
├── config.py             # 配置文件
├── file_parser.py        # 文件解析模块
├── translator.py         # 翻译服务模块
├── requirements.txt      # Python 依赖
├── README.md            # 项目说明
├── templates/           # HTML 模板
│   └── index.html      # 主页面
└── uploads/            # 文件上传临时目录（自动创建）
```

## 🎨 设计理念

本项目采用 Apple 的设计理念：

- **简洁性**：去除不必要的元素，聚焦核心功能
- **清晰性**：使用清晰的排版和视觉层次
- **深度感**：通过阴影和圆角营造深度
- **流畅性**：平滑的过渡动画和交互反馈
- **优雅性**：精致的细节和配色方案

## 🔒 安全说明

- 上传的文件在解析后会立即删除，不会保存在服务器
- API Key 应妥善保管，建议使用环境变量
- 生产环境请修改 `SECRET_KEY`

## 📝 API 说明

### 文件上传
- **路径**：`/upload`
- **方法**：POST
- **参数**：file (multipart/form-data)

### 批量翻译
- **路径**：`/translate`
- **方法**：POST
- **参数**：
  - content: 文本内容列表
  - target_lang: 目标语言代码
  - source_lang: 源语言代码（默认 auto）

### 单段翻译
- **路径**：`/translate-single`
- **方法**：POST
- **参数**：
  - text: 要翻译的文本
  - target_lang: 目标语言代码
  - source_lang: 源语言代码（默认 auto）

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 👤 作者

**阿尼亚与她** - [GitHub](https://github.com/dreamfeelings)

---

Made with ❤️ by 阿尼亚与她 | **享受翻译吧！** 🎉
