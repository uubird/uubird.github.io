// 最简单直接的按钮点击实现
window.onload = function() {
    console.log('页面已加载');
    
    // 获取按钮元素
    var courseBtn = document.getElementById('course-info-btn');
    
    // 检查按钮是否存在
    if (courseBtn) {
        console.log('找到了解课程按钮');
        
        // 添加简单的点击事件
        courseBtn.onclick = function(e) {
            console.log('按钮被点击');
            
            // 阻止默认链接行为
            if (e) e.preventDefault();
            
            // 获取目标元素
            var targetElement = document.getElementById('course-info');
            
            if (targetElement) {
                console.log('找到目标元素，执行滚动');
                
                // 使用最简单的滚动方法 - 不使用平滑滚动，确保兼容性
                targetElement.scrollIntoView(false);
                
                // 如果需要滚动一点额外的距离，可以取消下面的注释
                // window.scrollBy(0, -50);
            } else {
                console.log('未找到目标元素');
            }
            
            // 防止事件传播
            if (e) e.stopPropagation();
            return false;
        };
    } else {
        console.log('未找到按钮');
    }
};
