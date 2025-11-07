/**
 * 增强版数据管理模块 - 提供健壮的留言数据处理功能
 * 包含完善的错误处理、数据验证、多层存储和多环境适配
 */
const EnhancedDataManager = {
    // 配置和常量定义
    STORAGE_KEY: 'enhanced_messages',
    BACKUP_STORAGE_KEY: 'enhanced_messages_backup',
    
    // 默认留言数据
    DEFAULT_MESSAGES: [
        {
            id: 'msg-1701234567890-abc123',
            name: '示例学生',
            studentId: '202359501317',
            className: '测试班级',
            message: '欢迎使用学生留言系统！',
            timestamp: '2023-12-01 10:00:00',
            replies: []
        },
        {
            id: 'msg-1701234567891-def456',
            name: '测试用户',
            studentId: '202300000001',
            className: '测试班级',
            message: '这个留言系统真好用！',
            timestamp: '2023-12-02 15:30:00',
            replies: []
        }
    ],
    
    /**
     * 初始化模块，检查浏览器兼容性
     */
    init() {
        try {
            console.log('[EnhancedDataManager] 开始初始化...');
            
            // 初始化属性
            this.memoryStorage = [];
            this.lastSyncTime = 0;
            this.autoBackupTimer = null;
            
            // 检查localStorage支持（使用更健壮的检测方法）
            this.isLocalStorageSupported = this._checkLocalStorageSupport();
            
            // 尝试从存储加载数据，如果失败则使用默认数据
            this._loadFromStorage();
            
            // 启动自动备份
            this._startAutoBackup();
            
            // 页面卸载时保存数据
            if (typeof window !== 'undefined') {
                window.addEventListener('beforeunload', () => {
                    this.backupData();
                });
                
                // 窗口聚焦时同步数据
                window.addEventListener('focus', () => {
                    this._loadFromStorage();
                });
            }
            
            console.log('[EnhancedDataManager] 初始化完成，localStorage支持:', this.isLocalStorageSupported);
        } catch (error) {
            console.error('[EnhancedDataManager] 初始化失败:', error);
            this.isLocalStorageSupported = false;
            this.memoryStorage = this.DEFAULT_MESSAGES;
        }
    },
    
    /**
     * 检查localStorage是否真正可用
     */
    _checkLocalStorageSupport() {
        try {
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, testKey);
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            console.warn('[EnhancedDataManager] localStorage不可用，可能是隐私模式或配额限制');
            return false;
        }
    },
    
    /**
     * 从存储加载数据，支持多级回退
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
                            console.error('[EnhancedDataManager] 主存储数据格式错误');
                            messages = [];
                        } else {
                            console.log('[EnhancedDataManager] 从主存储加载了', messages.length, '条消息');
                        }
                    } catch (parseError) {
                        console.error('[EnhancedDataManager] 解析主存储数据失败:', parseError);
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
                            console.error('[EnhancedDataManager] 备份存储数据格式错误');
                            messages = [];
                        } else {
                            console.log('[EnhancedDataManager] 从备份存储加载了', messages.length, '条消息');
                        }
                    } catch (parseError) {
                        console.error('[EnhancedDataManager] 解析备份存储数据失败:', parseError);
                        messages = [];
                    }
                }
            }
            
            // 如果所有存储都失败，使用默认数据
            if (messages.length === 0) {
                console.log('[EnhancedDataManager] 使用默认示例数据');
                messages = this.DEFAULT_MESSAGES;
                // 如果可以，保存默认数据到存储
                if (this.isLocalStorageSupported) {
                    this.saveMessagesToStorage(messages);
                }
            }
            
            // 验证和清理数据
            this.memoryStorage = this._validateMessages(messages);
            this.lastSyncTime = Date.now();
            
            return true;
        } catch (error) {
            console.error('[EnhancedDataManager] 加载存储失败:', error);
            this.memoryStorage = this.DEFAULT_MESSAGES;
            return false;
        }
    },
    
    /**
     * 验证消息数组数据结构
     */
    _validateMessages(messages) {
        if (!Array.isArray(messages)) {
            return [];
        }
        
        const validMessages = [];
        
        for (let msg of messages) {
            try {
                if (!msg || typeof msg !== 'object') continue;
                
                // 支持新旧格式的消息对象
                const cleanedMsg = {
                    id: msg.id || this.generateUniqueId(),
                    // 同时支持name和studentName
                    name: (msg.name || msg.studentName || '未知用户').trim(),
                    studentId: (msg.studentId || '未知学号').trim(),
                    // 同时支持className和class
                    className: (msg.className || msg.class || '未设置班级').trim(),
                    // 同时支持message和content
                    message: (msg.message || msg.content || '').trim(),
                    timestamp: msg.timestamp || this.getCurrentTime(),
                    replies: Array.isArray(msg.replies) ? msg.replies : []
                };
                
                // 只保留有效的消息
                if (cleanedMsg.message) {
                    validMessages.push(cleanedMsg);
                }
            } catch (e) {
                console.warn('[EnhancedDataManager] 跳过无效消息:', e);
            }
        }
        
        return validMessages;
    },
    
    /**
     * 启动自动备份
     */
    _startAutoBackup() {
        try {
            // 每5分钟自动备份一次
            const backupInterval = 5 * 60 * 1000;
            
            if (this.autoBackupTimer) {
                clearInterval(this.autoBackupTimer);
            }
            
            this.autoBackupTimer = setInterval(() => {
                this.backupData();
            }, backupInterval);
            
            console.log('[EnhancedDataManager] 自动备份已启动，间隔:', backupInterval / 1000, '秒');
        } catch (error) {
            console.error('[EnhancedDataManager] 启动自动备份失败:', error);
        }
    },
    
    /**
     * 从存储中获取所有留言 - 增强版
     * @param {boolean} sortByTime 是否按时间排序（默认true）
     * @returns {Object} 包含消息数组和状态信息的对象
     */
    getAllMessages(sortByTime = true) {
        try {
            // 确保内存中有数据
            if (!this.memoryStorage || this.memoryStorage.length === 0) {
                this._loadFromStorage();
            }
            
            // 创建副本以避免直接修改
            let messages = [...this.memoryStorage];
            
            // 按时间排序（最新的在前）
            if (sortByTime) {
                messages.sort((a, b) => {
                    try {
                        const dateA = new Date(a.timestamp);
                        const dateB = new Date(b.timestamp);
                        // 处理无效日期
                        if (isNaN(dateA.getTime())) return 1;
                        if (isNaN(dateB.getTime())) return -1;
                        return dateB - dateA;
                    } catch (e) {
                        return 0;
                    }
                });
            }
            
            console.log('[EnhancedDataManager] 获取留言成功，共', messages.length, '条');
            
            // 返回更丰富的信息
            return {
                success: true,
                messages: messages,
                count: messages.length,
                source: this.isLocalStorageSupported ? 'persistent' : 'memory',
                lastSync: this.lastSyncTime
            };
        } catch (error) {
            console.error('[EnhancedDataManager] 获取留言失败:', error);
            
            // 出错时返回默认数据而不是空数组
            return {
                success: false,
                messages: this.DEFAULT_MESSAGES,
                count: this.DEFAULT_MESSAGES.length,
                source: 'default',
                error: error.message,
                lastSync: this.lastSyncTime
            };
        }
    },
    
    /**
     * 保存留言到存储 - 增强版
     * @param {Array} messages 留言数组
     * @returns {Object} 包含结果和详细信息的对象
     */
    saveMessagesToStorage(messages) {
        try {
            // 验证输入
            if (!Array.isArray(messages)) {
                console.error('[EnhancedDataManager] 保存数据类型错误，必须是数组');
                return {
                    success: false,
                    error: '数据必须是数组',
                    code: 'INVALID_DATA_TYPE'
                };
            }
            
            // 验证并清理消息数据
            const validatedMessages = this._validateMessages(messages);
            
            try {
                const dataToStore = JSON.stringify(validatedMessages);
                
                if (this.isLocalStorageSupported) {
                    // 尝试保存，如果失败则尝试清理一些空间
                    try {
                        localStorage.setItem(this.STORAGE_KEY, dataToStore);
                    } catch (storageError) {
                        console.warn('[EnhancedDataManager] 主存储失败，尝试清理空间:', storageError);
                        // 尝试删除备份数据以释放空间
                        try {
                            localStorage.removeItem(this.BACKUP_STORAGE_KEY);
                            // 再次尝试保存
                            localStorage.setItem(this.STORAGE_KEY, dataToStore);
                        } catch (retryError) {
                            console.error('[EnhancedDataManager] 清理空间后仍然保存失败:', retryError);
                            // 回退到内存存储
                            this.memoryStorage = validatedMessages;
                            return {
                                success: true,
                                storedInMemory: true,
                                storedInStorage: false,
                                warning: '无法保存到localStorage，已保存到内存',
                                count: validatedMessages.length
                            };
                        }
                    }
                } else {
                    // 保存到内存
                    this.memoryStorage = validatedMessages;
                }
                
                // 更新内存存储和同步时间
                this.memoryStorage = validatedMessages;
                this.lastSyncTime = Date.now();
                
                console.log('[EnhancedDataManager] 保存留言成功，共', validatedMessages.length, '条');
                
                return {
                    success: true,
                    storedInStorage: this.isLocalStorageSupported,
                    storedInMemory: true,
                    count: validatedMessages.length
                };
            } catch (jsonError) {
                console.error('[EnhancedDataManager] JSON序列化失败:', jsonError);
                return {
                    success: false,
                    error: '数据序列化失败',
                    code: 'SERIALIZATION_ERROR'
                };
            }
        } catch (error) {
            console.error('[EnhancedDataManager] 保存留言失败:', error);
            return {
                success: false,
                error: error.message,
                code: 'SAVE_FAILED'
            };
        }
    },
    
    /**
     * 添加单条留言 - 增强版
     * @param {Object} messageData 留言对象数据
     * @returns {Object} 包含结果和详细信息的对象
     */
    addMessage(messageData) {
        try {
            // 验证留言对象
            if (!messageData || typeof messageData !== 'object') {
                console.error('[EnhancedDataManager] 留言对象无效');
                return {
                    success: false,
                    error: '留言对象必须是有效的JavaScript对象',
                    code: 'INVALID_MESSAGE_OBJECT'
                };
            }
            
            // 确保有内存存储
            if (!this.memoryStorage) {
                this.memoryStorage = [];
            }
            
            // 定义必要字段（支持新旧格式）
            const nameField = messageData.name || messageData.studentName;
            const contentField = messageData.message || messageData.content;
            
            // 检查必要字段
            if (!nameField || !messageData.studentId || !contentField) {
                const missingFields = [];
                if (!nameField) missingFields.push('姓名(name或studentName)');
                if (!messageData.studentId) missingFields.push('学号(studentId)');
                if (!contentField) missingFields.push('内容(message或content)');
                
                console.error(`[EnhancedDataManager] 留言缺少必要字段: ${missingFields.join(', ')}`);
                return {
                    success: false,
                    error: `缺少必要字段: ${missingFields.join(', ')}`,
                    code: 'MISSING_REQUIRED_FIELDS',
                    missingFields: missingFields
                };
            }
            
            // 创建标准化的留言对象
            const newMessage = {
                id: messageData.id || this.generateUniqueId(),
                name: String(nameField).trim(),
                studentId: String(messageData.studentId).trim(),
                className: messageData.className ? String(messageData.className).trim() : 
                          (messageData.class ? String(messageData.class).trim() : '未设置班级'),
                message: String(contentField).trim(),
                timestamp: messageData.timestamp || this.getCurrentTime(),
                replies: Array.isArray(messageData.replies) ? messageData.replies : []
            };
            
            // 添加到内存存储的开头（最新的在前）
            this.memoryStorage.unshift(newMessage);
            
            // 保存到持久存储
            const saveResult = this.saveMessagesToStorage(this.memoryStorage);
            
            if (saveResult.success) {
                console.log('[EnhancedDataManager] 新增留言成功:', newMessage.id);
                
                // 触发数据更新事件
                this._triggerDataUpdate();
                
                return {
                    success: true,
                    message: newMessage,
                    messageId: newMessage.id,
                    totalMessages: this.memoryStorage.length,
                    storedPersistently: saveResult.storedInStorage
                };
            } else {
                console.error('[EnhancedDataManager] 新增留言失败，保存存储时出错');
                // 从内存中移除刚添加的消息
                this.memoryStorage.shift();
                
                return {
                    success: false,
                    error: saveResult.error || '保存失败',
                    code: saveResult.code || 'SAVE_FAILED',
                    attemptedMessage: newMessage
                };
            }
        } catch (error) {
            console.error('[EnhancedDataManager] 添加留言异常:', error);
            return {
                success: false,
                error: error.message,
                code: 'ADD_MESSAGE_EXCEPTION'
            };
        }
    },
    
    /**
     * 清空所有留言 - 增强版
     * @param {boolean} keepDefault 是否保留默认消息（默认true）
     * @returns {Object} 包含结果和详细信息的对象
     */
    clearAllMessages(keepDefault = true) {
        try {
            // 确定要保留的数据
            const messagesToKeep = keepDefault ? this.DEFAULT_MESSAGES : [];
            
            // 清空内存存储
            this.memoryStorage = [...messagesToKeep];
            
            // 清空localStorage
            if (this.isLocalStorageSupported) {
                try {
                    localStorage.removeItem(this.STORAGE_KEY);
                    localStorage.removeItem(this.BACKUP_STORAGE_KEY);
                    
                    // 如果需要保留默认消息，重新保存
                    if (keepDefault) {
                        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(messagesToKeep));
                    }
                } catch (storageError) {
                    console.warn('[EnhancedDataManager] 清空存储失败，但内存已清空:', storageError);
                }
            }
            
            console.log('[EnhancedDataManager] 清空所有留言成功', keepDefault ? '(保留默认消息)' : '');
            
            // 触发数据更新事件
            this._triggerDataUpdate();
            
            return {
                success: true,
                keepDefault: keepDefault,
                remainingMessages: this.memoryStorage.length,
                storedPersistently: this.isLocalStorageSupported
            };
        } catch (error) {
            console.error('[EnhancedDataManager] 清空留言失败:', error);
            return {
                success: false,
                error: error.message,
                code: 'CLEAR_FAILED'
            };
        }
    },
    
    /**
     * 备份数据到备用存储
     */
    backupData() {
        try {
            if (!this.isLocalStorageSupported || !this.memoryStorage) {
                return { success: false, reason: '存储不可用或无数据' };
            }
            
            const backupData = JSON.stringify(this.memoryStorage);
            localStorage.setItem(this.BACKUP_STORAGE_KEY, backupData);
            
            console.log('[EnhancedDataManager] 数据备份成功，共', this.memoryStorage.length, '条消息');
            return { success: true, messageCount: this.memoryStorage.length };
        } catch (error) {
            console.error('[EnhancedDataManager] 备份数据失败:', error);
            return { success: false, error: error.message };
        }
    },
    
    /**
     * 触发数据更新事件
     */
    _triggerDataUpdate() {
        try {
            // 创建自定义事件
            if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') {
                const event = new CustomEvent('enhancedDataManagerUpdated', {
                    detail: {
                        timestamp: Date.now(),
                        messageCount: this.memoryStorage ? this.memoryStorage.length : 0
                    }
                });
                window.dispatchEvent(event);
            }
        } catch (error) {
            // 静默失败，不影响主要功能
        }
    },
    
    /**
     * 获取留言数量
     * @returns {number} 留言数量
     */
    getMessageCount() {
        try {
            return this.memoryStorage ? this.memoryStorage.length : 0;
        } catch (error) {
            console.error('[EnhancedDataManager] 获取留言数量失败:', error);
            return 0;
        }
    },
    
    /**
     * 按ID查找留言
     * @param {string} messageId 留言ID
     * @returns {Object|null} 找到返回留言对象，否则返回null
     */
    findMessageById(messageId) {
        try {
            if (!this.memoryStorage) {
                return null;
            }
            return this.memoryStorage.find(msg => msg.id === messageId) || null;
        } catch (error) {
            console.error('[EnhancedDataManager] 查找留言失败:', error);
            return null;
        }
    },
    
    /**
     * 生成唯一ID - 增强版
     * @returns {string} 唯一ID
     */
    generateUniqueId() {
        try {
            const timestamp = Date.now();
            const randomPart = Math.random().toString(36).substring(2, 11);
            const extraRandom = Math.random().toString(36).substring(2, 6);
            return `msg-${timestamp}-${randomPart}-${extraRandom}`;
        } catch (error) {
            console.error('[EnhancedDataManager] 生成ID失败:', error);
            // 最基本的后备方案
            return 'msg-' + Date.now();
        }
    },
    
    /**
     * 获取当前时间 - 增强版
     * @param {boolean} useISO 是否使用ISO格式（默认false）
     * @returns {string} 格式化的时间字符串
     */
    getCurrentTime(useISO = false) {
        try {
            const now = new Date();
            
            if (useISO) {
                return now.toISOString();
            }
            
            // 使用更友好的时间格式
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        } catch (error) {
            console.error('[EnhancedDataManager] 获取时间失败:', error);
            return new Date().toLocaleString();
        }
    },
    
    /**
     * 获取模块状态信息
     * @returns {Object} 完整的状态信息
     */
    getStatus() {
        try {
            return {
                initialized: !!this.memoryStorage,
                storageAvailable: this.isLocalStorageSupported,
                messageCount: this.getMessageCount(),
                lastSync: this.lastSyncTime,
                autoBackupEnabled: !!this.autoBackupTimer,
                defaultMessagesCount: this.DEFAULT_MESSAGES.length,
                hasDefaultData: this.getMessageCount() > 0,
                storageKeys: {
                    primary: this.STORAGE_KEY,
                    backup: this.BACKUP_STORAGE_KEY
                }
            };
        } catch (error) {
            console.error('[EnhancedDataManager] 获取状态失败:', error);
            return {
                initialized: false,
                storageAvailable: false,
                messageCount: 0,
                error: error.message
            };
        }
    },
    
    /**
     * 销毁模块，清理资源
     */
    destroy() {
        try {
            console.log('[EnhancedDataManager] 销毁模块，清理资源');
            
            // 清理定时器
            if (this.autoBackupTimer) {
                clearInterval(this.autoBackupTimer);
                this.autoBackupTimer = null;
            }
            
            // 保存最终状态
            this.backupData();
        } catch (error) {
            console.error('[EnhancedDataManager] 销毁模块时出错:', error);
        }
    }
};

// 初始化模块
EnhancedDataManager.init();

// 导出模块
try {
    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        module.exports = EnhancedDataManager;
    }
} catch (e) {
    // 忽略导出错误
}

// 创建全局兼容层 - 确保与原始DataManager接口兼容
if (typeof window !== 'undefined') {
    // 确保EnhancedDataManager在全局可用
    window.EnhancedDataManager = EnhancedDataManager;
    
    // 创建或增强DataManager
    if (!window.DataManager) {
        window.DataManager = {
            // 原始方法的兼容实现
            getMessages: function() {
                try {
                    const result = EnhancedDataManager.getAllMessages();
                    return result.messages || [];
                } catch (e) {
                    console.error('[DataManager] 获取消息失败:', e);
                    return [];
                }
            },
            
            saveMessage: function(message) {
                try {
                    const result = EnhancedDataManager.addMessage(message);
                    return result.success;
                } catch (e) {
                    console.error('[DataManager] 保存消息失败:', e);
                    return false;
                }
            },
            
            generateId: function() {
                return EnhancedDataManager.generateUniqueId();
            },
            
            getCurrentTime: function() {
                return EnhancedDataManager.getCurrentTime();
            },
            
            // 额外的辅助方法
            clearMessages: function() {
                try {
                    const result = EnhancedDataManager.clearAllMessages();
                    return result.success;
                } catch (e) {
                    return false;
                }
            },
            
            // 从存储刷新
            refreshFromStorage: function() {
                try {
                    EnhancedDataManager._loadFromStorage();
                    return true;
                } catch (e) {
                    return false;
                }
            }
        };
    }
    
    // 自动初始化 - 确保在DOM加载完成后重新初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                EnhancedDataManager.init();
            }, 0);
        });
    }
};

// 初始化模块
EnhancedDataManager.init();

// 导出模块
try {
    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        module.exports = EnhancedDataManager;
    }
} catch (e) {
    // 忽略导出错误
}