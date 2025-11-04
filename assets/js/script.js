// 土力学课程网站JavaScript

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 平滑滚动效果
    smoothScroll();
    
    // 添加导航栏滚动效果
    navbarScrollEffect();
    
    // 添加页面元素淡入动画
    addFadeInAnimation();
    
    // 为移动设备添加触摸菜单切换
    mobileMenuToggle();
    
    // 添加返回顶部按钮功能
    backToTop();
    
    // 为表格添加响应式处理
    makeTablesResponsive();
});

// 平滑滚动功能
function smoothScroll() {
    // 为所有内部链接添加平滑滚动
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            // 获取目标元素的ID
            const targetId = this.getAttribute('href');
            
            // 如果是回到顶部链接
            if (targetId === '#') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }
            
            // 获取目标元素
            const targetElement = document.querySelector(targetId);
            
            // 如果目标元素存在，则滚动到该元素
            if (targetElement) {
                // 计算偏移量，考虑到固定导航栏的高度
                const navbarHeight = document.querySelector('.navbar').offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navbarHeight;
                
                window.scrollTo({ 
                    top: targetPosition, 
                    behavior: 'smooth' 
                });
                
                // 对于移动设备，点击后收起菜单
                if (window.innerWidth <= 768) {
                    const navbarCollapse = document.querySelector('.navbar-collapse');
                    if (navbarCollapse.classList.contains('show')) {
                        navbarCollapse.classList.remove('show');
                    }
                }
            }
        });
    });
}

// 导航栏滚动效果
function navbarScrollEffect() {
    const navbar = document.querySelector('.navbar');
    let lastScrollTop = 0;
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // 滚动时改变导航栏样式
        if (scrollTop > 100) {
            navbar.classList.add('navbar-scrolled');
            navbar.style.paddingTop = '0.5rem';
            navbar.style.paddingBottom = '0.5rem';
            navbar.style.backgroundColor = '#1a5276';
        } else {
            navbar.classList.remove('navbar-scrolled');
            navbar.style.paddingTop = '0.75rem';
            navbar.style.paddingBottom = '0.75rem';
        }
        
        lastScrollTop = scrollTop;
    });
}

// 添加页面元素淡入动画
function addFadeInAnimation() {
    const fadeElements = document.querySelectorAll('.section');
    
    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                fadeObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });
    
    fadeElements.forEach(element => {
        fadeObserver.observe(element);
    });
    
    // 为卡片添加延迟动画
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        
        const cardObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }, (index % 3) * 200);
                    cardObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1
        });
        
        cardObserver.observe(card);
    });
}

// 移动设备菜单切换
function mobileMenuToggle() {
    const navbarToggle = document.querySelector('.navbar-toggler');
    const navbarCollapse = document.querySelector('.navbar-collapse');
    
    navbarToggle.addEventListener('click', function() {
        navbarCollapse.classList.toggle('show');
    });
    
    // 点击菜单项后关闭菜单
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function() {
            if (navbarCollapse.classList.contains('show')) {
                navbarCollapse.classList.remove('show');
            }
        });
    });
}

// 返回顶部按钮功能
function backToTop() {
    // 创建返回顶部按钮
    const backToTopBtn = document.createElement('button');
    backToTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    backToTopBtn.id = 'back-to-top';
    backToTopBtn.className = 'btn btn-primary rounded-circle';
    backToTopBtn.style.position = 'fixed';
    backToTopBtn.style.bottom = '20px';
    backToTopBtn.style.right = '20px';
    backToTopBtn.style.width = '50px';
    backToTopBtn.style.height = '50px';
    backToTopBtn.style.borderRadius = '50%';
    backToTopBtn.style.display = 'flex';
    backToTopBtn.style.alignItems = 'center';
    backToTopBtn.style.justifyContent = 'center';
    backToTopBtn.style.zIndex = '9999';
    backToTopBtn.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    backToTopBtn.style.opacity = '0';
    backToTopBtn.style.transition = 'opacity 0.3s, transform 0.3s';
    backToTopBtn.style.transform = 'translateY(20px)';
    
    // 添加到页面
    document.body.appendChild(backToTopBtn);
    
    // 点击返回顶部
    backToTopBtn.addEventListener('click', function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    // 滚动时显示/隐藏按钮
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            backToTopBtn.style.opacity = '1';
            backToTopBtn.style.transform = 'translateY(0)';
        } else {
            backToTopBtn.style.opacity = '0';
            backToTopBtn.style.transform = 'translateY(20px)';
        }
    });
}

// 表格响应式处理
function makeTablesResponsive() {
    const tables = document.querySelectorAll('table');
    
    tables.forEach(table => {
        // 为表格添加响应式容器
        const tableContainer = document.createElement('div');
        tableContainer.className = 'table-responsive';
        
        // 插入表格到容器中
        table.parentNode.insertBefore(tableContainer, table);
        tableContainer.appendChild(table);
        
        // 如果屏幕宽度小于768px，为表格行添加点击展开功能
        if (window.innerWidth <= 768) {
            const tbody = table.querySelector('tbody');
            const thead = table.querySelector('thead');
            
            if (tbody && thead) {
                const headers = Array.from(thead.querySelectorAll('th')).map(th => th.textContent.trim());
                
                Array.from(tbody.querySelectorAll('tr')).forEach(row => {
                    const cells = Array.from(row.querySelectorAll('td'));
                    
                    // 为每一行添加点击事件
                    row.addEventListener('click', function() {
                        this.classList.toggle('expanded');
                    });
                    
                    // 为每一行添加移动视图下的样式
                    row.style.position = 'relative';
                    row.style.display = 'block';
                    row.style.marginBottom = '15px';
                    row.style.border = '1px solid #ddd';
                    row.style.borderRadius = '4px';
                    
                    // 为每个单元格添加移动视图下的样式
                    cells.forEach((cell, index) => {
                        cell.style.display = 'block';
                        cell.style.textAlign = 'right';
                        cell.style.paddingLeft = '50%';
                        cell.style.position = 'relative';
                        cell.style.borderBottom = '1px solid #eee';
                        
                        // 添加标题作为前缀
                        if (headers[index]) {
                            const label = document.createElement('span');
                            label.textContent = headers[index];
                            label.style.position = 'absolute';
                            label.style.left = '10px';
                            label.style.top = '50%';
                            label.style.transform = 'translateY(-50%)';
                            label.style.fontWeight = 'bold';
                            cell.prepend(label);
                        }
                        
                        // 最后一个单元格不需要底部边框
                        if (index === cells.length - 1) {
                            cell.style.borderBottom = 'none';
                        }
                    });
                });
                
                // 隐藏表头
                thead.style.display = 'none';
            }
        }
    });
}

// 窗口大小改变时重新处理表格
window.addEventListener('resize', function() {
    makeTablesResponsive();
});

// 课程章节详情页的标签切换功能
function activateTabPanels() {
    const tabPanes = document.querySelectorAll('.tab-pane');
    const tabLinks = document.querySelectorAll('.nav-tabs .nav-link');
    
    tabLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // 移除所有激活状态
            tabLinks.forEach(l => l.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active', 'show'));
            
            // 添加当前激活状态
            this.classList.add('active');
            const targetId = this.getAttribute('href');
            const targetPane = document.querySelector(targetId);
            if (targetPane) {
                targetPane.classList.add('active', 'show');
            }
        });
    });
}

// 下载资源按钮点击统计
function trackDownloads() {
    const downloadButtons = document.querySelectorAll('a[href$=".pdf"], a[href$=".doc"], a[href$=".docx"], a[href$=".ppt"], a[href$=".pptx"], a[href$=".zip"]');
    
    downloadButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            // 这里可以添加下载统计代码
            console.log('Downloading:', this.getAttribute('href'));
            // 如果需要，可以向服务器发送下载记录
            // trackDownload(this.getAttribute('href'));
        });
    });
}