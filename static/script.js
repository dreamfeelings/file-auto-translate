 let currentContent = null;
        let translatedContent = null;
        let currentFileName = '翻译结果';
        let originalHtmlContent = null;  // 保存原始HTML内容
        let hasFormat = false;  // 是否是格式化文档
        let pendingFiles = null;  // 待上传的文件（仅用于图片）
        let imageTranslateMode = 'segment';  // 图片翻译模式：segment(分段) or whole(整图)

        // 获取元素
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('fileInput');
        const selectedFileName = document.getElementById('selectedFileName');

        // 点击拖拽区域打开文件选择
        dropZone.addEventListener('click', function() {
            fileInput.click();
        });

        // 阻止默认拖拽行为
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
            document.body.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        // 拖拽悬停效果
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, function() {
                dropZone.classList.add('dragover');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, function() {
                dropZone.classList.remove('dragover');
            }, false);
        });

        // 处理文件拖放
        dropZone.addEventListener('drop', function(e) {
            const files = Array.from(e.dataTransfer.files);
            if (files.length > 0) {
                handleFiles(files);
            }
        });

        // 文件选择事件
        fileInput.addEventListener('change', function(e) {
            const files = Array.from(e.target.files);
            if (files.length > 0) {
                handleFiles(files);
            }
        });

        // 检查是否为图片文件
        function isImageFile(file) {
            const ext = file.name.split('.').pop().toLowerCase();
            return ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(ext);
        }
        
        // 生成图片预览
        function generateImagePreviews(imageFiles) {
            const container = document.getElementById('imagePreviewContainer');
            container.innerHTML = '';
            
            imageFiles.forEach((file, index) => {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const previewItem = document.createElement('div');
                    previewItem.className = 'image-preview-item';
                    previewItem.innerHTML = `
                        <img src="${e.target.result}" alt="预览${index + 1}" onclick="event.stopPropagation(); openImageModal('${e.target.result}', '图片 ${index + 1}')">
                        <div class="preview-number">${index + 1}</div>
                        <div class="preview-remove" onclick="event.stopPropagation(); removeImage(${index})" title="删除">×</div>
                    `;
                    container.appendChild(previewItem);
                };
                reader.readAsDataURL(file);
            });
        }
        
        // 打开图片放大预览
        function openImageModal(imageSrc, caption) {
            const modal = document.getElementById('imageModal');
            const modalImg = document.getElementById('modalImage');
            const modalCaption = document.getElementById('modalCaption');
            
            modal.classList.add('show');
            modalImg.src = imageSrc;
            modalCaption.textContent = caption;
        }
        
        // 关闭图片放大预览
        function closeImageModal() {
            const modal = document.getElementById('imageModal');
            modal.classList.remove('show');
        }
        
        // ESC键关闭模态框
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeImageModal();
            }
        });
        
        // 删除某张图片
        function removeImage(index) {
            if (pendingFiles && pendingFiles.length > index) {
                pendingFiles.splice(index, 1);
                
                if (pendingFiles.length === 0) {
                    // 没有图片了
                    selectedFileName.textContent = '';
                    document.getElementById('imagePreviewContainer').innerHTML = '';
                    document.getElementById('translateBtn').disabled = true;
                    showStatus('已取消所有图片', 'info');
                } else {
                    // 更新预览和文件名
                    selectedFileName.textContent = `📷 已选择 ${pendingFiles.length} 张图片`;
                    generateImagePreviews(pendingFiles);
                    showStatus(`已删除图片，剩余 ${pendingFiles.length} 张`, 'success');
                }
            }
        }
        
        // 处理多个文件（主要用于多张图片）
        async function handleFiles(files) {
            // 先过滤出图片文件
            const newImageFiles = Array.from(files).filter(f => isImageFile(f));
            const nonImageFiles = Array.from(files).filter(f => !isImageFile(f));
            
            // 如果有非图片文件
            if (nonImageFiles.length > 0) {
                if (nonImageFiles.length === 1 && newImageFiles.length === 0) {
                    // 只有一个非图片文件：PDF/Word，立即解析
                    document.getElementById('imagePreviewContainer').innerHTML = '';
                    pendingFiles = null;
                    return handleFile(nonImageFiles[0]);
                } else if (nonImageFiles.length > 0) {
                    showStatus(`已过滤 ${nonImageFiles.length} 个非图片文件`, 'warning');
                }
            }
            
            if (newImageFiles.length === 0) {
                if (files.length > 0) {
                    showStatus('多文件上传仅支持图片格式', 'error');
                }
                return;
            }
            
            // 合并新图片到现有图片列表（累加模式）
            if (pendingFiles && pendingFiles.length > 0) {
                // 已有图片，追加新图片
                pendingFiles = [...pendingFiles, ...newImageFiles];
                showStatus(`已添加 ${newImageFiles.length} 张图片，当前共 ${pendingFiles.length} 张`, 'success');
            } else {
                // 首次选择图片
                pendingFiles = newImageFiles;
                showStatus(`已选择 ${newImageFiles.length} 张图片，点击按钮开始识别和翻译`, 'success');
            }
            
            // 更新显示
            selectedFileName.textContent = `📷 已选择 ${pendingFiles.length} 张图片`;
            generateImagePreviews(pendingFiles);
            document.getElementById('translateBtn').disabled = false;
        }
        
        // 实际上传和识别图片
        async function uploadAndRecognizeImages(imageFiles) {
            selectedFileName.textContent = `📷 正在识别 ${imageFiles.length} 张图片...`;
            showStatus(`正在识别 ${imageFiles.length} 张图片...`, 'info');
            
            try {
                let allContent = [];
                let successCount = 0;
                
                for (let i = 0; i < imageFiles.length; i++) {
                    const file = imageFiles[i];
                    const formData = new FormData();
                    formData.append('file', file);
                    
                    showStatus(`正在识别第 ${i + 1}/${imageFiles.length} 张图片...`, 'info');
                    
                    try {
                        const response = await fetch('/upload', {
                            method: 'POST',
                            body: formData
                        });
                        
                        const data = await response.json();
                        
                        if (data.success && data.content) {
                            // 为每个图片的内容添加来源标记
                            data.content.forEach(item => {
                                allContent.push({
                                    ...item,
                                    text: `[图片${i + 1}] ${item.text}`,
                                    source_image: i + 1
                                });
                            });
                            successCount++;
                        }
                    } catch (error) {
                        console.error(`图片${i + 1}识别失败:`, error);
                    }
                }
                
                if (allContent.length > 0) {
                    currentContent = allContent;
                    currentFileName = `${imageFiles.length}张图片`;
                    hasFormat = false;
                    originalHtmlContent = null;
                    
                    displayOriginalContent(allContent);
                    document.getElementById('translateBtn').disabled = false;
                    document.getElementById('exportActions').style.display = 'none';
                    // 保留预览，不清空
                    showStatus(`成功识别 ${successCount}/${imageFiles.length} 张图片，共 ${allContent.length} 段内容`, 'success');
                } else {
                    showStatus('所有图片识别失败', 'error');
                    selectedFileName.textContent = '';
                    document.getElementById('imagePreviewContainer').innerHTML = '';
                }
            } catch (error) {
                showStatus('批量识别失败: ' + error.message, 'error');
                selectedFileName.textContent = '';
                document.getElementById('imagePreviewContainer').innerHTML = '';
            }
        }

        // 统一的文件处理函数（单个文件）
        async function handleFile(file) {
            // 显示文件名（CSS会自动显示非空内容）
            selectedFileName.textContent = '📄 ' + file.name;
            
            showStatus('正在解析文件...', 'info');

            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await fetch('/upload', {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();

                if (data.success) {
                    currentContent = data.content;
                    currentFileName = file.name.replace(/\.[^/.]+$/, '');
                    hasFormat = data.has_format || false;
                    originalHtmlContent = data.html_content || null;
                    
                    // 根据是否有格式化内容选择显示方式
                    if (hasFormat && originalHtmlContent) {
                        displayFormattedContent(originalHtmlContent, 'originalContent');
                    } else {
                        displayOriginalContent(data.content);
                    }
                    
                    document.getElementById('translateBtn').disabled = false;
                    document.getElementById('exportActions').style.display = 'none';
                    showStatus(`文件解析成功！共 ${data.content.length} 段内容`, 'success');
                } else {
                    showStatus('文件解析失败: ' + data.error, 'error');
                    selectedFileName.textContent = '';  // 清空内容即自动隐藏
                }
            } catch (error) {
                showStatus('上传失败: ' + error.message, 'error');
                selectedFileName.textContent = '';  // 清空内容即自动隐藏
            }
        }

        // 显示格式化的HTML内容
        function displayFormattedContent(htmlContent, containerId) {
            const container = document.getElementById(containerId);
            const wrapper = document.createElement('div');
            wrapper.className = 'document-preview';
            wrapper.innerHTML = htmlContent;
            container.innerHTML = '';
            container.appendChild(wrapper);
            
            // 为格式化文档中的可翻译元素添加交互事件
            const translatableElements = wrapper.querySelectorAll('.translatable');
            translatableElements.forEach(element => {
                const paraId = element.id;
                
                // 鼠标悬停高亮
                element.addEventListener('mouseenter', function() {
                    highlightFormattedParagraph(paraId);
                });
                element.addEventListener('mouseleave', function() {
                    clearFormattedHighlight();
                });
                
                // 点击同步滚动
                element.addEventListener('click', function() {
                    syncScrollToElement(paraId);
                });
            });
        }

        // 显示原文内容
        function displayOriginalContent(content) {
            const container = document.getElementById('originalContent');
            container.innerHTML = '';

            content.forEach((item, index) => {
                const div = document.createElement('div');
                div.className = 'text-item';
                div.setAttribute('data-paragraph', index + 1);
                div.innerHTML = `
                    <div class="text-item-label">
                        <span class="paragraph-number">${index + 1}</span>
                        <span>原文段落</span>
                    </div>
                    <div class="text-content">${escapeHtml(item.text)}</div>
                `;
                
                // 添加鼠标悬停事件，同步高亮对应段落
                div.addEventListener('mouseenter', function() {
                    highlightParagraph(index + 1);
                });
                div.addEventListener('mouseleave', function() {
                    clearHighlight();
                });
                
                // 添加点击事件，同步滚动
                div.addEventListener('click', function() {
                    syncScrollToParagraph(index + 1);
                });
                
                container.appendChild(div);
            });
            
            // 延迟同步高度，确保DOM已渲染
            setTimeout(syncParagraphHeights, 50);
        }

        // 选择图片翻译模式
        function selectTranslateMode(mode) {
            imageTranslateMode = mode;
            document.getElementById('translateModeModal').classList.remove('show');
            
            // 执行对应的翻译流程
            if (mode === 'segment') {
                translateContentWithSegment();
            } else {
                translateContentWithWholeImage();
            }
        }
        
        // 分段识别翻译（先识别文字，再分段翻译）
        async function translateContentWithSegment() {
            const translateBtn = document.getElementById('translateBtn');
            translateBtn.disabled = true;
            translateBtn.innerHTML = '<span class="loading"></span> 识别中...';
            
            try {
                await uploadAndRecognizeImages(pendingFiles);
                pendingFiles = null;
                
                // 识别成功后自动开始翻译
                if (currentContent && currentContent.length > 0) {
                    translateBtn.innerHTML = '<span class="loading"></span> 翻译中...';
                    await translateContent();
                } else {
                    translateBtn.disabled = false;
                    translateBtn.textContent = '上传文件并翻译';
                }
            } catch (error) {
                translateBtn.disabled = false;
                translateBtn.textContent = '上传文件并翻译';
            }
        }
        
        // 整图翻译（直接发送图片给AI翻译）
        async function translateContentWithWholeImage() {
            const translateBtn = document.getElementById('translateBtn');
            const aiModel = document.getElementById('aiModel').value;
            const targetLang = document.getElementById('targetLang').value;
            
            translateBtn.disabled = true;
            translateBtn.innerHTML = '<span class="loading"></span> 整图翻译中...';
            showStatus(`正在翻译 ${pendingFiles.length} 张图片...`, 'info');
            
            try {
                let allTranslations = [];
                
                for (let i = 0; i < pendingFiles.length; i++) {
                    const file = pendingFiles[i];
                    showStatus(`正在翻译第 ${i + 1}/${pendingFiles.length} 张图片...`, 'info');
                    
                    // 读取图片为base64
                    const base64Image = await readFileAsBase64(file);
                    
                    // 调用AI进行整图翻译
                    const response = await fetch('/translate_image', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            image_base64: base64Image,
                            target_lang: targetLang,
                            ai_model: aiModel
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        allTranslations.push({
                            paragraph: i + 1,
                            text: `[图片${i + 1}原文]`,
                            translation: data.translation
                        });
                    } else {
                        allTranslations.push({
                            paragraph: i + 1,
                            text: `[图片${i + 1}原文]`,
                            translation: `[翻译失败: ${data.error}]`
                        });
                    }
                }
                
                // 显示翻译结果
                currentContent = allTranslations.map(t => ({ paragraph: t.paragraph, text: t.text }));
                translatedContent = allTranslations;
                currentFileName = `${pendingFiles.length}张图片`;
                
                displayOriginalContent(currentContent);
                displayTranslatedContent(translatedContent);
                
                document.getElementById('exportActions').style.display = 'flex';
                showStatus(`成功翻译 ${pendingFiles.length} 张图片！`, 'success');
                
                pendingFiles = null;
                
            } catch (error) {
                showStatus('整图翻译失败: ' + error.message, 'error');
            } finally {
                translateBtn.disabled = false;
                translateBtn.textContent = '上传文件并翻译';
            }
        }
        
        // 读取文件为base64
        function readFileAsBase64(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = function(e) {
                    // 提取base64部分（去掉data:image/...;base64,前缀）
                    const base64 = e.target.result.split(',')[1];
                    resolve(base64);
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        }
        
        // 翻译内容
        async function translateContent() {
            const translateBtn = document.getElementById('translateBtn');
            
            // 如果有待上传的图片文件，弹出模式选择
            if (pendingFiles && pendingFiles.length > 0) {
                document.getElementById('translateModeModal').classList.add('show');
                return;
            }
            
            if (!currentContent) return;

            const aiModel = document.getElementById('aiModel').value;
            const targetLang = document.getElementById('targetLang').value;
            
            translateBtn.disabled = true;
            translateBtn.innerHTML = '<span class="loading"></span> 翻译中...';
            
            const translatedContainer = document.getElementById('translatedContent');
            translatedContainer.innerHTML = '';

            showStatus('正在翻译，请稍候...', 'info');

            try {
                const response = await fetch('/translate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        content: currentContent,
                        target_lang: targetLang,
                        source_lang: 'auto',
                        html_content: originalHtmlContent,
                        ai_model: aiModel
                    })
                });

                const data = await response.json();

                if (data.success) {
                    translatedContent = data.translated_content;
                    
                    // 根据是否有格式化内容选择显示方式
                    if (hasFormat && data.translated_html) {
                        displayFormattedContent(data.translated_html, 'translatedContent');
                    } else {
                        displayTranslatedContent(data.translated_content);
                    }
                    
                    document.getElementById('exportActions').style.display = 'flex';
                    showStatus('翻译完成！您可以导出结果。', 'success');
                } else {
                    showStatus('翻译失败: ' + data.error, 'error');
                }
            } catch (error) {
                showStatus('翻译失败: ' + error.message, 'error');
            } finally {
                translateBtn.disabled = false;
                translateBtn.textContent = '开始翻译';
            }
        }

        // 显示翻译内容
        function displayTranslatedContent(content) {
            const container = document.getElementById('translatedContent');
            container.innerHTML = '';

            content.forEach((item, index) => {
                const div = document.createElement('div');
                div.className = 'text-item';
                div.setAttribute('data-paragraph', index + 1);
                div.innerHTML = `
                    <div class="text-item-label">
                        <span class="paragraph-number">${index + 1}</span>
                        <span>译文段落</span>
                    </div>
                    <div class="text-content">${escapeHtml(item.translation)}</div>
                `;
                
                // 添加鼠标悬停事件，同步高亮对应段落
                div.addEventListener('mouseenter', function() {
                    highlightParagraph(index + 1);
                });
                div.addEventListener('mouseleave', function() {
                    clearHighlight();
                });
                
                // 添加点击事件，同步滚动
                div.addEventListener('click', function() {
                    syncScrollToParagraph(index + 1);
                });
                
                container.appendChild(div);
            });
            
            // 延迟同步高度，确保DOM已渲染
            setTimeout(syncParagraphHeights, 50);
        }

        // 同步左右段落高度
        function syncParagraphHeights() {
            const originalItems = document.querySelectorAll('#originalContent .text-item');
            const translatedItems = document.querySelectorAll('#translatedContent .text-item');
            
            // 先清除之前设置的高度
            originalItems.forEach(item => item.style.minHeight = '');
            translatedItems.forEach(item => item.style.minHeight = '');
            
            // 为每对段落设置相同的最小高度
            const maxCount = Math.max(originalItems.length, translatedItems.length);
            for (let i = 0; i < maxCount; i++) {
                const originalItem = originalItems[i];
                const translatedItem = translatedItems[i];
                
                if (originalItem && translatedItem) {
                    const originalHeight = originalItem.offsetHeight;
                    const translatedHeight = translatedItem.offsetHeight;
                    const maxHeight = Math.max(originalHeight, translatedHeight);
                    
                    originalItem.style.minHeight = maxHeight + 'px';
                    translatedItem.style.minHeight = maxHeight + 'px';
                }
            }
        }

        // 显示状态消息
        function showStatus(message, type) {
            const statusDiv = document.getElementById('statusMessage');
            statusDiv.className = 'status-message status-' + type;
            statusDiv.textContent = message;
            statusDiv.style.display = 'block';

            if (type === 'success') {
                setTimeout(() => {
                    statusDiv.style.display = 'none';
                }, 3000);
            }
        }

        // HTML转义
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        // 段落高亮功能
        function highlightParagraph(paragraphNumber) {
            // 清除之前的高亮
            clearHighlight();
            
            // 高亮指定段落
            const items = document.querySelectorAll(`[data-paragraph="${paragraphNumber}"]`);
            items.forEach(item => {
                item.classList.add('highlighted');
            });
        }

        function clearHighlight() {
            const highlighted = document.querySelectorAll('.highlighted');
            highlighted.forEach(item => {
                item.classList.remove('highlighted');
            });
        }

        // 格式化文档的段落高亮功能
        function highlightFormattedParagraph(paraId) {
            clearFormattedHighlight();
            
            // 在两个面板中查找并高亮对应元素
            const originalElement = document.querySelector('#originalContent .document-preview #' + paraId);
            const translatedElement = document.querySelector('#translatedContent .document-preview #' + paraId);
            
            if (originalElement) {
                originalElement.style.background = '#E5F1FF';
            }
            if (translatedElement) {
                translatedElement.style.background = '#E5F1FF';
            }
        }

        function clearFormattedHighlight() {
            // 清除所有格式化文档的高亮
            const highlighted = document.querySelectorAll('.document-preview .translatable');
            highlighted.forEach(item => {
                item.style.background = '';
            });
        }

        // 滚动同步功能（段落模式）
        function syncScrollToParagraph(paragraphNumber) {
            const originalPanel = document.querySelector('#originalContent').parentElement;
            const translatedPanel = document.querySelector('#translatedContent').parentElement;
            
            const targetOriginal = document.querySelector(`#originalContent [data-paragraph="${paragraphNumber}"]`);
            const targetTranslated = document.querySelector(`#translatedContent [data-paragraph="${paragraphNumber}"]`);
            
            if (targetOriginal) {
                targetOriginal.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            if (targetTranslated) {
                targetTranslated.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            
            // 高亮一下点击的段落
            highlightParagraph(paragraphNumber);
            setTimeout(() => clearHighlight(), 2000);
        }

        // 滚动同步功能（格式化文档模式）
        function syncScrollToElement(paraId) {
            const originalElement = document.querySelector('#originalContent .document-preview #' + paraId);
            const translatedElement = document.querySelector('#translatedContent .document-preview #' + paraId);
            
            if (originalElement) {
                originalElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            if (translatedElement) {
                translatedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            
            // 高亮一下点击的元素
            highlightFormattedParagraph(paraId);
            setTimeout(() => clearFormattedHighlight(), 2000);
        }

        // 导出翻译结果
        async function exportTranslation(format, bilingual = false) {
            if (!translatedContent || translatedContent.length === 0) {
                showStatus('没有可导出的翻译内容', 'error');
                return;
            }

            const modeText = bilingual ? '双译' : '译文';
            showStatus(`正在生成${modeText}${format === 'txt' ? 'TXT' : 'Word'}文件...`, 'info');

            // 获取译文HTML（如果是格式化文档）
            let translatedHtml = null;
            if (hasFormat) {
                const translatedContainer = document.querySelector('#translatedContent .document-preview');
                if (translatedContainer) {
                    translatedHtml = translatedContainer.innerHTML;
                }
            }

            try {
                const response = await fetch('/export', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        content: translatedContent,
                        original_content: bilingual ? currentContent : null,  // 双译时包含原文
                        format: format,
                        filename: currentFileName,
                        has_format: hasFormat,
                        translated_html: translatedHtml,
                        bilingual: bilingual  // 是否双译
                    })
                });

                if (response.ok) {
                    // 下载文件
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    const suffix = bilingual ? '_双译' : '_翻译结果';
                    a.download = `${currentFileName}${suffix}.${format}`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                    
                    showStatus(`${modeText}${format === 'txt' ? 'TXT' : 'Word'}文件导出成功！`, 'success');
                } else {
                    const errorData = await response.json();
                    showStatus('导出失败: ' + errorData.error, 'error');
                }
            } catch (error) {
                showStatus('导出失败: ' + error.message, 'error');
            }
        }
        // 窗口大小改变时重新同步高度
        let resizeTimer;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function() {
                syncParagraphHeights();
            }, 200);
        });