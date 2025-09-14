// YouArePlan TAX AI - 토스 스타일 JavaScript 애플리케이션

class TaxAIApp {
    constructor() {
        this.currentTab = 'input';
        this.uploadedFiles = [];
        
        // 전역 데이터 관리 - 통합 데이터 소스
        this.allTransactions = []; // 전체 거래 데이터 (직접입력 + CSV)
        this.directInputTransactions = []; // 직접 입력 데이터
        this.uploadedTransactions = []; // CSV 업로드 데이터
        
        // 세무 계산 데이터
        this.taxCalculations = {
            salesTax: 0,      // 매출세액
            purchaseTax: 0,   // 매입세액
            payableTax: 0,    // 납부세액
            totalIncome: 0,   // 총 매출
            totalExpense: 0,  // 총 매입
            netProfit: 0      // 순이익
        };
        
        // 체크리스트 상태
        this.checklistStatus = {
            dataEntry: false,
            dataReview: false,
            taxCalculation: false,
            finalCheck: false
        };
        
        this.progressValue = 20;
        this.init();
    }

    init() {
        this.bindEvents();
        this.initializeComponents();
        this.showToast('환영합니다! YouArePlan TAX AI를 시작합니다.', 'success');
    }

    // 이벤트 바인딩
    bindEvents() {
        // 탭 네비게이션
        this.bindTabEvents();
        
        // 직접 입력 기능
        this.bindTransactionInputEvents();
        
        // 파일 업로드
        this.bindUploadEvents();
        
        // 계산 기능
        this.bindCalculationEvents();
        
        // 체크리스트
        this.bindChecklistEvents();
        
        // 필터 버튼
        this.bindFilterEvents();
    }

    // 탭 관련 이벤트
    bindTabEvents() {
        const tabButtons = document.querySelectorAll('.tab-button');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const tabId = button.getAttribute('data-tab');
                this.switchTab(tabId);
                
                // 토스 스타일 햅틱 피드백 시뮬레이션
                if (navigator.vibrate) {
                    navigator.vibrate(10);
                }
            });
        });
    }

    // 탭 전환 (토스 스타일 트랜지션)
    switchTab(tabId) {
        // 이미 활성화된 탭인 경우 리턴
        if (this.currentTab === tabId) return;

        // 버튼 상태 업데이트
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-selected', 'false');
        });

        const activeButton = document.querySelector(`[data-tab="${tabId}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
            activeButton.setAttribute('aria-selected', 'true');
        }

        // 섹션 전환
        const sections = document.querySelectorAll('.content-section');
        sections.forEach(section => {
            section.classList.remove('active');
        });

        const activeSection = document.getElementById(`${tabId}-section`);
        if (activeSection) {
            activeSection.classList.add('active');
        }

        // 프로그래스 바 업데이트
        this.updateProgress(tabId);
        
        this.currentTab = tabId;
        
        // 워크플로우 업데이트
        this.updateWorkflowProgress(tabId);
        
        // 탭 전환 완료 토스트
        const tabNames = {
            'input': '거래 직접입력',
            'upload': '파일 업로드',
            'view': '데이터 조회',
            'calculate': '세무 계산',
            'checklist': '체크리스트',
            'guide': '신고 가이드'
        };
        
        this.showToast(`${tabNames[tabId]} 탭으로 이동했습니다.`, 'info');

        // 탭 변경 시 프로그레스 업데이트 (실제 데이터 기반)
        if (this.updateProgressFromData) {
            setTimeout(() => {
                this.updateProgressFromData();
            }, 300);
        }
    }

    // 거래 입력 이벤트
    bindTransactionInputEvents() {
        const form = document.getElementById('transaction-form');
        const autoVatCheckbox = document.getElementById('auto-vat');
        const amountInput = document.getElementById('amount');
        const vatInput = document.getElementById('vat-amount');
        const dateInput = document.getElementById('transaction-date');
        
        // 오늘 날짜로 기본값 설정
        if (dateInput) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }
        
        // 자동 부가세 계산
        if (autoVatCheckbox && amountInput && vatInput) {
            const updateVAT = () => {
                if (autoVatCheckbox.checked) {
                    const amount = parseFloat(amountInput.value) || 0;
                    const vat = Math.floor(amount * 0.1);
                    vatInput.value = vat;
                    vatInput.disabled = true;
                } else {
                    vatInput.disabled = false;
                }
            };
            
            autoVatCheckbox.addEventListener('change', updateVAT);
            amountInput.addEventListener('input', 
                window.taxAIUtils.debounce(updateVAT, 300)
            );
            
            // 초기 설정
            updateVAT();
        }
        
        // 금액 입력 포맷팅
        if (amountInput) {
            amountInput.addEventListener('input', (e) => {
                const value = e.target.value.replace(/[^0-9]/g, '');
                e.target.value = value;
            });
        }
        
        // 폼 제출
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleTransactionSubmit();
            });
        }
    }
    
    // 거래 제출 처리
    async handleTransactionSubmit() {
        const form = document.getElementById('transaction-form');
        const formData = new FormData(form);
        const submitButton = form.querySelector('button[type="submit"]');
        
        // 데이터 수집
        const transaction = {
            id: Date.now(),
            date: formData.get('transaction-date') || document.getElementById('transaction-date').value,
            businessName: formData.get('business-name') || document.getElementById('business-name').value,
            type: formData.get('transaction-type') || 'income',
            amount: parseInt(document.getElementById('amount').value) || 0,
            vatAmount: parseInt(document.getElementById('vat-amount').value) || 0,
            memo: document.getElementById('memo').value || '',
            createdAt: new Date().toISOString()
        };
        
        // 유효성 검사
        if (!transaction.businessName || !transaction.amount) {
            this.showToast('거래처명과 금액을 입력해주세요.', 'error');
            return;
        }
        
        // 로딩 상태
        submitButton.classList.add('loading');
        submitButton.disabled = true;
        
        try {
            // 시뮬레이션 딴레이
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // 거래 저장 - 전역 데이터에 추가
            transaction.source = 'direct'; // 데이터 소스 표시
            this.directInputTransactions.unshift(transaction);
            this.updateAllTransactions();
            
            // UI 업데이트
            this.updateTransactionSummary();
            this.updateRecentTransactions();
            
            // 폼 초기화
            form.reset();
            document.getElementById('transaction-date').value = new Date().toISOString().split('T')[0];
            
            // 성공 메시지
            this.showToast(`${transaction.businessName} 거래가 저장되었습니다!`, 'success');
            
            // 프로그래스 업데이트
            this.progressValue = Math.max(this.progressValue, 40);
            this.updateProgress();
            
        } catch (error) {
            this.showToast('거래 저장 중 오류가 발생했습니다.', 'error');
        } finally {
            submitButton.classList.remove('loading');
            submitButton.disabled = false;
        }
    }
    
    // 전체 거래 데이터 업데이트 (직접입력 + CSV 통합)
    updateAllTransactions() {
        this.allTransactions = [...this.directInputTransactions, ...this.uploadedTransactions]
            .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
        
        // 세무 계산 업데이트
        this.updateTaxCalculations();
        
        // 모든 탭 UI 업데이트
        this.updateTransactionSummary();
        this.updateViewTab();
        this.updateCalculateTab();
        this.updateChecklistTab();
    }
    
    // 거래 요약 업데이트
    updateTransactionSummary() {
        const totalIncome = this.allTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const totalExpense = this.allTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
            
        const netProfit = totalIncome - totalExpense;
        
        // 세무 계산 데이터 업데이트
        this.taxCalculations.totalIncome = totalIncome;
        this.taxCalculations.totalExpense = totalExpense;
        this.taxCalculations.netProfit = netProfit;
        
        // UI 업데이트
        const countElement = document.getElementById('transaction-count');
        const incomeElement = document.getElementById('total-income');
        const expenseElement = document.getElementById('total-expense');
        const profitElement = document.getElementById('net-profit');
        
        if (countElement) countElement.textContent = `${this.allTransactions.length}건`;
        if (incomeElement) incomeElement.textContent = this.formatCurrency(totalIncome);
        if (expenseElement) expenseElement.textContent = this.formatCurrency(totalExpense);
        if (profitElement) {
            profitElement.textContent = this.formatCurrency(netProfit);
            profitElement.className = `summary-amount ${
                netProfit > 0 ? 'success' : netProfit < 0 ? 'error' : ''
            }`;
        }
    }
    
    // 최근 거래 목록 업데이트
    updateRecentTransactions() {
        const container = document.getElementById('recent-transactions');
        if (!container) return;
        
        if (this.directInputTransactions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📝</div>
                    <p class="empty-message">아직 입력된 거래가 없습니다.</p>
                    <p class="empty-submessage">위 폼을 사용해 첫 거래를 입력해보세요.</p>
                </div>
            `;
            return;
        }
        
        const recentTransactions = this.directInputTransactions.slice(0, 5); // 최근 5건
        
        container.innerHTML = recentTransactions.map(transaction => `
            <div class="transaction-item" data-id="${transaction.id}">
                <div class="transaction-info">
                    <div class="transaction-business">${transaction.businessName}</div>
                    <div class="transaction-details">
                        ${this.formatDate(transaction.date)} • ${transaction.memo || '메모 없음'}
                    </div>
                </div>
                <div class="transaction-amount">
                    <span class="transaction-amount-value ${transaction.type}">
                        ${transaction.type === 'income' ? '+' : '-'}${this.formatCurrency(transaction.amount)}
                    </span>
                </div>
                <div class="transaction-actions">
                    <button class="btn btn-sm btn-outline" onclick="window.taxAI.editTransaction(${transaction.id})">
                        수정
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="window.taxAI.deleteTransaction(${transaction.id})">
                        삭제
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    // 거래 수정
    editTransaction(id) {
        const transaction = this.directInputTransactions.find(t => t.id === id);
        if (!transaction) return;
        
        // 폼에 데이터 채우기
        document.getElementById('transaction-date').value = transaction.date;
        document.getElementById('business-name').value = transaction.businessName;
        document.querySelector(`input[name="transaction-type"][value="${transaction.type}"]`).checked = true;
        document.getElementById('amount').value = transaction.amount;
        document.getElementById('vat-amount').value = transaction.vatAmount;
        document.getElementById('memo').value = transaction.memo;
        
        // 기존 거래 삭제
        this.deleteTransaction(id, false); // 토스트 없이
        
        this.showToast('거래 정보가 폼에 로드되었습니다. 수정 후 다시 저장하세요.', 'info');
    }
    
    // 거래 삭제
    deleteTransaction(id, showToast = true) {
        const index = this.directInputTransactions.findIndex(t => t.id === id);
        if (index === -1) return;
        
        const transaction = this.directInputTransactions[index];
        this.directInputTransactions.splice(index, 1);
        
        // 전체 데이터 업데이트
        this.updateAllTransactions();
        
        // UI 업데이트
        this.updateTransactionSummary();
        this.updateRecentTransactions();
        
        if (showToast) {
            this.showToast(`${transaction.businessName} 거래가 삭제되었습니다.`, 'info');
        }
    }

    // 파일 업로드 이벤트
    bindUploadEvents() {
        const uploadZone = document.getElementById('upload-zone');
        const fileInput = document.getElementById('file-input');
        const uploadButton = uploadZone.querySelector('.btn-primary');

        // 클릭으로 파일 선택
        uploadButton.addEventListener('click', () => {
            fileInput.click();
        });

        uploadZone.addEventListener('click', (e) => {
            if (e.target !== uploadButton) {
                fileInput.click();
            }
        });

        // 파일 선택 처리
        fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            if (files.length > 0) {
                this.handleFileUpload(files[0]);
            }
        });

        // 드래그앤드롭
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('dragover');
        });

        uploadZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
        });

        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
            
            const files = Array.from(e.dataTransfer.files);
            if (files.length > 0) {
                this.handleFileUpload(files[0]);
            }
        });
    }

    // 파일 업로드 처리 (토스 스타일 로딩)
    async handleFileUpload(file) {
        // 파일 검증
        const allowedTypes = ['.csv', '.xlsx', '.xls'];
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        
        if (!allowedTypes.includes(fileExtension)) {
            this.showToast('지원하지 않는 파일 형식입니다.', 'error');
            return;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB
            this.showToast('파일 크기가 너무 큽니다. (최대 10MB)', 'error');
            return;
        }

        // 업로드 시작
        this.showToast('파일 업로드를 시작합니다...', 'info');
        const startTime = Date.now();

        // 로딩 UI 표시
        const uploadZone = document.getElementById('upload-zone');
        const originalContent = uploadZone.innerHTML;
        
        uploadZone.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <div style="margin-left: 12px;">
                    <div class="font-semibold">업로드 중...</div>
                    <div class="text-sm text-gray-600">${file.name}</div>
                </div>
            </div>
        `;

        try {
            // 실제 API 호출 시뮬레이션
            const formData = new FormData();
            formData.append('file', file);

            // 토스 스타일 프로그래스 시뮬레이션
            await this.simulateUploadProgress();

            // API 호출 (실제 백엔드 연동 시)
            const response = await fetch('/api/ingest/csv', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            const processingTime = ((Date.now() - startTime) / 1000).toFixed(1);

            // CSV 데이터를 전역 거래 데이터로 변환
            const csvData = result.data || result.entries || [];
            const newTransactions = csvData.map((item, index) => ({
                id: Date.now() + index,
                source: 'upload',
                businessName: item.business_name || item.description || '업로드 데이터',
                date: item.date || new Date().toISOString().split('T')[0],
                type: (item.amount > 0 || item.type === 'income') ? 'income' : 'expense',
                amount: Math.abs(item.amount || 0),
                vatAmount: Math.abs(item.vat_amount || (item.amount * 0.1) || 0),
                memo: item.memo || item.description || '',
                createdAt: new Date().toISOString()
            }));
            
            this.uploadedTransactions.push(...newTransactions);
            this.updateAllTransactions();
            
            // 성공 처리
            this.uploadedFiles.push({
                name: file.name,
                size: file.size,
                result: result,
                uploadTime: processingTime,
                transactionCount: newTransactions.length
            });

            // UI 업데이트
            this.showUploadResult(file.name, newTransactions.length, processingTime);
            this.showToast(`파일 업로드 완료! ${newTransactions.length}건의 거래가 추가되었습니다.`, 'success');
            
            // 프로그래스 업데이트
            this.progressValue = 60;
            this.updateProgress();

            // 자동으로 다음 탭으로 이동
            setTimeout(() => {
                this.switchTab('view');
            }, 2000);

        } catch (error) {
            console.error('Upload error:', error);
            uploadZone.innerHTML = originalContent;
            this.bindUploadEvents(); // 이벤트 리바인딩
            this.showToast('업로드 중 오류가 발생했습니다.', 'error');
        }
    }

    // 업로드 진행률 시뮬레이션
    simulateUploadProgress() {
        return new Promise((resolve) => {
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 30;
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(interval);
                    setTimeout(resolve, 500);
                }
            }, 200);
        });
    }

    // 업로드 결과 표시
    showUploadResult(filename, processedCount, processingTime) {
        const uploadResult = document.getElementById('upload-result');
        const filenameElement = document.getElementById('uploaded-filename');
        const processedCountElement = document.getElementById('processed-count');
        const processingTimeElement = document.getElementById('processing-time');

        filenameElement.textContent = filename;
        processedCountElement.textContent = processedCount.toLocaleString();
        processingTimeElement.textContent = processingTime;

        uploadResult.classList.remove('hidden');

        // 데이터 조회 탭에 샘플 데이터 표시
        this.updateDataView();
    }

    // 데이터 조회 업데이트
    updateDataView() {
        const dataLoading = document.getElementById('data-loading');
        const sampleData = document.getElementById('sample-data');

        if (dataLoading) dataLoading.style.display = 'none';
        if (sampleData) sampleData.classList.remove('hidden');

        // 상태 업데이트
        const viewStatus = document.querySelector('#view-section .result-status');
        if (viewStatus) {
            viewStatus.textContent = '데이터 로드됨';
            viewStatus.className = 'result-status success';
        }
    }

    // 계산 관련 이벤트
    bindCalculationEvents() {
        const calcTypes = document.querySelectorAll('[data-calc-type]');
        const startButton = document.getElementById('start-calculation');

        // 계산 유형 선택
        calcTypes.forEach(card => {
            card.addEventListener('click', () => {
                calcTypes.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                card.style.borderColor = '#0064FF';
                card.style.backgroundColor = 'rgba(0, 100, 255, 0.05)';
            });
        });

        // 계산 시작
        if (startButton) {
            startButton.addEventListener('click', () => {
                this.startCalculation();
            });
        }
    }

    // 세무 계산 실행
    async startCalculation() {
        const button = document.getElementById('start-calculation');
        const result = document.getElementById('calculation-result');

        // 로딩 상태
        button.innerHTML = '<div class="loading-spinner" style="width: 20px; height: 20px;"></div> 계산 중...';
        button.disabled = true;

        try {
            // API 호출 시뮬레이션
            await new Promise(resolve => setTimeout(resolve, 3000));

            // 실시간 계산 결과 표시 (이미 updateCalculateTab에서 처리됨)
            this.updateCalculateTab();
            this.showToast('세무 계산이 완료되었습니다!', 'success');
            
            // 프로그래스 업데이트
            this.progressValue = 80;
            this.updateProgress();

        } catch (error) {
            this.showToast('계산 중 오류가 발생했습니다.', 'error');
        } finally {
            button.innerHTML = '<span aria-hidden="true">🧮</span> 계산 완료';
            button.disabled = false;
        }
    }

    // 체크리스트 이벤트
    bindChecklistEvents() {
        const checkboxes = document.querySelectorAll('#checklist-section input[type="checkbox"]');
        
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateChecklistProgress();
            });
        });
    }

    // 체크리스트 진행률 업데이트
    updateChecklistProgress() {
        const checkboxes = document.querySelectorAll('#checklist-section input[type="checkbox"]');
        const checked = document.querySelectorAll('#checklist-section input[type="checkbox"]:checked');
        
        const progress = (checked.length / checkboxes.length) * 100;
        const progressBar = document.querySelector('#checklist-section .progress-bar');
        const progressText = document.querySelector('#checklist-section .progress-container + p');

        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }

        if (progressText) {
            progressText.textContent = `${checked.length}단계 완료 (${checkboxes.length}단계 중)`;
        }

        // 전체 완료 시
        if (progress === 100) {
            this.progressValue = 100;
            this.updateProgress();
            this.showToast('모든 세무 절차가 완료되었습니다! 🎉', 'success');
        }
    }

    // 필터 이벤트
    bindFilterEvents() {
        const filterButtons = document.querySelectorAll('#view-section .btn');
        
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                // 버튼 상태 업데이트
                filterButtons.forEach(btn => {
                    btn.classList.remove('btn-secondary');
                    btn.classList.add('btn-outline');
                });
                
                button.classList.remove('btn-outline');
                button.classList.add('btn-secondary');

                // 필터링 로직 (여기서는 시뮬레이션)
                this.showToast(`${button.textContent} 필터가 적용되었습니다.`, 'info');
            });
        });
    }

    // 컴포넌트 초기화
    initializeComponents() {
        // 키보드 접근성
        this.initKeyboardNavigation();

        // 반응형 처리
        this.handleResize();
        window.addEventListener('resize', () => this.handleResize());

        // 거래 목록 관리자 초기화
        if (typeof TransactionListManager !== 'undefined') {
            this.transactionListManager = new TransactionListManager();
        }

        // 세무 가이드 초기화
        if (typeof this.initTaxGuide === 'function') {
            this.initTaxGuide();
        }
    }

    // 키보드 내비게이션
    initKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + 숫자키로 탭 전환
            if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '6') {
                e.preventDefault();
                const tabMapping = {
                    '1': 'input',
                    '2': 'upload',
                    '3': 'view',
                    '4': 'calculate',
                    '5': 'checklist',
                    '6': 'guide'
                };
                this.switchTab(tabMapping[e.key]);
            }
        });
    }

    // 반응형 처리
    handleResize() {
        const isMobile = window.innerWidth <= 768;
        const tabNavigation = document.querySelector('.tab-navigation');
        
        if (isMobile && tabNavigation) {
            tabNavigation.style.flexDirection = 'column';
        } else if (tabNavigation) {
            tabNavigation.style.flexDirection = 'row';
        }
    }

    // 프로그래스 바 업데이트
    updateProgress(tabId = null) {
        const progressBar = document.querySelector('.progress-bar');
        
        if (tabId) {
            const tabProgress = {
                'input': 20,
                'upload': 40,
                'view': 60,
                'calculate': 80,
                'checklist': this.progressValue >= 100 ? 100 : 90
            };
            this.progressValue = tabProgress[tabId];
        }

        if (progressBar) {
            progressBar.style.width = `${this.progressValue}%`;
        }
    }

    // 토스트 알림 (토스 스타일)
    showToast(message, type = 'info', duration = 4000) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        // 토스트 엘리먼트 생성
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        toast.innerHTML = `
            <div class="flex items-center">
                <span style="font-size: 1.2em; margin-right: 8px;">${icons[type]}</span>
                <div>
                    <div class="toast-title">${this.getToastTitle(type)}</div>
                    <div class="toast-message">${message}</div>
                </div>
            </div>
        `;

        container.appendChild(toast);

        // 자동 제거
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease-in-out';
            setTimeout(() => {
                if (container.contains(toast)) {
                    container.removeChild(toast);
                }
            }, 300);
        }, duration);

        // 클릭으로 제거
        toast.addEventListener('click', () => {
            toast.style.animation = 'slideOutRight 0.3s ease-in-out';
            setTimeout(() => {
                if (container.contains(toast)) {
                    container.removeChild(toast);
                }
            }, 300);
        });
    }

    // 토스트 타이틀 반환
    getToastTitle(type) {
        const titles = {
            success: '성공',
            error: '오류',
            warning: '주의',
            info: '알림'
        };
        return titles[type] || '알림';
    }

    // 토스 스타일 포맧팅 헬퍼 메소드
    formatCurrency(amount) {
        return new Intl.NumberFormat('ko-KR').format(amount) + '원';
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // 워크플로우 진행상황 업데이트
    updateWorkflowProgress(tabId) {
        const workflowSteps = document.querySelectorAll('.workflow-step');
        if (!workflowSteps.length) return;
        
        const stepMapping = {
            'input': 0,    // 데이터 입력
            'upload': 0,   // 데이터 입력 (같은 단계)
            'view': 1,     // 데이터 검토
            'calculate': 2, // 세무 계산
            'checklist': 3  // 최종 확인
        };
        
        const currentStep = stepMapping[tabId];
        const hasData = this.allTransactions.length > 0;
        const hasCalculations = this.taxCalculations.payableTax !== 0;
        
        workflowSteps.forEach((step, index) => {
            const stepIcon = step.querySelector('.workflow-step-icon');
            
            if (index < currentStep || (index === currentStep && this.isStepCompleted(index, hasData, hasCalculations))) {
                // 완료된 단계
                step.classList.add('completed');
                step.classList.remove('active', 'pending');
                if (stepIcon) stepIcon.innerHTML = '✅';
            } else if (index === currentStep) {
                // 현재 진행 단계
                step.classList.add('active');
                step.classList.remove('completed', 'pending');
                if (stepIcon) stepIcon.innerHTML = '🔄';
            } else {
                // 대기 단계
                step.classList.add('pending');
                step.classList.remove('completed', 'active');
                if (stepIcon) stepIcon.innerHTML = '⏳';
            }
        });
    }
    
    // 단계 완료 여부 확인
    isStepCompleted(stepIndex, hasData, hasCalculations) {
        switch (stepIndex) {
            case 0: return hasData; // 데이터 입력
            case 1: return hasData; // 데이터 검토
            case 2: return hasCalculations; // 세무 계산
            case 3: return this.progressValue >= 100; // 최종 확인
            default: return false;
        }
    }
    
    // 세무 계산 데이터 업데이트 (통합 데이터 기반)
    updateTaxCalculations() {
        // 매출세액 계산 (수입 거래의 VAT)
        this.taxCalculations.salesTax = this.allTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + (t.vatAmount || 0), 0);
        
        // 매입세액 계산 (지출 거래의 VAT)
        this.taxCalculations.purchaseTax = this.allTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + (t.vatAmount || 0), 0);
        
        // 납부세액 = 매출세액 - 매입세액
        this.taxCalculations.payableTax = this.taxCalculations.salesTax - this.taxCalculations.purchaseTax;
    }
    
    // View 탭 UI 업데이트 (통합 데이터 표시)
    updateViewTab() {
        const viewContainer = document.querySelector('#view-section .data-display');
        if (!viewContainer) return;
        
        if (this.allTransactions.length === 0) {
            viewContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📊</div>
                    <p class="empty-message">표시할 데이터가 없습니다.</p>
                    <p class="empty-submessage">직접 입력하거나 파일을 업로드해주세요.</p>
                </div>
            `;
            return;
        }
        
        const directCount = this.directInputTransactions.length;
        const uploadCount = this.uploadedTransactions.length;
        
        viewContainer.innerHTML = `
            <div class="data-section">
                <div class="data-source-summary">
                    <div class="data-source-badge direct">직접입력 ${directCount}건</div>
                    <div class="data-source-badge upload">업로드 ${uploadCount}건</div>
                    <div class="data-source-badge total">총 ${this.allTransactions.length}건</div>
                </div>
                
                <div class="transaction-grid">
                    ${this.allTransactions.slice(0, 10).map(transaction => `
                        <div class="transaction-card ${transaction.source}">
                            <div class="transaction-header">
                                <span class="business-name">${transaction.businessName}</span>
                                <span class="transaction-date">${this.formatDate(transaction.date)}</span>
                            </div>
                            <div class="transaction-amount ${transaction.type}">
                                ${transaction.type === 'income' ? '+' : '-'}${this.formatCurrency(transaction.amount)}
                            </div>
                            <div class="transaction-source">${transaction.source === 'direct' ? '직접입력' : 'CSV업로드'}</div>
                        </div>
                    `).join('')}
                </div>
                
                ${this.allTransactions.length > 10 ? `
                    <div class="load-more">
                        <button class="btn btn-outline" onclick="window.taxAI.showAllTransactions()">
                            전체 ${this.allTransactions.length}건 보기
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    // Calculate 탭 UI 업데이트 (실시간 세무 계산)
    updateCalculateTab() {
        const calcContainer = document.querySelector('#calculate-section .tax-summary');
        if (!calcContainer) return;
        
        calcContainer.innerHTML = `
            <div class="tax-summary-grid">
                <div class="tax-summary-card sales">
                    <div class="tax-card-header">
                        <span class="tax-icon">💰</span>
                        <span class="tax-title">매출세액</span>
                    </div>
                    <div class="tax-amount">${this.formatCurrency(this.taxCalculations.salesTax)}</div>
                    <div class="tax-subtitle">수입 거래 VAT 합계</div>
                </div>
                
                <div class="tax-summary-card purchase">
                    <div class="tax-card-header">
                        <span class="tax-icon">📝</span>
                        <span class="tax-title">매입세액</span>
                    </div>
                    <div class="tax-amount">${this.formatCurrency(this.taxCalculations.purchaseTax)}</div>
                    <div class="tax-subtitle">지출 거래 VAT 합계</div>
                </div>
                
                <div class="tax-summary-card payable ${this.taxCalculations.payableTax >= 0 ? 'positive' : 'negative'}">
                    <div class="tax-card-header">
                        <span class="tax-icon">${this.taxCalculations.payableTax >= 0 ? '📤' : '📥'}</span>
                        <span class="tax-title">${this.taxCalculations.payableTax >= 0 ? '납부세액' : '환급세액'}</span>
                    </div>
                    <div class="tax-amount">${this.formatCurrency(Math.abs(this.taxCalculations.payableTax))}</div>
                    <div class="tax-subtitle">${this.taxCalculations.payableTax >= 0 ? '납부할 세액' : '환급받을 세액'}</div>
                </div>
            </div>
            
            <div class="profit-summary">
                <div class="profit-item">
                    <span class="profit-label">총 매출</span>
                    <span class="profit-value income">${this.formatCurrency(this.taxCalculations.totalIncome)}</span>
                </div>
                <div class="profit-item">
                    <span class="profit-label">총 매입</span>
                    <span class="profit-value expense">${this.formatCurrency(this.taxCalculations.totalExpense)}</span>
                </div>
                <div class="profit-item main">
                    <span class="profit-label">순이익</span>
                    <span class="profit-value ${this.taxCalculations.netProfit >= 0 ? 'positive' : 'negative'}">
                        ${this.formatCurrency(this.taxCalculations.netProfit)}
                    </span>
                </div>
            </div>
        `;
    }
    
    // Checklist 탭 UI 업데이트 (스마트 자동화)
    updateChecklistTab() {
        const checklistContainer = document.querySelector('#checklist-section .checklist-smart');
        if (!checklistContainer) return;
        
        const hasData = this.allTransactions.length > 0;
        const hasCalculations = this.taxCalculations.payableTax !== 0;
        
        this.checklistStatus = {
            dataEntry: hasData,
            dataReview: hasData,
            taxCalculation: hasCalculations,
            finalCheck: this.progressValue >= 90
        };
        
        const checklistItems = [
            { key: 'dataEntry', title: '데이터 입력 완료', description: '거래 데이터를 입력했습니다' },
            { key: 'dataReview', title: '데이터 검토 완료', description: '입력된 데이터를 확인했습니다' },
            { key: 'taxCalculation', title: '세무 계산 완료', description: '세액 계산을 수행했습니다' },
            { key: 'finalCheck', title: '최종 확인 완료', description: '모든 절차를 완료했습니다' }
        ];
        
        checklistContainer.innerHTML = `
            <div class="smart-checklist">
                ${checklistItems.map(item => `
                    <div class="checklist-item ${this.checklistStatus[item.key] ? 'completed' : 'pending'}">
                        <div class="checklist-icon">
                            ${this.checklistStatus[item.key] ? '✅' : '⏳'}
                        </div>
                        <div class="checklist-content">
                            <div class="checklist-title">${item.title}</div>
                            <div class="checklist-description">${item.description}</div>
                        </div>
                        <div class="checklist-status">
                            ${this.checklistStatus[item.key] ? '완료' : '대기중'}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    // 전체 거래 보기
    showAllTransactions() {
        const modal = document.createElement('div');
        modal.className = 'transaction-modal';
        modal.innerHTML = `
            <div class="modal-backdrop" onclick="this.parentElement.remove()"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>전체 거래 목록</h3>
                    <button class="modal-close" onclick="this.closest('.transaction-modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    ${this.allTransactions.map(transaction => `
                        <div class="transaction-row ${transaction.source}">
                            <span class="transaction-date">${this.formatDate(transaction.date)}</span>
                            <span class="transaction-business">${transaction.businessName}</span>
                            <span class="transaction-amount ${transaction.type}">
                                ${transaction.type === 'income' ? '+' : '-'}${this.formatCurrency(transaction.amount)}
                            </span>
                            <span class="transaction-source">${transaction.source === 'direct' ? '직접입력' : 'CSV업로드'}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    // API 호출 헬퍼 메소드
    async apiCall(endpoint, options = {}) {
        try {
            const response = await fetch(endpoint, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API call failed:', error);
            throw error;
        }
    }
}

// 슬라이드 아웃 애니메이션 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .mr-2 { margin-right: 0.5rem; }
    .gap-4 { gap: 1rem; }
    
    .card.selected {
        border-color: #0064FF !important;
        background-color: rgba(0, 100, 255, 0.05) !important;
        transform: translateY(-2px);
    }
`;
document.head.appendChild(style);

// 앱 초기화 (DOM 로드 후)
document.addEventListener('DOMContentLoaded', () => {
    window.taxAI = new TaxAIApp();
    
    // PWA 지원
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered:', registration);
            })
            .catch(error => {
                console.log('SW registration failed:', error);
            });
    }
    
    console.log('🚀 YouArePlan TAX AI 초기화 완료');
});

// 전역 유틸리티 함수들
window.taxAIUtils = {
    formatCurrency: (amount) => {
        return new Intl.NumberFormat('ko-KR').format(amount) + '원';
    },
    
    formatDate: (date) => {
        return new Intl.DateTimeFormat('ko-KR').format(new Date(date));
    },
    
    debounce: (func, wait) => {
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
};