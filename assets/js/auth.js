/**
 * 学生身份验证模块
 * 集成DataManager模块，用于学生身份验证
 */
const StudentAuth = {
    /**
     * 验证学生身份
     * @param {string} name 学生姓名
     * @param {string} studentId 学号
     * @returns {Promise<Object>} 验证结果
     */
    async validateStudent(name, studentId) {
        try {
            // 检查是否已加载DataManager模块
            if (typeof DataManager !== 'undefined') {
                // 使用DataManager进行学生验证
                return await DataManager.validateStudent(name, studentId);
            } else {
                // 备用验证逻辑
                return await this.validateStudentFallback(name, studentId);
            }
        } catch (error) {
            console.error('验证学生信息失败:', error);
            return { valid: false, student: null };
        }
    },
    
    /**
     * 备用学生验证逻辑
     * @param {string} name 学生姓名
     * @param {string} studentId 学号
     * @returns {Promise<Object>} 验证结果
     */
    async validateStudentFallback(name, studentId) {
        try {
            const response = await fetch('../data/students.json');
            const students = await response.json();
            
            const student = students.find(student => 
                student.name === name && student.id === studentId
            );
            
            return {
                valid: !!student,
                student: student || null
            };
        } catch (error) {
            console.error('备用验证失败:', error);
            return { valid: false, student: null };
        }
    },
    
    /**
     * 生成唯一ID
     * @returns {string} 唯一ID字符串
     */
    generateId() {
        if (typeof DataManager !== 'undefined' && DataManager.generateId) {
            return DataManager.generateId();
        }
        return 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    },
    
    /**
     * 获取当前时间
     * @returns {string} 格式化的时间字符串
     */
    getCurrentTime() {
        if (typeof DataManager !== 'undefined' && DataManager.getCurrentTime) {
            return DataManager.getCurrentTime();
        }
        
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
    module.exports = StudentAuth;
}