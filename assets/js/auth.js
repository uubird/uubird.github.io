/**
 * 身份验证模块 - 增强版
 * 提供健壮可靠的学生身份验证和管理员身份验证功能，支持缓存、超时保护和多环境适配
 */
const StudentAuth = {
    // 配置项
    _config: {
        timeout: 5000, // 5秒超时
        cacheDuration: 5 * 60 * 1000, // 5分钟缓存
        adminPassword: '7758521' // 管理员密码
    },
    
    // 缓存相关
    _cachedStudents: null,
    _cacheTimestamp: 0,
    
    // 自动检测当前路径并设置正确的文件路径 - 增强版
    getFilePaths() {
        try {
            // 获取当前URL的路径部分
            const currentPath = window.location.pathname;
            console.log('[StudentAuth] 当前路径:', currentPath);
            
            // 更全面的路径检测
            const pathSegments = currentPath.split(/[/\\]/).filter(Boolean);
            const depth = pathSegments.length;
            
            // 管理员路径检测
            const isAdminPath = currentPath.includes('/admin/') || currentPath.includes('\\admin\\') || 
                              currentPath.includes('admin/') || pathSegments.includes('admin');
            
            // 常见页面检测
            const isRootPage = ['feedback.html', 'test-auth.html', 'comprehensive-test.html', 
                               'simple-test.html', 'test-messages.html'].some(page => 
                               currentPath.endsWith(page));
            
            let basePath = '';
            
            if (isAdminPath || depth > 2) {
                // 计算相对路径层级
                const relativeDepth = isAdminPath ? 1 : depth - 1;
                basePath = Array(relativeDepth).fill('../').join('');
                console.log('[StudentAuth] 使用相对路径:', basePath);
            } else {
                console.log('[StudentAuth] 使用根路径');
                basePath = '';
            }
            
            const paths = {
                STUDENTS_FILE: basePath + 'assets/data/students.json',
                MESSAGES_FILE: basePath + 'assets/data/messages.json'
            };
            
            console.log('[StudentAuth] 计算的文件路径:', paths);
            return paths;
        } catch (error) {
            console.error('[StudentAuth] 获取文件路径出错:', error);
            // 返回默认路径作为后备
            return {
                STUDENTS_FILE: 'assets/data/students.json',
                MESSAGES_FILE: 'assets/data/messages.json'
            };
        }
    },
    
    // 动态获取学生文件路径
    get STUDENTS_FILE() {
        return this.getFilePaths().STUDENTS_FILE;
    },
    
    // 获取消息文件路径
    get MESSAGES_FILE() {
        return this.getFilePaths().MESSAGES_FILE;
    },
    // 带超时的fetch函数
    _fetchWithTimeout(url, options = {}) {
        return new Promise((resolve, reject) => {
            const controller = new AbortController();
            const { signal } = controller;
            
            const timeoutId = setTimeout(() => {
                controller.abort();
                reject(new Error('请求超时'));
            }, this._config.timeout);
            
            fetch(url, { ...options, signal })
                .then(response => {
                    clearTimeout(timeoutId);
                    resolve(response);
                })
                .catch(error => {
                    clearTimeout(timeoutId);
                    reject(error);
                });
        });
    },
    
    // 清除缓存
    clearCache() {
        this._cachedStudents = null;
        this._cacheTimestamp = 0;
        console.log('[StudentAuth] 缓存已清除');
    },
    
    // 检查缓存是否有效
    _isCacheValid() {
        const now = Date.now();
        return this._cachedStudents && 
               Array.isArray(this._cachedStudents) && 
               (now - this._cacheTimestamp) < this._config.cacheDuration;
    },
    
    /**
     * 验证学生身份 - 增强版
     * @param {string} name 学生姓名
     * @param {string} studentId 学号
     * @returns {Promise<Object>} 验证结果
     */
    async validateStudent(name, studentId) {
        // 清理输入字符串
        const cleanName = name ? name.trim() : '';
        const cleanStudentId = studentId ? studentId.trim() : '';
        console.log('[StudentAuth] 开始验证:', {cleanName, cleanStudentId});
        
        // 基本验证
        if (!cleanName || !cleanStudentId) {
            console.error('[StudentAuth] 姓名或学号不能为空');
            return { 
                valid: false, 
                student: null, 
                error: '姓名和学号不能为空',
                source: 'input_validation'
            };
        }
        
        try {
            // 检查缓存是否有效
            if (this._isCacheValid()) {
                console.log('[StudentAuth] 使用缓存的学生数据');
                const matchedStudent = this._cachedStudents.find(s => 
                    s.name === cleanName && s.studentId === cleanStudentId
                );
                
                return {
                    valid: !!matchedStudent,
                    student: matchedStudent || null,
                    source: 'cache',
                    error: matchedStudent ? null : '缓存中未找到匹配的学生'
                };
            }
            
            // 动态获取学生数据文件路径并请求数据，带超时保护
            const response = await this._fetchWithTimeout(this.STUDENTS_FILE);
            console.log('[StudentAuth] 文件请求状态:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP错误: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('[StudentAuth] 成功解析JSON数据');
            
            // 验证数据结构
            if (!data || typeof data !== 'object') {
                throw new Error('学生数据格式错误: 不是有效的对象');
            }
            
            // 支持直接的学生数组或嵌套的students属性
            const students = Array.isArray(data.students) ? data.students : 
                            Array.isArray(data) ? data : [];
            
            // 更新缓存
            this._cachedStudents = students;
            this._cacheTimestamp = Date.now();
            
            console.log('[StudentAuth] 学生数据数组长度:', students.length);
            
            // 查找匹配的学生
            const matchedStudent = students.find(s => 
                s.name === cleanName && s.studentId === cleanStudentId
            );
            
            if (matchedStudent) {
                console.log('[StudentAuth] 验证成功:', matchedStudent);
                return { 
                    valid: true, 
                    student: matchedStudent,
                    source: 'server'
                };
            } else {
                console.log('[StudentAuth] 未找到匹配的学生');
                // 未找到时也尝试硬编码验证
                return this.validateWithHardcodedData(cleanName, cleanStudentId);
            }
            
        } catch (error) {
            console.error('[StudentAuth] 验证过程出错:', error);
            
            // 即使出错，也尝试使用缓存（如果有）
            if (this._cachedStudents && Array.isArray(this._cachedStudents)) {
                console.log('[StudentAuth] 使用过期缓存尝试验证');
                const matchedStudent = this._cachedStudents.find(s => 
                    s.name === cleanName && s.studentId === cleanStudentId
                );
                
                if (matchedStudent) {
                    return {
                        valid: true,
                        student: matchedStudent,
                        source: 'expired_cache',
                        warning: '使用了过期的缓存数据'
                    };
                }
            }
            
            // 作为最后的备用方案，使用硬编码的几个学生进行验证
            return this.validateWithHardcodedData(cleanName, cleanStudentId);
        }
    },
    
    /**
     * 使用硬编码数据进行备用验证
     * @param {string} name 学生姓名
     * @param {string} studentId 学号
     * @returns {Object} 验证结果
     */
    validateWithHardcodedData(name, studentId) {
        console.log('[StudentAuth] 使用硬编码数据进行备用验证');
        
        // 硬编码测试学生数据 - 扩展版
        const hardcodedStudents = [
            { name: '杜沛霖', studentId: '202359501317', class: '土231-3' },
            { name: '董超凡', studentId: '202259501142', class: '土221-1' },
            { name: '杨朝淳', studentId: '202259501305', class: '土221-3' },
            { name: '测试学生', studentId: '202359501317', class: '2023级土木1班' },
            { name: '张三', studentId: '202300000001', class: '测试班级' },
            { name: '李四', studentId: '202300000002', class: '测试班级' }
        ];
        
        const student = hardcodedStudents.find(s => 
            s.name === name && s.studentId === studentId
        );
        
        if (student) {
            console.log('[StudentAuth] 硬编码验证成功:', student);
            return { 
                valid: true, 
                student,
                source: 'hardcoded'
            };
        }
        
        // 开发环境额外的宽松验证
        const isDevEnvironment = window.location.hostname === 'localhost' || 
                                window.location.hostname === '127.0.0.1' ||
                                window.location.hostname.includes('local');
        
        if (isDevEnvironment && name && studentId && name.length >= 2 && studentId.length >= 8) {
            console.log('[StudentAuth] 开发环境宽松验证成功');
            return {
                valid: true,
                student: {
                    name: name,
                    studentId: studentId,
                    class: '开发测试班级'
                },
                source: 'dev_mode',
                warning: '开发环境宽松验证已启用'
            };
        }
        
        console.log('[StudentAuth] 所有验证方法均失败');
        return { 
            valid: false, 
            student: null, 
            error: '所有验证方法均失败',
            source: 'all_failed'
        };
    },
    
    /**
     * 生成唯一ID - 增强版
     * @returns {string} 唯一ID字符串
     */
    generateId() {
        try {
            // 优先使用增强版数据管理模块
            if (typeof EnhancedDataManager !== 'undefined' && EnhancedDataManager.generateUniqueId) {
                console.log('[StudentAuth] 使用EnhancedDataManager生成ID');
                return EnhancedDataManager.generateUniqueId();
            }
            // 其次尝试原始DataManager
            else if (typeof DataManager !== 'undefined' && DataManager.generateId) {
                console.log('[StudentAuth] 使用DataManager生成ID');
                return DataManager.generateId();
            }
            // 最后使用内置方法
            console.log('[StudentAuth] 使用内置方法生成ID');
            const timestamp = Date.now();
            const randomPart = Math.random().toString(36).substring(2, 11);
            const uniqueId = `msg-${timestamp}-${randomPart}`;
            return uniqueId;
        } catch (error) {
            console.error('[StudentAuth] 生成ID时出错:', error);
            // 最安全的备用方案
            return 'msg-' + Date.now();
        }
    },
    
    /**
     * 获取当前时间 - 增强版
     * @param {boolean} useISO 是否使用ISO格式
     * @returns {string} 格式化的时间字符串
     */
    getCurrentTime(useISO = false) {
        try {
            // 优先使用增强版数据管理模块
            if (typeof EnhancedDataManager !== 'undefined' && EnhancedDataManager.getCurrentTime) {
                console.log('[StudentAuth] 使用EnhancedDataManager获取时间');
                return EnhancedDataManager.getCurrentTime();
            }
            // 其次尝试原始DataManager
            else if (typeof DataManager !== 'undefined' && DataManager.getCurrentTime) {
                console.log('[StudentAuth] 使用DataManager获取时间');
                return DataManager.getCurrentTime();
            }
            
            // 内置方法
            console.log('[StudentAuth] 使用内置方法获取时间');
            const now = new Date();
            
            if (useISO) {
                return now.toISOString();
            }
            
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        } catch (error) {
            console.error('[StudentAuth] 获取时间时出错:', error);
            return new Date().toLocaleString();
        }
    },
    
    /**
     * 获取模块状态信息
     * @returns {Object} 状态信息
     */
    getStatus() {
        const now = Date.now();
        const cacheAge = this._cacheTimestamp ? now - this._cacheTimestamp : 0;
        
        return {
            cacheEnabled: this._config.cacheDuration > 0,
            cacheValid: this._isCacheValid(),
            cacheSize: this._cachedStudents ? this._cachedStudents.length : 0,
            cacheAge: cacheAge,
            paths: this.getFilePaths(),
            enhancedDataManagerAvailable: typeof EnhancedDataManager !== 'undefined',
            dataManagerAvailable: typeof DataManager !== 'undefined',
            features: ['timeout_protection', 'cache_management', 'path_detection', 'admin_auth'],
            isInitialized: true,
            version: '2.0.1'
        };
    },
    
    // 管理员密码验证
    validateAdmin(password) {
        console.log('[StudentAuth] 验证管理员密码');
        try {
            const isAuthenticated = password === this._config.adminPassword;
            console.log('[StudentAuth] 管理员验证结果:', isAuthenticated);
            
            if (isAuthenticated) {
                // 存储登录状态到sessionStorage
                sessionStorage.setItem('adminAuthenticated', 'true');
                sessionStorage.setItem('adminLoginTime', Date.now().toString());
            }
            
            return isAuthenticated;
        } catch (error) {
            console.error('[StudentAuth] 管理员验证出错:', error);
            return false;
        }
    },
    
    // 检查管理员是否已登录
    isAdminAuthenticated() {
        try {
            const isAuthenticated = sessionStorage.getItem('adminAuthenticated') === 'true';
            console.log('[StudentAuth] 检查管理员登录状态:', isAuthenticated);
            return isAuthenticated;
        } catch (error) {
            console.error('[StudentAuth] 检查管理员登录状态出错:', error);
            return false;
        }
    },
    
    // 管理员登出
    logoutAdmin() {
        try {
            sessionStorage.removeItem('adminAuthenticated');
            sessionStorage.removeItem('adminLoginTime');
            console.log('[StudentAuth] 管理员已登出');
        } catch (error) {
            console.error('[StudentAuth] 管理员登出出错:', error);
        }
    }
};

// 导出模块
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = StudentAuth;
}