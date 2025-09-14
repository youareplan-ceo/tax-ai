/**
 * 유아플랜 TAX AI 프로덕션 기능
 * 브랜딩, UX 최적화, 보안 등 실제 서비스 수준의 기능들
 */

class ProductionFeatures {
    constructor() {
        this.init();
    }

    init() {
        this.initBrandingFeatures();
        this.initNotificationSystem();
        this.initUserGuide();
        this.initSecurityFeatures();
        this.initPerformanceOptimization();
    }

    // 브랜딩 관련 기능
    initBrandingFeatures() {
        // 로고 로드 에러 시 폴백
        const logo = document.querySelector('.brand-logo-image');
        if (logo) {
            logo.onerror = () => {
                logo.style.display = 'none';
                console.log('로고 이미지 로드 실패 - 텍스트 로고로 대체');
            };
        }

        // 브랜드 컬러 애니메이션
        this.initBrandAnimations();
    }

    initBrandAnimations() {
        // 헤더 스크롤 효과
        let lastScrollTop = 0;
        const header = document.querySelector('.production-header');
        
        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            if (scrollTop > lastScrollTop) {
                // 스크롤 다운
                header.style.transform = 'translateY(-100%)';
            } else {
                // 스크롤 업
                header.style.transform = 'translateY(0)';
            }
            
            lastScrollTop = scrollTop;
        });

        // 신뢰성 배지 호버 효과
        const trustBadges = document.querySelectorAll('.trust-badge');
        trustBadges.forEach(badge => {
            badge.addEventListener('mouseenter', () => {
                badge.style.transform = 'scale(1.05)';
            });
            
            badge.addEventListener('mouseleave', () => {
                badge.style.transform = 'scale(1)';
            });
        });
    }

    // 전문 알림 시스템
    initNotificationSystem() {
        this.notificationContainer = this.createNotificationContainer();
    }

    createNotificationContainer() {
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
        `;
        document.body.appendChild(container);
        return container;
    }

    showNotification(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 18px;">${icons[type]}</span>
                <div>
                    <div style="font-weight: 600; margin-bottom: 4px;">
                        ${type === 'success' ? '성공' : type === 'error' ? '오류' : type === 'warning' ? '주의' : '알림'}
                    </div>
                    <div style="font-size: 14px; opacity: 0.9;">
                        ${message}
                    </div>
                </div>
            </div>
        `;

        this.notificationContainer.appendChild(notification);

        // 애니메이션 효과
        setTimeout(() => notification.classList.add('show'), 100);

        // 자동 제거
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);

        return notification;
    }

    // 사용자 가이드 기능 (기존 전문가 상담 기능 대체)
    initUserGuide() {
        // 가이드 기능은 이미 tax-guide.js에서 처리됨
        console.log('사용자 가이드 기능 준비 완료');
    }

    // 보안 기능
    initSecurityFeatures() {
        // 개발자 도구 감지 (프로덕션에서는 신중히 사용)
        this.detectDevTools();
        
        // 민감한 데이터 마스킹
        this.initDataMasking();
        
        // HTTPS 강제 (프로덕션에서만)
        this.enforceHTTPS();
    }

    detectDevTools() {
        let devtools = { open: false };
        
        setInterval(() => {
            if (window.outerHeight - window.innerHeight > 200 || 
                window.outerWidth - window.innerWidth > 200) {
                if (!devtools.open) {
                    devtools.open = true;
                    console.warn('🔒 개발자 도구가 감지되었습니다. 보안을 위해 주의해주세요.');
                }
            } else {
                devtools.open = false;
            }
        }, 500);
    }

    initDataMasking() {
        // 개인정보 자동 마스킹
        document.addEventListener('input', (e) => {
            if (e.target.type === 'tel' || e.target.name === 'phone') {
                this.maskPhoneNumber(e.target);
            }
        });
    }

    maskPhoneNumber(input) {
        let value = input.value.replace(/\D/g, '');
        if (value.length >= 11) {
            value = value.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
        } else if (value.length >= 7) {
            value = value.replace(/(\d{3})(\d{3,4})(\d{0,4})/, '$1-$2-$3');
        } else if (value.length >= 3) {
            value = value.replace(/(\d{3})(\d{0,4})/, '$1-$2');
        }
        input.value = value;
    }

    enforceHTTPS() {
        if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
            location.replace('https:' + window.location.href.substring(window.location.protocol.length));
        }
    }

    // 성능 최적화
    initPerformanceOptimization() {
        // 이미지 지연 로딩
        this.initLazyLoading();
        
        // 스크롤 성능 최적화
        this.optimizeScrollPerformance();
        
        // 메모리 사용량 모니터링
        this.monitorMemoryUsage();
    }

    initLazyLoading() {
        const images = document.querySelectorAll('img[data-src]');
        
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    observer.unobserve(img);
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));
    }

    optimizeScrollPerformance() {
        let ticking = false;
        
        function updateScrollElements() {
            // 스크롤 관련 DOM 업데이트
            ticking = false;
        }
        
        function requestScrollUpdate() {
            if (!ticking) {
                requestAnimationFrame(updateScrollElements);
                ticking = true;
            }
        }
        
        window.addEventListener('scroll', requestScrollUpdate);
    }

    monitorMemoryUsage() {
        if (performance.memory) {
            setInterval(() => {
                const memoryInfo = performance.memory;
                const usedMB = Math.round(memoryInfo.usedJSHeapSize / 1048576);
                const limitMB = Math.round(memoryInfo.jsHeapSizeLimit / 1048576);
                
                if (usedMB > limitMB * 0.8) {
                    console.warn('⚠️ 메모리 사용량이 높습니다:', usedMB + 'MB/' + limitMB + 'MB');
                }
            }, 30000); // 30초마다 체크
        }
    }
}

// CSS 애니메이션 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes slideUp {
        from { transform: translateY(30px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
    
    .production-header {
        transition: transform 0.3s ease;
    }
    
    input:focus, textarea:focus, select:focus {
        border-color: #0064FF !important;
        outline: none;
        box-shadow: 0 0 0 3px rgba(0, 100, 255, 0.1);
    }
    
    .trust-badge {
        transition: transform 0.2s ease;
    }
    
    .lazy {
        opacity: 0;
        transition: opacity 0.3s;
    }
`;
document.head.appendChild(style);

// 전역 인스턴스 생성
const productionFeatures = new ProductionFeatures();

// 에러 핸들링
window.addEventListener('error', (e) => {
    console.error('JavaScript 오류:', e.error);
    
    // 프로덕션에서는 에러 리포팅 서비스로 전송
    if (productionFeatures && typeof productionFeatures.showNotification === 'function') {
        productionFeatures.showNotification(
            '일시적인 오류가 발생했습니다. 페이지를 새로고침해주세요.',
            'error'
        );
    }
});

// 네트워크 상태 모니터링
window.addEventListener('online', () => {
    if (productionFeatures) {
        productionFeatures.showNotification('인터넷 연결이 복구되었습니다.', 'success');
    }
});

window.addEventListener('offline', () => {
    if (productionFeatures) {
        productionFeatures.showNotification('인터넷 연결이 끊어졌습니다.', 'warning');
    }
});

export default ProductionFeatures;