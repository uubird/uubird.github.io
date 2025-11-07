/**
 * 留言管理模块 - 提供完整的留言系统功能
 * 支持留言提交、后台回复、数据修改（内容和时间）
 * 具备完善的错误处理、数据验证和事务管理
 */
const RobustMessageManager = (() => {
    // 私有属性
    const _private = {
        // 配置和常量
        STORAGE_KEY: 'messages',
        BACKUP_STORAGE_KEY: 'messages_backup',
        TRANSACTION_KEY: 'messages_transaction',
        
        // 内存存储
        memoryStorage: [],
        
        // 状态标记
        isInitialized: false,
        isLocalStorageSupported: false,
        lastSyncTime: 0,
        
        // 备份定时器
        autoBackupTimer: null,
        
        // 默认留言数据 - 清空默认留言
        DEFAULT_MESSAGES: [],
        
        // 标记防止重复创建默认留言
        hasPreventedDefaultMessages: false,
        
        /**
         * 初始化模块
         */
        init() {
            try {
                console.log('[MessageManager] 开始初始化...');
                
                // 检查localStorage支持
                this.isLocalStorageSupported = this._checkStorageSupport();
                
                // 尝试从存储加载数据
                this._loadFromStorage();
                
                // 启动自动备份
                this._startAutoBackup();
                
                // 注册事件监听器
                this._registerEventListeners();
                
                this.isInitialized = true;
                console.log('[MessageManager] 初始化完成');
            } catch (error) {
                console.error('[MessageManager] 初始化失败:', error);
                this.isInitialized = false;
                this.memoryStorage = this.DEFAULT_MESSAGES;
            }
        },
        
        /**
         * 获取文件路径
         * @param {string} type 文件类型 ('messages' 或 'students')
         * @returns {string} 文件路径
         */
        _getFilePath(type) {
            // 自动检测当前路径并设置正确的文件路径
            const currentPath = window.location.pathname;
            const isAdminPath = currentPath.includes('/admin/') || currentPath.includes('\\admin\\') || currentPath.includes('admin/');
            
            if (type === 'students') {
                return isAdminPath ? '../assets/data/students.json' : 'assets/data/students.json';
            }
            
            return isAdminPath ? '../assets/data/messages.json' : 'assets/data/messages.json';
        },
        
        /**
         * 检查localStorage支持
         */
        _checkStorageSupport() {
            try {
                const testKey = '__robust_storage_test__';
                localStorage.setItem(testKey, testKey);
                localStorage.removeItem(testKey);
                return true;
            } catch (e) {
                console.warn('[MessageManager] localStorage不可用，使用内存存储');
                return false;
            }
        },
        
        /**
         * 从存储加载数据
         */
        _loadFromStorage() {
            try {
                let messages = [];
                
                // 尝试从主存储加载
                if (this.isLocalStorageSupported) {
                    const storedData = localStorage.getItem(this.STORAGE_KEY);
                    if (storedData) {
                        try {
                            messages = JSON.parse(storedData);
                            if (!Array.isArray(messages)) {
                                console.error('[MessageManager] 主存储数据格式错误');
                                messages = [];
                            } else {
                                console.log('[MessageManager] 从主存储加载了', messages.length, '条消息');
                            }
                        } catch (parseError) {
                            console.error('[MessageManager] 解析主存储数据失败:', parseError);
                            messages = [];
                        }
                    }
                }
                
                // 如果主存储失败，尝试从备份存储加载
                if (messages.length === 0 && this.isLocalStorageSupported) {
                    const backupData = localStorage.getItem(this.BACKUP_STORAGE_KEY);
                    if (backupData) {
                        try {
                            messages = JSON.parse(backupData);
                            if (!Array.isArray(messages)) {
                                console.error('[MessageManager] 备份存储数据格式错误');
                                messages = [];
                            } else {
                                console.log('[MessageManager] 从备份存储加载了', messages.length, '条消息');
                            }
                        } catch (parseError) {
                            console.error('[MessageManager] 解析备份存储数据失败:', parseError);
                            messages = [];
                        }
                    }
                }
                
                // 如果所有存储都失败，使用默认数据
                if (messages.length === 0) {
                    // 检查是否已经标记过防止默认留言
                    if (this.isLocalStorageSupported && !localStorage.getItem('__prevent_default_messages')) {
                        console.log('[MessageManager] 使用空默认数据');
                        messages = this.DEFAULT_MESSAGES;
                        // 标记防止默认留言
                        localStorage.setItem('__prevent_default_messages', 'true');
                        // 保存空数据
                        if (this.isLocalStorageSupported) {
                            this._saveToStorage(messages);
                        }
                    } else {
                        console.log('[MessageManager] 使用空数据');
                        messages = [];
                    }
                }
                
                // 验证和清理数据
                this.memoryStorage = this._validateMessages(messages);
                this.lastSyncTime = Date.now();
                
                return true;
            } catch (error) {
                console.error('[MessageManager] 加载存储失败:', error);
                this.memoryStorage = this.DEFAULT_MESSAGES;
                return false;
            }
        },
        
        /**
         * 保存数据到存储
         */
        _saveToStorage(messages) {
            try {
                // 验证输入
                if (!Array.isArray(messages)) {
                    throw new Error('数据必须是数组');
                }
                
                const validatedMessages = this._validateMessages(messages);
                const dataToStore = JSON.stringify(validatedMessages);
                
                if (this.isLocalStorageSupported) {
                    try {
                        // 开始事务
                        localStorage.setItem(this.TRANSACTION_KEY, 'in_progress');
                        
                        // 先备份现有数据
                        const currentData = localStorage.getItem(this.STORAGE_KEY);
                        if (currentData) {
                            localStorage.setItem(this.BACKUP_STORAGE_KEY, currentData);
                        }
                        
                        // 保存新数据
                        localStorage.setItem(this.STORAGE_KEY, dataToStore);
                        
                        // 提交事务
                        localStorage.removeItem(this.TRANSACTION_KEY);
                        
                        console.log('[MessageManager] 数据保存成功，共', validatedMessages.length, '条');
                        return true;
                    } catch (storageError) {
                        console.error('[MessageManager] 存储失败:', storageError);
                        // 回滚事务
                        localStorage.removeItem(this.TRANSACTION_KEY);
                        return false;
                    }
                }
                
                // 如果localStorage不可用，只更新内存
                this.memoryStorage = validatedMessages;
                return true;
            } catch (error) {
                console.error('[MessageManager] 保存数据失败:', error);
                return false;
            }
        },
        
        /**
         * 验证消息数据
         */
        _validateMessages(messages) {
            if (!Array.isArray(messages)) {
                return [];
            }
            
            const validMessages = [];
            
            for (let msg of messages) {
                try {
                    if (!msg || typeof msg !== 'object') continue;
                    
                    // 验证必要字段
                    if (!msg.id || !msg.studentName || !msg.content) continue;
                    
                    // 标准化消息对象
                    const cleanedMsg = {
                        id: String(msg.id).trim(),
                        studentName: String(msg.studentName).trim(),
                        studentId: msg.studentId ? String(msg.studentId).trim() : '未知学号',
                        className: msg.className ? String(msg.className).trim() : '未设置班级',
                        title: msg.title ? String(msg.title).trim() : '无标题',
                        content: String(msg.content).trim(),
                        timestamp: msg.timestamp || this.getCurrentTime(),
                        status: msg.status || '待回复',
                        replies: this._validateReplies(msg.replies || [])
                    };
                    
                    validMessages.push(cleanedMsg);
                } catch (e) {
                    console.warn('[MessageManager] 跳过无效消息:', e);
                }
            }
            
            return validMessages;
        },
        
        /**
         * 验证回复数据
         */
        _validateReplies(replies) {
            if (!Array.isArray(replies)) {
                return [];
            }
            
            const validReplies = [];
            
            for (let reply of replies) {
                try {
                    if (!reply || typeof reply !== 'object') continue;
                    
                    // 验证必要字段
                    if (!reply.content) continue;
                    
                    // 标准化回复对象
                    const cleanedReply = {
                        id: reply.id || this.generateUniqueId(),
                        teacher: reply.teacher || '管理员',
                        content: String(reply.content).trim(),
                        timestamp: reply.timestamp || this.getCurrentTime()
                    };
                    
                    validReplies.push(cleanedReply);
                } catch (e) {
                    console.warn('[MessageManager] 跳过无效回复:', e);
                }
            }
            
            return validReplies;
        },
        
        /**
         * 启动自动备份
         */
        _startAutoBackup() {
            try {
                // 每10分钟自动备份一次
                const backupInterval = 10 * 60 * 1000;
                
                if (this.autoBackupTimer) {
                    clearInterval(this.autoBackupTimer);
                }
                
                this.autoBackupTimer = setInterval(() => {
                    this.backupData();
                }, backupInterval);
                
                console.log('[RobustMessageManager] 自动备份已启动');
            } catch (error) {
                console.error('[RobustMessageManager] 启动自动备份失败:', error);
            }
        },
        
        /**
         * 注册事件监听器
         */
        _registerEventListeners() {
            if (typeof window !== 'undefined') {
                // 页面卸载时保存数据
                window.addEventListener('beforeunload', () => {
                    this.backupData();
                });
                
                // 窗口聚焦时同步数据
                window.addEventListener('focus', () => {
                    this._loadFromStorage();
                });
            }
        },
        
        /**
         * 生成唯一ID
         */
        generateUniqueId() {
            return 'msg-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 10);
        },
        
        /**
         * 获取当前时间
         */
        getCurrentTime() {
            const now = new Date();
            return now.toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        },
        
        /**
         * 查找留言
         */
        findMessageById(id) {
            if (!id) return null;
            return this.memoryStorage.find(msg => msg.id === id) || null;
        },
        
        /**
         * 获取留言索引
         */
        findMessageIndexById(id) {
            if (!id) return -1;
            return this.memoryStorage.findIndex(msg => msg.id === id);
        }
    };
    
    // 公共API
    return {
        /**
         * 初始化模块
         */
        init() {
            _private.init();
            return this;
        },
        
        /**
         * 获取所有留言
         * @param {Object} options 选项
         * @param {boolean} options.sortByTime 是否按时间排序
         * @param {string} options.status 按状态筛选
         * @returns {Object} 结果对象
         */
        getMessages(options = {}) {
            try {
                if (!_private.isInitialized) {
                    _private.init();
                }
                
                // 创建副本避免修改原始数据
                let messages = [..._private.memoryStorage];
                
                // 按状态筛选
                if (options.status) {
                    messages = messages.filter(msg => msg.status === options.status);
                }
                
                // 按时间排序
                if (options.sortByTime !== false) {
                    messages.sort((a, b) => {
                        try {
                            const dateA = new Date(a.timestamp);
                            const dateB = new Date(b.timestamp);
                            return isNaN(dateA.getTime()) || isNaN(dateB.getTime()) 
                                ? 0 
                                : dateB.getTime() - dateA.getTime();
                        } catch (e) {
                            return 0;
                        }
                    });
                }
                
                return {
                    success: true,
                    data: messages,
                    count: messages.length
                };
            } catch (error) {
                console.error('[RobustMessageManager] 获取留言失败:', error);
                return {
                    success: false,
                    error: error.message,
                    data: []
                };
            }
        },
        

        
        /**
         * 添加新留言
         * @param {Object} messageData 留言数据
         * @returns {Object} 结果对象
         */
        addMessage(messageData) {
            try {
                if (!_private.isInitialized) {
                    _private.init();
                }
                
                // 验证留言数据
                if (!messageData || typeof messageData !== 'object') {
                    throw new Error('无效的留言数据');
                }
                
                // 检查必要字段
                const requiredFields = ['studentName', 'content'];
                const missingFields = requiredFields.filter(field => !messageData[field]);
                
                if (missingFields.length > 0) {
                    throw new Error(`缺少必要字段: ${missingFields.join(', ')}`);
                }
                
                // 创建新留言对象
                const newMessage = {
                    id: _private.generateUniqueId(),
                    studentName: String(messageData.studentName).trim(),
                    studentId: messageData.studentId ? String(messageData.studentId).trim() : '未知学号',
                    className: messageData.className ? String(messageData.className).trim() : '未知班级',
                    title: messageData.title ? String(messageData.title).trim() : '无标题',
                    content: String(messageData.content).trim(),
                    timestamp: _private.getCurrentTime(),
                    status: '待回复',
                    replies: []
                };
                
                // 添加到内存存储
                _private.memoryStorage.unshift(newMessage);
                
                // 保存到持久存储
                const saveSuccess = _private._saveToStorage(_private.memoryStorage);
                
                if (saveSuccess) {
                    console.log('[RobustMessageManager] 新增留言成功:', newMessage.id);
                    return {
                        success: true,
                        data: newMessage
                    };
                } else {
                    // 如果保存失败，从内存中移除
                    _private.memoryStorage.shift();
                    throw new Error('保存留言失败');
                }
            } catch (error) {
                console.error('[RobustMessageManager] 添加留言失败:', error);
                return {
                    success: false,
                    error: error.message,
                    data: null
                };
            }
        },
        
        /**
         * 更新留言
         * @param {string} messageId 留言ID
         * @param {Object} updates 更新数据
         * @returns {Object} 结果对象
         */
        updateMessage(messageId, updates) {
            try {
                if (!_private.isInitialized) {
                    _private.init();
                }
                
                if (!messageId || !updates || typeof updates !== 'object') {
                    throw new Error('无效的参数');
                }
                
                const index = _private.findMessageIndexById(messageId);
                if (index === -1) {
                    throw new Error('留言不存在');
                }
                
                // 创建更新前的备份
                const originalMessage = { ..._private.memoryStorage[index] };
                
                // 更新留言数据
                const updatedMessage = { ..._private.memoryStorage[index] };
                
                // 更新允许的字段
                const allowedFields = ['title', 'content', 'timestamp', 'status', 'studentName', 'studentId', 'className'];
                
                for (const field of allowedFields) {
                    if (updates.hasOwnProperty(field)) {
                        updatedMessage[field] = String(updates[field]).trim();
                    }
                }
                
                // 应用更新
                _private.memoryStorage[index] = updatedMessage;
                
                // 保存到持久存储
                const saveSuccess = _private._saveToStorage(_private.memoryStorage);
                
                if (saveSuccess) {
                    console.log('[RobustMessageManager] 更新留言成功:', messageId);
                    return {
                        success: true,
                        data: updatedMessage,
                        original: originalMessage
                    };
                } else {
                    // 如果保存失败，恢复原始数据
                    _private.memoryStorage[index] = originalMessage;
                    throw new Error('保存更新失败');
                }
            } catch (error) {
                console.error('[RobustMessageManager] 更新留言失败:', error);
                return {
                    success: false,
                    error: error.message,
                    data: null
                };
            }
        },
        
        /**
         * 添加回复
         * @param {string} messageId 留言ID
         * @param {Object} replyData 回复数据
         * @returns {Object} 结果对象
         */
        addReply(messageId, replyData) {
            try {
                if (!_private.isInitialized) {
                    _private.init();
                }
                
                if (!messageId || !replyData || typeof replyData !== 'object' || !replyData.content) {
                    throw new Error('无效的参数或回复内容为空');
                }
                
                const index = _private.findMessageIndexById(messageId);
                if (index === -1) {
                    throw new Error('留言不存在');
                }
                
                // 创建更新前的备份
                const originalMessage = JSON.parse(JSON.stringify(_private.memoryStorage[index]));
                
                // 创建新回复
                const newReply = {
                    id: _private.generateUniqueId(),
                    teacher: replyData.teacher ? String(replyData.teacher).trim() : '管理员',
                    content: String(replyData.content).trim(),
                    timestamp: _private.getCurrentTime()
                };
                
                // 添加回复并更新状态
                _private.memoryStorage[index].replies.push(newReply);
                _private.memoryStorage[index].status = '已回复';
                
                // 保存到持久存储
                const saveSuccess = _private._saveToStorage(_private.memoryStorage);
                
                if (saveSuccess) {
                    console.log('[RobustMessageManager] 添加回复成功:', newReply.id);
                    return {
                        success: true,
                        data: _private.memoryStorage[index],
                        reply: newReply
                    };
                } else {
                    // 如果保存失败，恢复原始数据
                    _private.memoryStorage[index] = originalMessage;
                    throw new Error('保存回复失败');
                }
            } catch (error) {
                console.error('[RobustMessageManager] 添加回复失败:', error);
                return {
                    success: false,
                    error: error.message,
                    data: null
                };
            }
        },
        
        /**
         * 删除留言
         * @param {string} messageId 留言ID
         * @returns {Object} 结果对象
         */
        deleteMessage(messageId) {
            try {
                if (!_private.isInitialized) {
                    _private.init();
                }
                
                if (!messageId) {
                    throw new Error('留言ID不能为空');
                }
                
                const index = _private.findMessageIndexById(messageId);
                if (index === -1) {
                    throw new Error('留言不存在');
                }
                
                // 保存要删除的留言以便返回
                const deletedMessage = _private.memoryStorage[index];
                
                // 从内存中删除
                _private.memoryStorage.splice(index, 1);
                
                // 保存到持久存储
                const saveSuccess = _private._saveToStorage(_private.memoryStorage);
                
                if (saveSuccess) {
                    console.log('[RobustMessageManager] 删除留言成功:', messageId);
                    return {
                        success: true,
                        data: deletedMessage
                    };
                } else {
                    // 如果保存失败，恢复数据
                    _private.memoryStorage.splice(index, 0, deletedMessage);
                    throw new Error('删除操作失败');
                }
            } catch (error) {
                console.error('[RobustMessageManager] 删除留言失败:', error);
                return {
                    success: false,
                    error: error.message,
                    data: null
                };
            }
        },
        
        /**
         * 清空所有留言
         * @param {boolean} keepDefault 是否保留默认留言
         * @returns {Object} 结果对象
         */
        clearMessages(keepDefault = false) {
            try {
                if (!_private.isInitialized) {
                    _private.init();
                }
                
                // 保存清空前的数量
                const countBefore = _private.memoryStorage.length;
                
                // 清空或保留默认留言
                _private.memoryStorage = keepDefault ? _private.DEFAULT_MESSAGES : [];
                
                // 保存到持久存储
                const saveSuccess = _private._saveToStorage(_private.memoryStorage);
                
                if (saveSuccess) {
                    console.log('[RobustMessageManager] 清空留言成功，清空了', countBefore - _private.memoryStorage.length, '条');
                    return {
                        success: true,
                        countBefore,
                        countAfter: _private.memoryStorage.length
                    };
                } else {
                    throw new Error('清空操作失败');
                }
            } catch (error) {
                console.error('[RobustMessageManager] 清空留言失败:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        },
        
        /**
         * 备份数据
         */
        backupData() {
            try {
                if (!_private.isInitialized) {
                    _private.init();
                }
                
                if (_private.isLocalStorageSupported) {
                    const backupData = JSON.stringify(_private.memoryStorage);
                    localStorage.setItem(_private.BACKUP_STORAGE_KEY, backupData);
                    console.log('[RobustMessageManager] 数据备份成功');
                    return { success: true };
                }
                return { success: false, error: 'localStorage不可用' };
            } catch (error) {
                console.error('[RobustMessageManager] 备份数据失败:', error);
                return { success: false, error: error.message };
            }
        },
        
        /**
         * 恢复数据
         */
        restoreData() {
            try {
                if (!_private.isInitialized) {
                    _private.init();
                }
                
                if (_private.isLocalStorageSupported) {
                    const backupData = localStorage.getItem(_private.BACKUP_STORAGE_KEY);
                    if (backupData) {
                        const messages = JSON.parse(backupData);
                        if (Array.isArray(messages)) {
                            _private.memoryStorage = messages;
                            _private._saveToStorage(messages);
                            console.log('[MessageManager] 数据恢复成功');
                            return { success: true, count: messages.length };
                        }
                    }
                    return { success: false, error: '备份数据不存在或格式错误' };
                }
                return { success: false, error: 'localStorage不可用' };
            } catch (error) {
                console.error('[RobustMessageManager] 恢复数据失败:', error);
                return { success: false, error: error.message };
            }
        },
        
        /**
         * 获取模块状态
         */
        getStatus() {
            return {
                initialized: _private.isInitialized,
                localStorageSupported: _private.isLocalStorageSupported,
                messageCount: _private.memoryStorage.length,
                lastSyncTime: _private.lastSyncTime
            };
        },
        
        /**
         * 兼容层 - 提供与旧版DataManager兼容的接口
         */
        get legacyInterface() {
            return {
                getMessages: () => this.getMessages().data,
                saveMessage: (message) => {
                    const result = this.addMessage(message);
                    return result.success ? Promise.resolve(result.data) : Promise.reject(new Error(result.error));
                },
                generateId: () => _private.generateUniqueId(),
                getCurrentTime: () => _private.getCurrentTime(),
                clearMessages: () => this.clearMessages().success,
                refreshFromStorage: () => {
                    _private._loadFromStorage();
                    return true;
                }
            };
        }
    };
})();

// 自动初始化
if (typeof window !== 'undefined') {
    // 初始化模块
    RobustMessageManager.init();
    
    // 暴露到全局
    window.RobustMessageManager = RobustMessageManager;
    
    // 如果没有DataManager，提供兼容层
    if (!window.DataManager) {
        window.DataManager = RobustMessageManager.legacyInterface;
    }
}
