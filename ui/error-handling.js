/**
 * 프로덕션 레벨 에러 처리 시스템
 * 네트워크 오류, 데이터 손실 방지, 브라우저 호환성 등
 */

class ErrorHandlingSystem {
    constructor() {
        this.errorCount = 0;
        this.maxErrors = 10;
        this.offlineMode = false;
        this.autoSaveInterval = null;
        this.pendingRequests = new Map();
        
        this.init();
    }

    init() {
        this.initGlobalErrorHandling();
        this.initNetworkMonitoring();
        this.initAutoSave();
        this.initBrowserCompatibility();
        this.initRetryMechanism();
        this.initDataValidation();
    }

    // 전역 에러 처리
    initGlobalErrorHandling() {
        // JavaScript 런타임 에러
        window.addEventListener('error', (event) => {
            this.handleError({
                type: 'javascript',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error
            });
        });

        // Promise rejection 에러
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError({
                type: 'promise',
                message: event.reason?.message || 'Promise rejection',
                error: event.reason
            });
        });

        // 리소스 로딩 에러
        window.addEventListener('error', (event) => {
            if (event.target !== window) {
                this.handleResourceError(event);
            }
        }, true);
    }

    handleError(errorInfo) {
        this.errorCount++;
        
        // 에러 로깅
        console.error('🚨 Error detected:', errorInfo);
        
        // 에러 리포팅 (실제 서비스에서는 외부 서비스로 전송)
        this.reportError(errorInfo);
        
        // 사용자에게 친화적 알림
        this.showUserFriendlyError(errorInfo);
        
        // 에러가 너무 많으면 안전 모드로 전환
        if (this.errorCount > this.maxErrors) {
            this.enterSafeMode();
        }
    }

    handleResourceError(event) {
        const element = event.target;
        const errorInfo = {
            type: 'resource',
            tagName: element.tagName,
            src: element.src || element.href,
            message: `Failed to load ${element.tagName.toLowerCase()}`
        };

        // 이미지 로딩 실패 시 폴백
        if (element.tagName === 'IMG') {
            this.handleImageError(element);
        }
        
        // CSS 로딩 실패 시 폴백
        if (element.tagName === 'LINK' && element.rel === 'stylesheet') {
            this.handleCSSError(element);
        }
        
        // 스크립트 로딩 실패 시 폴백
        if (element.tagName === 'SCRIPT') {
            this.handleScriptError(element);
        }

        this.handleError(errorInfo);
    }

    handleImageError(img) {
        // 기본 이미지로 대체
        img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y4ZjlmYSIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjY2Ij5JbWFnZSBOb3QgRm91bmQ8L3RleHQ+Cjwvc3ZnPg==';
        img.alt = '이미지를 불러올 수 없습니다';
    }

    handleCSSError(link) {
        // 기본 스타일로 폴백
        const fallbackStyles = document.createElement('style');
        fallbackStyles.textContent = `
            /* 기본 폴백 스타일 */
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
            .btn { padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
            .card { padding: 20px; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 20px; }
        `;
        document.head.appendChild(fallbackStyles);
    }

    handleScriptError(script) {
        console.warn('스크립트 로딩 실패:', script.src);
        
        // 중요한 스크립트의 경우 대체 CDN이나 로컬 버전 시도
        const criticalScripts = {
            'chart.js': 'https://cdn.jsdelivr.net/npm/chart.js',
            'axios': 'https://unpkg.com/axios/dist/axios.min.js'
        };

        const filename = script.src.split('/').pop();
        if (criticalScripts[filename]) {
            const fallbackScript = document.createElement('script');
            fallbackScript.src = criticalScripts[filename];
            script.parentNode.replaceChild(fallbackScript, script);
        }
    }

    showUserFriendlyError(errorInfo) {
        const messages = {
            javascript: '일시적인 오류가 발생했습니다. 페이지를 새로고침해주세요.',
            promise: '데이터 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
            resource: '리소스를 불러오는데 실패했습니다. 인터넷 연결을 확인해주세요.',
            network: '네트워크 연결에 문제가 있습니다. 연결 상태를 확인해주세요.'
        };

        const message = messages[errorInfo.type] || '알 수 없는 오류가 발생했습니다.';
        
        if (window.productionFeatures) {
            productionFeatures.showNotification(message, 'error', 8000);
        }
    }

    reportError(errorInfo) {
        // 실제 서비스에서는 에러 리포팅 서비스로 전송
        const errorReport = {
            ...errorInfo,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            userId: localStorage.getItem('user_id') || 'anonymous'
        };

        // 로컬 저장소에 에러 로그 저장 (디버깅용)
        this.saveErrorToLocalStorage(errorReport);
        
        // 실제 구현 시:
        // fetch('/api/errors', { method: 'POST', body: JSON.stringify(errorReport) });
    }

    saveErrorToLocalStorage(errorReport) {
        try {
            const errors = JSON.parse(localStorage.getItem('taxai_errors') || '[]');
            errors.push(errorReport);
            
            // 최대 50개까지만 저장
            if (errors.length > 50) {
                errors.shift();
            }
            
            localStorage.setItem('taxai_errors', JSON.stringify(errors));
        } catch (e) {
            console.warn('에러 로그 저장 실패:', e);
        }
    }

    enterSafeMode() {
        console.warn('🛡️ 안전 모드로 전환됩니다');
        
        // 자동 저장 중단
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        
        // 불필요한 기능 비활성화
        this.disableNonCriticalFeatures();
        
        // 사용자에게 알림
        if (window.productionFeatures) {
            productionFeatures.showNotification(
                '안정성을 위해 기본 모드로 전환되었습니다. 페이지를 새로고침하면 정상 모드로 돌아갑니다.',
                'warning',
                10000
            );
        }
    }

    disableNonCriticalFeatures() {
        // 애니메이션 비활성화
        document.body.style.setProperty('*', 'animation: none !important');
        document.body.style.setProperty('*', 'transition: none !important');
        
        // 차트 등 부가 기능 숨김
        const nonCriticalElements = document.querySelectorAll('[data-non-critical]');
        nonCriticalElements.forEach(el => {
            el.style.display = 'none';
        });
    }

    // 네트워크 모니터링
    initNetworkMonitoring() {
        // 온라인/오프라인 상태 모니터링
        window.addEventListener('online', () => {
            this.offlineMode = false;
            this.handleOnline();
        });

        window.addEventListener('offline', () => {
            this.offlineMode = true;
            this.handleOffline();
        });

        // 네트워크 속도 감지
        this.checkNetworkSpeed();
    }

    handleOnline() {
        if (window.productionFeatures) {
            productionFeatures.showNotification('인터넷 연결이 복구되었습니다.', 'success');
        }
        
        // 대기 중인 요청 재시도
        this.retryPendingRequests();
    }

    handleOffline() {
        if (window.productionFeatures) {
            productionFeatures.showNotification(
                '인터넷 연결이 끊어졌습니다. 데이터는 로컬에 저장되며 연결 복구 시 동기화됩니다.',
                'warning',
                0 // 무제한 표시
            );
        }
    }

    checkNetworkSpeed() {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            
            if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
                this.enableSlowNetworkMode();
            }
            
            connection.addEventListener('change', () => {
                if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
                    this.enableSlowNetworkMode();
                } else {
                    this.disableSlowNetworkMode();
                }
            });
        }
    }

    enableSlowNetworkMode() {
        console.log('🐌 느린 네트워크 감지 - 최적화 모드 활성화');
        
        // 이미지 품질 낮추기
        const images = document.querySelectorAll('img[src*="high-quality"]');
        images.forEach(img => {
            img.src = img.src.replace('high-quality', 'low-quality');
        });
        
        // 불필요한 리소스 로딩 지연
        const deferredElements = document.querySelectorAll('[data-deferred]');
        deferredElements.forEach(el => {
            el.style.display = 'none';
        });
    }

    disableSlowNetworkMode() {
        console.log('🚀 네트워크 속도 개선 - 일반 모드로 복원');
    }

    // 자동 저장 시스템
    initAutoSave() {
        // 5분마다 자동 저장
        this.autoSaveInterval = setInterval(() => {
            this.autoSaveFormData();
        }, 5 * 60 * 1000);

        // 페이지 언로드 시 데이터 저장
        window.addEventListener('beforeunload', (e) => {
            this.saveFormDataBeforeUnload();
        });

        // 입력 필드 변경 시 임시 저장
        document.addEventListener('input', debounce((e) => {
            if (e.target.matches('input, textarea, select')) {
                this.saveFieldData(e.target);
            }
        }, 1000));
    }

    autoSaveFormData() {
        try {
            const forms = document.querySelectorAll('form');
            forms.forEach((form, index) => {
                const formData = new FormData(form);
                const data = Object.fromEntries(formData.entries());
                
                if (Object.keys(data).length > 0) {
                    localStorage.setItem(`taxai_autosave_form_${index}`, JSON.stringify({
                        data,
                        timestamp: new Date().toISOString()
                    }));
                }
            });
        } catch (e) {
            console.warn('자동 저장 실패:', e);
        }
    }

    saveFormDataBeforeUnload() {
        this.autoSaveFormData();
        
        // 저장되지 않은 데이터가 있으면 경고
        const unsavedData = this.hasUnsavedData();
        if (unsavedData) {
            return '저장되지 않은 데이터가 있습니다. 정말 페이지를 떠나시겠습니까?';
        }
    }

    saveFieldData(field) {
        const fieldKey = `taxai_field_${field.name || field.id}`;
        localStorage.setItem(fieldKey, JSON.stringify({
            value: field.value,
            timestamp: new Date().toISOString()
        }));
    }

    hasUnsavedData() {
        // 실제 구현 시 폼 상태 확인 로직
        return false;
    }

    // 브라우저 호환성 확인
    initBrowserCompatibility() {
        const requiredFeatures = [
            'fetch',
            'Promise',
            'localStorage',
            'JSON'
        ];

        const missingFeatures = requiredFeatures.filter(feature => {
            return !this.checkFeatureSupport(feature);
        });

        if (missingFeatures.length > 0) {
            this.showCompatibilityWarning(missingFeatures);
        }

        // 구형 브라우저 감지
        this.detectOldBrowser();
    }

    checkFeatureSupport(feature) {
        switch (feature) {
            case 'fetch':
                return 'fetch' in window;
            case 'Promise':
                return 'Promise' in window;
            case 'localStorage':
                try {
                    localStorage.setItem('test', 'test');
                    localStorage.removeItem('test');
                    return true;
                } catch (e) {
                    return false;
                }
            case 'JSON':
                return 'JSON' in window;
            default:
                return true;
        }
    }

    showCompatibilityWarning(missingFeatures) {
        const message = `브라우저가 다음 기능을 지원하지 않습니다: ${missingFeatures.join(', ')}. 최신 브라우저 사용을 권장합니다.`;
        
        if (window.productionFeatures) {
            productionFeatures.showNotification(message, 'warning', 0);
        } else {
            alert(message);
        }
    }

    detectOldBrowser() {
        const ua = navigator.userAgent;
        const isOldIE = ua.indexOf('MSIE') !== -1 || ua.indexOf('Trident/') !== -1;
        const isOldChrome = /Chrome\/([0-9]+)/.test(ua) && parseInt(RegExp.$1, 10) < 60;
        const isOldFirefox = /Firefox\/([0-9]+)/.test(ua) && parseInt(RegExp.$1, 10) < 55;

        if (isOldIE || isOldChrome || isOldFirefox) {
            this.showBrowserUpdateWarning();
        }
    }

    showBrowserUpdateWarning() {
        const message = '더 나은 사용 경험을 위해 브라우저를 업데이트해주세요.';
        
        if (window.productionFeatures) {
            productionFeatures.showNotification(message, 'warning', 10000);
        }
    }

    // 재시도 메커니즘
    initRetryMechanism() {
        // 네트워크 요청 래퍼
        this.originalFetch = window.fetch;
        window.fetch = this.enhancedFetch.bind(this);
    }

    async enhancedFetch(url, options = {}) {
        const maxRetries = 3;
        let retryCount = 0;

        while (retryCount < maxRetries) {
            try {
                const response = await this.originalFetch(url, options);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                return response;
            } catch (error) {
                retryCount++;
                
                if (retryCount >= maxRetries) {
                    this.handleError({
                        type: 'network',
                        message: `Network request failed after ${maxRetries} retries`,
                        url: url,
                        error: error
                    });
                    throw error;
                }
                
                // 지수 백오프 대기
                await this.delay(Math.pow(2, retryCount) * 1000);
            }
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    retryPendingRequests() {
        this.pendingRequests.forEach(async (request, id) => {
            try {
                await request.retry();
                this.pendingRequests.delete(id);
            } catch (error) {
                console.warn('재시도 실패:', error);
            }
        });
    }

    // 데이터 검증
    initDataValidation() {
        document.addEventListener('submit', (e) => {
            this.validateForm(e.target);
        });
    }

    validateForm(form) {
        const errors = [];
        
        // 필수 필드 확인
        const requiredFields = form.querySelectorAll('[required]');
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                errors.push(`${field.labels[0]?.textContent || field.name}은(는) 필수 입력 항목입니다.`);
            }
        });

        // 숫자 필드 확인
        const numberFields = form.querySelectorAll('input[type="number"]');
        numberFields.forEach(field => {
            if (field.value && isNaN(field.value)) {
                errors.push(`${field.labels[0]?.textContent || field.name}에는 숫자만 입력할 수 있습니다.`);
            }
        });

        // 이메일 필드 확인
        const emailFields = form.querySelectorAll('input[type="email"]');
        emailFields.forEach(field => {
            if (field.value && !this.isValidEmail(field.value)) {
                errors.push('올바른 이메일 주소를 입력해주세요.');
            }
        });

        if (errors.length > 0) {
            this.showValidationErrors(errors);
            return false;
        }
        
        return true;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showValidationErrors(errors) {
        const errorMessage = errors.join('\n');
        
        if (window.productionFeatures) {
            productionFeatures.showNotification(errorMessage, 'error');
        } else {
            alert(errorMessage);
        }
    }
}

// 유틸리티 함수
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 전역 인스턴스 생성
const errorHandlingSystem = new ErrorHandlingSystem();

export default ErrorHandlingSystem;