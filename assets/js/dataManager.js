/**
 * 数据管理模块 - 用于处理留言数据的CRUD操作
 * 注意：此模块仅用于前端演示，实际应用需替换为后端API调用
 */
const DataManager = {
    // 自动检测当前路径并设置正确的文件路径
    getFilePaths() {
        // 获取当前URL的路径部分
        const currentPath = window.location.pathname;
        // 如果在admin目录下，需要不同的路径
        const isAdminPath = currentPath.includes('/admin/') || currentPath.includes('\\admin\\') || currentPath.includes('admin/');
        
        return {
            MESSAGES_FILE: isAdminPath ? '../assets/data/messages.json' : 'assets/data/messages.json',
            STUDENTS_FILE: isAdminPath ? '../assets/data/students.json' : 'assets/data/students.json'
        };
    },
    
    // 动态获取消息文件路径
    get MESSAGES_FILE() {
        return this.getFilePaths().MESSAGES_FILE;
    },
    
    // 动态获取学生文件路径
    get STUDENTS_FILE() {
        return this.getFilePaths().STUDENTS_FILE;
    },
    
    /**
     * 读取所有留言
     * @returns {Promise<Array>} 留言列表
     */
    async getMessages() {
        try {
            const response = await fetch(this.MESSAGES_FILE);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data.messages || [];
        } catch (error) {
            console.error('获取留言列表失败:', error);
            // 返回模拟数据作为备用
            return this.getMockMessages();
        }
    },
    
    /**
     * 获取单条留言
     * @param {string} messageId 留言ID
     * @returns {Promise<Object|null>} 留言对象或null
     */
    async getMessageById(messageId) {
        try {
            const messages = await this.getMessages();
            return messages.find(msg => msg.id === messageId) || null;
        } catch (error) {
            console.error(`获取留言[${messageId}]失败:`, error);
            return null;
        }
    },
    
    /**
     * 保存新留言
     * @param {Object} message 留言对象
     * @returns {Promise<boolean>} 是否保存成功
     */
    async saveMessage(message) {
        try {
            // 在实际应用中，这里应该发送POST请求到后端API
            console.log('保存新留言:', message);
            
            // 由于是前端演示，这里模拟成功
            return true;
        } catch (error) {
            console.error('保存留言失败:', error);
            return false;
        }
    },
    
    /**
     * 更新留言（添加回复）
     * @param {string} messageId 留言ID
     * @param {Object} replyData 回复数据
     * @returns {Promise<boolean>} 是否更新成功
     */
    async updateMessage(messageId, replyData) {
        try {
            // 在实际应用中，这里应该发送PUT请求到后端API
            console.log(`更新留言[${messageId}]，添加回复:`, replyData);
            
            // 模拟成功
            return true;
        } catch (error) {
            console.error(`更新留言[${messageId}]失败:`, error);
            return false;
        }
    },
    
    /**
     * 删除留言
     * @param {string} messageId 留言ID
     * @returns {Promise<boolean>} 是否删除成功
     */
    async deleteMessage(messageId) {
        try {
            // 在实际应用中，这里应该发送DELETE请求到后端API
            console.log(`删除留言[${messageId}]`);
            
            // 模拟成功
            return true;
        } catch (error) {
            console.error(`删除留言[${messageId}]失败:`, error);
            return false;
        }
    },
    
    /**
     * 验证学生信息
     * @param {string} name 学生姓名
     * @param {string} studentId 学号
     * @returns {Promise<Object>} 验证结果
     */
    async validateStudent(name, studentId) {
        try {
            const response = await fetch(this.STUDENTS_FILE);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const students = await response.json();
            
            const student = students.find(s => s.name === name && s.studentId === studentId);
            return {
                valid: !!student,
                student: student || null
            };
        } catch (error) {
            console.error('验证学生信息失败:', error);
            // 使用模拟数据进行验证
            return this.validateStudentWithMock(name, studentId);
        }
    },
    
    /**
     * 获取模拟留言数据（备用）
     * @returns {Array} 模拟留言列表
     */
    getMockMessages() {
        return [
            {
                id: '1',
                studentName: '张明',
                studentId: '20190101',
                className: '土木工程专业1901班',
                title: '关于土的物理性质指标计算的疑问',
                content: '老师您好，在学习第1章土的物理性质指标计算时，我对相对密度Dr的物理意义理解还不够深刻。请问Dr值越大，是否表示土越密实？另外，在工程应用中，如何合理地确定土的压实标准？',
                timestamp: '2023-10-15 14:30',
                status: '已回复',
                reply: {
                    teacher: '李教授',
                    content: '张明同学你好，你的问题非常好。相对密度Dr确实是衡量无黏性土密实程度的重要指标，Dr值越大，表示土越密实。在工程应用中，土的压实标准通常根据工程性质和使用要求来确定，一般采用压实系数（压实度）作为控制指标，对于不同的工程类型有不同的要求。例如，道路工程中，路基的压实系数通常要求达到93%-98%。关于这部分内容，我们在后续课程中还会详细讲解，你也可以参考教材第38页的相关内容。',
                    timestamp: '2023-10-15 16:45'
                }
            },
            {
                id: '2',
                studentName: '王小红',
                studentId: '20190102',
                className: '土木工程专业1902班',
                title: '土力学实验的预习问题',
                content: '老师，下周我们要做土的渗透试验，请问在实验前我们需要做哪些准备工作？另外，实验中需要特别注意哪些事项？',
                timestamp: '2023-10-14 10:15',
                status: '待回复'
            },
            {
                id: '3',
                studentName: '李强',
                studentId: '20190103',
                className: '土木工程专业1901班',
                title: '土的压缩性计算例题疑问',
                content: '老师，我在做第4章习题4-2时，对分层总和法计算地基沉降量的步骤有些疑问。请问在确定地基压缩层深度时，为什么要取附加应力与自重应力的比值小于0.2的位置？这个数值是如何确定的？',
                timestamp: '2023-10-12 19:20',
                status: '已回复',
                reply: {
                    teacher: '李教授',
                    content: '李强同学你好，关于压缩层深度的确定，这是工程上的经验值。当附加应力与自重应力的比值小于0.2时，这部分土层的压缩量对总沉降的贡献已经很小，可以忽略不计。这个0.2的界限值是根据大量工程实践总结出来的，在《建筑地基基础设计规范》中有明确规定。对于重要建筑物或软弱地基，有时会采用更严格的0.1作为界限值。建议你参考规范相关内容，加深理解。',
                    timestamp: '2023-10-13 09:30'
                }
            }
        ];
    },
    
    /**
     * 使用模拟数据验证学生信息（备用）
     * @param {string} name 学生姓名
     * @param {string} studentId 学号
     * @returns {Object} 验证结果
     */
    validateStudentWithMock(name, studentId) {
        const mockStudents = [
            { studentId: '20190101', name: '张明', class: '土木工程专业1901班' },
            { studentId: '20190102', name: '王小红', class: '土木工程专业1902班' },
            { studentId: '20190103', name: '李强', class: '土木工程专业1901班' },
            { studentId: '20190104', name: '赵娜', class: '土木工程专业1902班' },
            { studentId: '20190105', name: '陈飞', class: '土木工程专业1901班' }
        ];
        
        const student = mockStudents.find(s => s.name === name && s.studentId === studentId);
        return {
            valid: !!student,
            student: student || null
        };
    },
    
    /**
     * 生成唯一ID
     * @returns {string} 唯一ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    },
    
    /**
     * 获取当前时间
     * @returns {string} 格式化的时间字符串
     */
    getCurrentTime() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day} ${hours}:${minutes}`;
    }
};

// 导出模块
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = DataManager;
}
