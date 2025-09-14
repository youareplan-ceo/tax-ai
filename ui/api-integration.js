// 백엔드 API 통합 모듈
// 기존 TaxAIApp에 백엔드 연동 기능을 확장

// API 기본 설정
const API_CONFIG = {
    baseURL: window.location.origin,
    timeout: 10000,
    retryCount: 3
};

// TaxAIApp 클래스 확장
TaxAIApp.prototype.initApiIntegration = function() {
    this.apiBaseURL = API_CONFIG.baseURL;
    this.isOnline = navigator.onLine;
    this.pendingSync = [];
    
    // 온라인/오프라인 상태 감지
    window.addEventListener('online', () => {
        this.isOnline = true;
        this.showToast('연결이 복구되었습니다. 동기화 중...', 'info');
        this.syncPendingTransactions();
    });
    
    window.addEventListener('offline', () => {
        this.isOnline = false;
        this.showToast('오프라인 모드로 전환되었습니다.', 'warning');
    });
    
    // 앱 시작 시 데이터 동기화 및 프로그레스 업데이트
    this.loadDirectInputFromAPI();

    // 페이지 로드 시 실제 데이터 기반 프로그레스 업데이트
    setTimeout(() => {
        this.updateProgressFromData();
    }, 1500); // API 연동 완료 후 실행
};

// 백엔드 연동 거래 제출 처리
TaxAIApp.prototype.handleTransactionSubmitAPI = async function() {
    const form = document.getElementById('transaction-form');
    const formData = new FormData(form);
    const submitButton = form.querySelector('button[type="submit"]');

    // 거래 유형 매핑: 라디오 버튼에서 선택된 값 가져오기
    const selectedTransactionType = document.querySelector('input[name="transaction-type"]:checked');
    const transactionType = selectedTransactionType ? selectedTransactionType.value : 'income';

    // VAT 금액 처리: 입력값이 없으면 0으로 설정 (null 방지)
    const amount = parseFloat(document.getElementById('amount').value) || 0;
    const vatAmount = parseFloat(document.getElementById('vat-amount').value) || 0;

    // 데이터 수집 - API 스키마에 맞게 매핑
    const transactionData = {
        trx_date: formData.get('transaction-date') || document.getElementById('transaction-date').value,
        vendor: formData.get('business-name') || document.getElementById('business-name').value,
        transaction_type: transactionType, // 'income' 또는 'expense'로 정확히 매핑
        amount: amount,
        vat_amount: vatAmount, // null 대신 0으로 기본값 설정
        memo: document.getElementById('memo').value || '',
        source: 'direct_input'
        // business_number: document.getElementById('business-number')?.value || '' // 사업자번호는 향후 확장을 위해 보류
    };
    
    // 유효성 검사
    if (!transactionData.vendor || !transactionData.amount) {
        this.showToast('거래처명과 금액을 입력해주세요.', 'error');
        return;
    }
    
    // 로딩 상태
    submitButton.classList.add('loading');
    submitButton.disabled = true;
    
    // 디버깅을 위한 로그 출력
    console.log('📤 거래 데이터 전송 시작:', transactionData);

    try {
        if (this.isOnline) {
            // 온라인: 백엔드 API 호출
            const response = await this.apiCall('/entries/direct', {
                method: 'POST',
                body: JSON.stringify(transactionData)
            });

            console.log('📥 API 응답 수신:', response);

            if (response.success) {
                // 로컬 캐시에 추가
                const transaction = {
                    id: response.data.id,
                    date: response.data.trx_date,
                    businessName: response.data.vendor,
                    type: response.data.transaction_type,
                    amount: response.data.amount,
                    vatAmount: response.data.vat_amount,
                    memo: response.data.memo,
                    source: 'direct',
                    createdAt: response.data.created_at || new Date().toISOString()
                };
                
                this.directInputTransactions.unshift(transaction);
                this.updateAllTransactions();
                
                // 성공 메시지
                this.showToast(response.message || `${transaction.businessName} 거래가 저장되었습니다!`, 'success');
                
                // 실시간 동기화 트리거
                this.syncTaxCalculations();

                // 실시간 프로그레스 업데이트 (거래 입력 후)
                setTimeout(() => {
                    this.updateProgressFromData();
                }, 500);
                
            } else {
                console.error('❌ API 응답 실패:', response);
                throw new Error(response.message || response.detail || '저장 실패');
            }
        } else {
            // 오프라인: 로컬 저장
            await this.handleOfflineTransactionSave(transactionData);
        }
        
        // UI 업데이트
        this.updateTransactionSummary();
        this.updateRecentTransactions();
        
        // 폼 초기화
        form.reset();
        document.getElementById('transaction-date').value = new Date().toISOString().split('T')[0];
        
        // 프로그래스 업데이트
        this.progressValue = Math.max(this.progressValue, 40);
        this.updateProgress();
        
    } catch (error) {
        console.error('❌ 거래 저장 오류:', error);

        // 구체적인 에러 메시지 표시
        let errorMessage = '거래 저장에 실패했습니다.';

        if (error.message.includes('income') || error.message.includes('expense')) {
            errorMessage = '거래 유형이 올바르지 않습니다. (income 또는 expense 필요)';
        } else if (error.message.includes('vat_amount')) {
            errorMessage = 'VAT 금액 형식이 올바르지 않습니다.';
        } else if (error.message.includes('amount')) {
            errorMessage = '거래 금액을 올바르게 입력해주세요.';
        } else if (error.message.includes('vendor')) {
            errorMessage = '거래처명을 입력해주세요.';
        } else if (error.message.includes('transaction_type')) {
            errorMessage = '거래 구분을 선택해주세요.';
        }

        this.showToast(errorMessage, 'error');

        // 오프라인 모드로 폴백
        await this.handleOfflineTransactionSave(transactionData);
        
    } finally {
        submitButton.classList.remove('loading');
        submitButton.disabled = false;
    }
};

// 오프라인 모드 폴백 저장
TaxAIApp.prototype.handleOfflineTransactionSave = async function(transactionData) {
    try {
        // 임시 ID로 로컬 저장
        const transaction = {
            id: 'temp_' + Date.now(),
            date: transactionData.trx_date,
            businessName: transactionData.vendor,
            type: transactionData.transaction_type,
            amount: transactionData.amount,
            vatAmount: transactionData.vat_amount,
            memo: transactionData.memo,
            source: 'direct',
            createdAt: new Date().toISOString(),
            pendingSync: true
        };
        
        this.directInputTransactions.unshift(transaction);
        this.updateAllTransactions();
        
        // 동기화 대기열에 추가
        this.pendingSync.push(transactionData);
        localStorage.setItem('pendingTransactions', JSON.stringify(this.pendingSync));
        
        this.showToast('오프라인 저장: 연결 복구 시 자동 동기화됩니다.', 'warning');
        
    } catch (error) {
        this.showToast('거래 저장 중 오류가 발생했습니다.', 'error');
    }
};

// 직접 입력 데이터 API에서 로드
TaxAIApp.prototype.loadDirectInputFromAPI = async function() {
    try {
        if (!this.isOnline) return;
        
        const response = await this.apiCall('/entries/direct?per_page=100');
        
        if (response.success && response.data.entries) {
            this.directInputTransactions = response.data.entries.map(entry => ({
                id: entry.id,
                date: entry.trx_date,
                businessName: entry.vendor,
                type: entry.transaction_type,
                amount: entry.amount,
                vatAmount: entry.vat_amount,
                memo: entry.memo,
                source: 'direct',
                createdAt: entry.created_at || new Date().toISOString()
            }));
            
            this.updateAllTransactions();
            console.log(`백엔드에서 ${this.directInputTransactions.length}개 직접입력 거래 로드됨`);
        }
        
    } catch (error) {
        console.log('백엔드 데이터 로드 실패, 로컬 모드로 진행:', error);
    }
};

// 거래 수정 API
TaxAIApp.prototype.editTransactionAPI = async function(id) {
    try {
        const transaction = this.directInputTransactions.find(t => t.id === id);
        if (!transaction) return;
        
        // 폼에 데이터 채우기
        document.getElementById('transaction-date').value = transaction.date;
        document.getElementById('business-name').value = transaction.businessName;
        document.querySelector(`input[name="transaction-type"][value="${transaction.type}"]`).checked = true;
        document.getElementById('amount').value = transaction.amount;
        document.getElementById('vat-amount').value = transaction.vatAmount;
        document.getElementById('memo').value = transaction.memo;
        
        // 수정 모드 표시
        const form = document.getElementById('transaction-form');
        form.setAttribute('data-edit-id', id);
        
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.textContent = '수정 완료';
        
        this.showToast('수정 모드: 변경 후 저장하세요.', 'info');
        
    } catch (error) {
        console.error('거래 수정 로드 오류:', error);
        this.showToast('거래 수정 중 오류가 발생했습니다.', 'error');
    }
};

// 거래 삭제 API
TaxAIApp.prototype.deleteTransactionAPI = async function(id) {
    try {
        if (!confirm('정말로 이 거래를 삭제하시겠습니까?')) return;
        
        if (this.isOnline && !id.toString().startsWith('temp_')) {
            // 온라인: 백엔드 API 호출
            const response = await this.apiCall(`/entries/direct/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.success) {
                throw new Error(response.message || '삭제 실패');
            }
            
            this.showToast(response.message || '거래가 삭제되었습니다.', 'success');
        } else {
            this.showToast('거래가 삭제되었습니다.', 'success');
        }
        
        // 로컬에서 제거
        const index = this.directInputTransactions.findIndex(t => t.id === id);
        if (index !== -1) {
            this.directInputTransactions.splice(index, 1);
            this.updateAllTransactions();
            this.updateTransactionSummary();
            this.updateRecentTransactions();
        }
        
    } catch (error) {
        console.error('거래 삭제 오류:', error);
        this.showToast('거래 삭제 중 오류가 발생했습니다.', 'error');
    }
};

// 세무 계산 동기화
TaxAIApp.prototype.syncTaxCalculations = async function() {
    try {
        if (!this.isOnline) return;
        
        const response = await this.apiCall('/entries/tax-calculation');
        
        if (response.success) {
            this.taxCalculations = {
                salesTax: response.data.sales_tax,
                purchaseTax: response.data.purchase_tax,
                payableTax: response.data.payable_tax,
                totalIncome: response.data.total_income,
                totalExpense: response.data.total_expense,
                netProfit: response.data.net_profit
            };
            
            // 계산 탭 UI 업데이트
            this.updateCalculateTab();
        }
        
    } catch (error) {
        console.log('세무 계산 동기화 실패:', error);
    }
};

// 대기 중인 거래 동기화
TaxAIApp.prototype.syncPendingTransactions = async function() {
    const pending = JSON.parse(localStorage.getItem('pendingTransactions') || '[]');
    if (pending.length === 0) return;
    
    let successCount = 0;
    
    for (const transactionData of pending) {
        try {
            const response = await this.apiCall('/entries/direct', {
                method: 'POST',
                body: JSON.stringify(transactionData)
            });
            
            if (response.success) {
                successCount++;
                
                // 임시 ID를 실제 ID로 교체
                const tempTransaction = this.directInputTransactions.find(t => 
                    t.pendingSync && t.businessName === transactionData.vendor
                );
                if (tempTransaction) {
                    tempTransaction.id = response.data.id;
                    tempTransaction.pendingSync = false;
                }
            }
        } catch (error) {
            console.error('동기화 실패:', error);
        }
    }
    
    if (successCount > 0) {
        localStorage.removeItem('pendingTransactions');
        this.showToast(`${successCount}개 거래가 동기화되었습니다.`, 'success');
        this.updateAllTransactions();
    }
};

// 실시간 데이터 동기화 (폴링)
TaxAIApp.prototype.startRealTimeSync = function() {
    if (this.syncInterval) clearInterval(this.syncInterval);
    
    this.syncInterval = setInterval(async () => {
        if (this.isOnline) {
            await this.loadDirectInputFromAPI();
            await this.syncTaxCalculations();
        }
    }, 30000); // 30초마다 동기화
};

// API 호출 헬퍼 (향상된 버전)
TaxAIApp.prototype.apiCall = async function(endpoint, options = {}) {
    const url = this.apiBaseURL + endpoint;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        timeout: API_CONFIG.timeout,
        ...options
    };
    
    for (let attempt = 1; attempt <= API_CONFIG.retryCount; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), config.timeout);
            
            const response = await fetch(url, {
                ...config,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
            
        } catch (error) {
            console.warn(`API 호출 시도 ${attempt}/${API_CONFIG.retryCount} 실패:`, error);
            
            if (attempt === API_CONFIG.retryCount) {
                throw error;
            }
            
            // 지수 백오프
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
    }
};

// 앱 초기화 시 API 통합 기능 자동 시작
document.addEventListener('DOMContentLoaded', () => {
    // 약간의 딜레이 후 API 통합 초기화
    setTimeout(() => {
        if (window.taxAI && typeof window.taxAI.initApiIntegration === 'function') {
            window.taxAI.initApiIntegration();
            window.taxAI.startRealTimeSync();
            
            // 기존 handleTransactionSubmit를 API 버전으로 교체
            window.taxAI.handleTransactionSubmit = window.taxAI.handleTransactionSubmitAPI;
            window.taxAI.editTransaction = window.taxAI.editTransactionAPI;
            window.taxAI.deleteTransaction = window.taxAI.deleteTransactionAPI;
            
            console.log('🔗 백엔드 API 통합 완료');
        }
    }, 1000);
});

// 실제 데이터 기반 프로그레스 업데이트 함수
TaxAIApp.prototype.updateProgressFromData = async function() {
    console.log('📊 실제 데이터 기반 프로그레스 업데이트 시작');

    try {
        let progress = 0;
        let statusMessage = '시작 단계';

        // 1단계: 데이터 입력 완료 체크 (25%)
        const entriesResponse = await this.apiCall('/entries/list?per_page=1');
        const hasEntries = entriesResponse.success && entriesResponse.total > 0;

        if (hasEntries) {
            progress = 25;
            statusMessage = '데이터 입력 완료';
            console.log('✅ 1단계: 데이터 입력 완료 - 거래 내역 존재');

            // 2단계: 분류된 데이터 확인 (50%)
            const classifiedCount = entriesResponse.data?.filter(entry =>
                entry.account_code && entry.tax_type
            ).length || 0;

            if (classifiedCount > 0) {
                progress = 50;
                statusMessage = '데이터 분류 완료';
                console.log('✅ 2단계: 데이터 분류 완료 - 분류된 항목:', classifiedCount);

                // 3단계: 세액 계산 완료 체크 (75%)
                const currentPeriod = new Date().toISOString().substring(0, 7); // YYYY-MM
                const taxResponse = await this.apiCall(`/tax/estimate?period=${currentPeriod}`);
                const hasTaxCalculation = taxResponse.ok &&
                    (taxResponse.sales_vat > 0 || taxResponse.purchase_vat > 0);

                if (hasTaxCalculation) {
                    progress = 75;
                    statusMessage = '세액 계산 완료';
                    console.log('✅ 3단계: 세액 계산 완료');

                    // 4단계: 체크리스트 완료 체크 (100%)
                    const prepResponse = await this.apiCall(`/prep/refresh?period=${currentPeriod}&taxType=VAT`);
                    if (prepResponse.ok && prepResponse.generated >= 0) {
                        // 간단한 체크리스트 완료 시뮬레이션 (실제 체크 상태를 확인하는 로직은 추후 개선)
                        const checklistCompleted = this.checklistStatus?.finalCheck || false;
                        if (checklistCompleted) {
                            progress = 100;
                            statusMessage = '모든 단계 완료 - 신고 준비 완료';
                            console.log('✅ 4단계: 체크리스트 완료');
                        }
                    }
                }
            }
        }

        // 프로그레스 값 업데이트
        this.progressValue = progress;

        // UI 업데이트
        this.updateProgressUI(progress, statusMessage);

        console.log(`📊 프로그레스 업데이트 완료: ${progress}% - ${statusMessage}`);

        return progress;

    } catch (error) {
        console.error('❌ 프로그레스 업데이트 오류:', error);
        // 에러 발생 시 기본 프로그레스 유지
        return this.progressValue || 0;
    }
};

// 프로그레스 UI 업데이트 함수
TaxAIApp.prototype.updateProgressUI = function(progress, statusMessage = '') {
    // 메인 프로그레스 바 업데이트
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
        progressBar.style.width = `${progress}%`;
    }

    // 워크플로우 프로그레스 바 업데이트
    const workflowProgress = document.querySelector('.progress-fill');
    if (workflowProgress) {
        workflowProgress.style.width = `${progress}%`;
    }

    // 프로그레스 텍스트 업데이트
    const progressText = document.querySelector('.progress-text');
    if (progressText) {
        progressText.textContent = `${progress}% 완료`;
    }

    // 상태 메시지 업데이트
    const statusElement = document.querySelector('.progress-message');
    if (statusElement && statusMessage) {
        statusElement.textContent = statusMessage;
    }

    // 워크플로우 단계 메시지 업데이트 (HTML에서 p 태그 업데이트)
    const workflowMessage = document.querySelector('.workflow-progress p');
    if (workflowMessage) {
        let stepMessage = '';
        if (progress === 0) {
            stepMessage = '단계 1: 데이터 입력을 시작하세요';
        } else if (progress < 50) {
            stepMessage = '단계 2: 데이터 검토 및 분류를 확인하세요';
        } else if (progress < 75) {
            stepMessage = '단계 3: 세액 계산을 진행하세요';
        } else if (progress < 100) {
            stepMessage = '단계 4: 체크리스트를 완료하세요';
        } else {
            stepMessage = '✅ 모든 단계 완료 - 홈택스 신고 준비됨';
        }
        workflowMessage.textContent = stepMessage;
    }
};