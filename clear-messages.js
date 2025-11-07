// 增强版留言数据彻底清除脚本
function clearAllMessageData() {
    if (typeof localStorage !== 'undefined') {
        console.log('=== 开始清除所有留言数据 ===');
        
        // 清除所有可能的留言数据键
        const possibleKeys = [
            'robustMessages',
            'messages',
            'RobustMessageManager',
            'messageData',
            'studentMessages',
            'messages_backup',
            'messages_transaction',
            '__prevent_default_messages'
        ];
        
        let clearedCount = 0;
        possibleKeys.forEach(key => {
            if (localStorage.getItem(key)) {
                console.log(`清除键: ${key}`);
                localStorage.removeItem(key);
                clearedCount++;
            }
        });
        
        // 清除特定ID的三条问题留言（如果直接存储在某个地方）
        console.log('=== 检查并清除特定ID的问题留言 ===');
        
        // 检查是否有其他可能存储留言的键
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes('message') || key.includes('robust'))) {
                try {
                    const value = localStorage.getItem(key);
                    if (value && (value.includes('土力学实验') || value.includes('土的压缩性') || value.includes('土的物理性质'))) {
                        console.log(`发现并清除包含问题留言的键: ${key}`);
                        localStorage.removeItem(key);
                        clearedCount++;
                    }
                } catch (e) {
                    console.log(`无法检查键 ${key}: ${e.message}`);
                }
            }
        }
        
        // 重置为默认空数组
        localStorage.setItem('messages', JSON.stringify([])); // 主存储键
        localStorage.setItem('robustMessages', JSON.stringify([])); // 备用键
        localStorage.setItem('__prevent_default_messages', 'true'); // 防止默认留言
        
        console.log(`=== 清除完成，共清除 ${clearedCount} 个数据键 ===`);
        console.log('=== 已设置标记防止默认留言重新生成 ===');
        
        return true;
    } else {
        console.log('浏览器不支持localStorage');
        return false;
    }
}

// 如果直接运行脚本
if (typeof window !== 'undefined') {
    clearAllMessageData();
    alert('留言数据已彻底清除，系统将防止默认留言重新生成。请刷新页面查看。');
}

// 导出函数供其他文件使用
if (typeof module !== 'undefined') {
    module.exports = { clearAllMessageData };
}
