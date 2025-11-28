"""
翻译服务模块 - 调用AI API进行翻译
"""
import requests
from typing import List, Dict
from concurrent.futures import ThreadPoolExecutor, as_completed
import config
import json

class Translator:
    """AI翻译服务"""
    
    def __init__(self):
        self.api_base_url = config.API_BASE_URL
        self.api_key = config.API_KEY
        self.model = config.MODEL
    
    def translate_text(self, text: str, target_lang: str = 'zh-CN', source_lang: str = 'auto', model_config: dict = None) -> str:
        """
        翻译单段文本
        
        Args:
            text: 要翻译的文本
            target_lang: 目标语言代码
            source_lang: 源语言代码（auto表示自动检测）
        
        Returns:
            翻译后的文本
        """
        try:
            # 使用传入的模型配置，或使用默认配置
            if model_config is None:
                api_base = self.api_base_url
                model = self.model
            else:
                api_base = model_config.get('base_url', self.api_base_url)
                model = model_config.get('model', self.model)
            
            # 构建翻译提示
            lang_name = config.LANGUAGES.get(target_lang, '中文')
            
            if source_lang == 'auto':
                prompt = f"""请将以下内容翻译成{lang_name}。
翻译要求：
1. 严格保持原文的段落格式和换行
2. 保持原文的标点符号风格
3. 保留专业术语、变量名、技术名词（如：ROA、GDP、API、crash_w等）
4. 对于专业术语，可在首次出现时使用"术语(translation)"格式
5. 只返回翻译结果，不要添加任何解释或注释
6. 如果原文有多个段落，译文也要保持相同的段落数量

原文：
{text}"""
            else:
                source_lang_name = config.LANGUAGES.get(source_lang, '')
                prompt = f"""请将以下{source_lang_name}内容翻译成{lang_name}。
翻译要求：
1. 严格保持原文的段落格式和换行
2. 保持原文的标点符号风格
3. 保留专业术语、变量名、技术名词（如：ROA、GDP、API、crash_w等）
4. 对于专业术语，可在首次出现时使用"术语(translation)"格式
5. 只返回翻译结果，不要添加任何解释或注释
6. 如果原文有多个段落，译文也要保持相同的段落数量

原文：
{text}"""
            
            # 调用API
            headers = {
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                'model': model,
                'messages': [
                    {
                        'role': 'user',
                        'content': prompt
                    }
                ],
                'temperature': 0.3
            }
            
            response = requests.post(
                f'{api_base}/v1/chat/completions',
                headers=headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                translation = result['choices'][0]['message']['content'].strip()
                return translation
            else:
                raise Exception(f"API请求失败: {response.status_code} - {response.text}")
                
        except Exception as e:
            raise Exception(f"翻译错误: {str(e)}")
    
    def translate_batch_optimized(self, texts_batch: List[str], target_lang: str = 'zh-CN', source_lang: str = 'auto', model_config: dict = None) -> List[str]:
        """
        批量翻译多段文本（一次API请求）
        
        Args:
            texts_batch: 文本列表（10-20段）
            target_lang: 目标语言
            source_lang: 源语言
        
        Returns:
            翻译结果列表
        """
        try:
            # 使用传入的模型配置，或使用默认配置
            if model_config is None:
                api_base = self.api_base_url
                model = self.model
            else:
                api_base = model_config.get('base_url', self.api_base_url)
                model = model_config.get('model', self.model)
            
            lang_name = config.LANGUAGES.get(target_lang, '中文')
            
            # 构建批量翻译提示
            # 使用JSON格式确保段落对应关系
            texts_json = []
            for idx, text in enumerate(texts_batch):
                texts_json.append({"index": idx, "text": text})
            
            prompt = f"""请将以下JSON数组中的文本翻译成{lang_name}。
翻译要求：
1. 严格保持每段的格式和换行
2. 保留专业术语、变量名、技术名词（如：ROA、GDP、crash_w、adj_ret等）
3. 对于专业术语，可在首次出现时使用"术语(translation)"格式，之后保持原文
4. 按照相同的index顺序返回翻译结果
5. 返回格式为JSON数组：[{{"index": 0, "translation": "翻译内容"}}, ...]
6. 只返回JSON数组，不要添加任何其他文字

原文JSON：
{json.dumps(texts_json, ensure_ascii=False, indent=2)}

请返回翻译后的JSON数组："""

            headers = {
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                'model': model,
                'messages': [
                    {
                        'role': 'user',
                        'content': prompt
                    }
                ],
                'temperature': 0.3
            }
            
            response = requests.post(
                f'{api_base}/v1/chat/completions',
                headers=headers,
                json=payload,
                timeout=60  # 批量翻译需要更长超时
            )
            
            if response.status_code == 200:
                result = response.json()
                translation_text = result['choices'][0]['message']['content'].strip()
                
                # 解析JSON响应
                # 尝试提取JSON数组
                if translation_text.startswith('```'):
                    # 移除markdown代码块
                    translation_text = translation_text.split('```')[1]
                    if translation_text.startswith('json'):
                        translation_text = translation_text[4:]
                    translation_text = translation_text.strip()
                
                translations_data = json.loads(translation_text)
                
                # 按index排序并提取翻译
                translations_data.sort(key=lambda x: x.get('index', 0))
                translations = [item.get('translation', '') for item in translations_data]
                
                return translations
            else:
                raise Exception(f"API请求失败: {response.status_code}")
                
        except Exception as e:
            # 批量翻译失败，降级为逐段翻译
            print(f"批量翻译失败，降级为逐段: {str(e)}")
            translations = []
            for text in texts_batch:
                try:
                    trans = self.translate_text(text, target_lang, source_lang, model_config)
                    translations.append(trans)
                except:
                    translations.append(f"[翻译失败]")
            return translations
    
    def translate_batch(self, texts: List[Dict], target_lang: str = 'zh-CN', source_lang: str = 'auto', batch_size: int = 15, max_workers: int = 3, model_config: dict = None) -> List[Dict]:
        """
        批量翻译文本（使用线程池并发 + 分批处理）
        
        Args:
            texts: 文本列表，每项包含原文信息
            target_lang: 目标语言
            source_lang: 源语言
            batch_size: 每批处理的段落数（默认15段）
            max_workers: 最大线程数（默认3个并发）
        
        Returns:
            包含翻译结果的列表
        """
        total = len(texts)
        results = [None] * total  # 预分配结果列表，保持顺序
        
        # 分批
        batches = []
        for i in range(0, total, batch_size):
            batch_items = texts[i:i + batch_size]
            batch_texts = [item['text'] for item in batch_items]
            batches.append({
                'start_idx': i,
                'items': batch_items,
                'texts': batch_texts
            })
        
        print(f"总共 {total} 段，分成 {len(batches)} 批，每批最多 {batch_size} 段")
        
        # 使用线程池并发处理
        def process_batch(batch_info):
            """处理一个批次"""
            try:
                start_idx = batch_info['start_idx']
                items = batch_info['items']
                texts = batch_info['texts']
                
                # 批量翻译
                translations = self.translate_batch_optimized(texts, target_lang, source_lang, model_config)
                
                # 构建结果
                batch_results = []
                for idx, item in enumerate(items):
                    result_item = item.copy()
                    result_item['translation'] = translations[idx] if idx < len(translations) else "[翻译失败]"
                    batch_results.append((start_idx + idx, result_item))
                
                return batch_results
                
            except Exception as e:
                print(f"批次处理失败: {str(e)}")
                # 失败时逐段翻译
                batch_results = []
                for idx, item in enumerate(batch_info['items']):
                    try:
                        translation = self.translate_text(item['text'], target_lang, source_lang, model_config)
                        result_item = item.copy()
                        result_item['translation'] = translation
                    except:
                        result_item = item.copy()
                        result_item['translation'] = "[翻译失败]"
                    batch_results.append((batch_info['start_idx'] + idx, result_item))
                return batch_results
        
        # 使用线程池并发处理批次
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # 提交所有批次
            future_to_batch = {executor.submit(process_batch, batch): batch for batch in batches}
            
            # 获取结果
            for future in as_completed(future_to_batch):
                batch_results = future.result()
                # 将结果放回正确位置
                for idx, result_item in batch_results:
                    results[idx] = result_item
        
        return results
    
    def translate_image(self, image_base64: str, target_lang: str = 'zh-CN', model_config: dict = None) -> str:
        """
        整图翻译（直接发送图片给AI进行翻译）
        
        Args:
            image_base64: 图片的base64编码（不含data:image前缀）
            target_lang: 目标语言代码
            model_config: 模型配置
        
        Returns:
            翻译后的文本
        """
        try:
            # 使用传入的模型配置，或使用默认配置
            if model_config is None:
                api_base = self.api_base_url
                model = self.model
            else:
                api_base = model_config.get('base_url', self.api_base_url)
                model = model_config.get('model', self.model)
            
            lang_name = config.LANGUAGES.get(target_lang, '中文')
            
            # 构建翻译提示（支持视觉模型）
            prompt = f"""请识别图片中的所有文字内容，并将其翻译成{lang_name}。

翻译要求：
1. 识别图片中的所有文字（包括标题、正文、标注等）
2. 保持原文的排版结构和段落顺序
3. 保留专业术语、变量名、技术名词
4. 只返回翻译结果，不要添加解释
5. 如果图片中有多段文字，请按顺序翻译并保持段落分隔

请开始翻译："""
            
            # 调用API（支持vision模型）
            headers = {
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                'model': model,
                'messages': [
                    {
                        'role': 'user',
                        'content': [
                            {
                                'type': 'text',
                                'text': prompt
                            },
                            {
                                'type': 'image_url',
                                'image_url': {
                                    'url': f'data:image/jpeg;base64,{image_base64}'
                                }
                            }
                        ]
                    }
                ],
                'temperature': 0.3,
                'max_tokens': 2000
            }
            
            response = requests.post(
                f'{api_base}/v1/chat/completions',
                headers=headers,
                json=payload,
                timeout=60  # 图片处理可能需要更长时间
            )
            
            if response.status_code == 200:
                result = response.json()
                translation = result['choices'][0]['message']['content'].strip()
                return translation
            else:
                raise Exception(f"API请求失败: {response.status_code} - {response.text}")
                
        except Exception as e:
            raise Exception(f"整图翻译错误: {str(e)}")
