// 완전한 세무신고 길잡이 워크플로우 통합 모듈
// 전체 탭 데이터 통합 연동 및 워크플로우 가이드 시스템

// TaxAIApp 클래스 확장 - 워크플로우 통합 기능
TaxAIApp.prototype.initWorkflowIntegration = function() {
    console.log('🚀 세무신고 길잡이 워크플로우 초기화 중...');
    
    // 통합 데이터 관리 시스템 초기화
    this.initializeIntegratedDataSystem();
    
    // 프로그래스 가이드 시스템 초기화
    this.initializeProgressGuide();
    
    // 스마트 체크리스트 초기화
    this.initializeSmartChecklist();
    
    // 탭간 데이터 동기화 초기화
    this.initializeTabSynchronization();
    
    // 워크플로우 가이드 UI 초기화
    this.initializeWorkflowUI();
    
    console.log('✅ 세무신고 길잡이 워크플로우 준비 완료');
};

// 통합 데이터 관리 시스템
TaxAIApp.prototype.initializeIntegratedDataSystem = function() {
    // 통합 데이터 관리자
    this.dataManager = {
        // 전체 거래 데이터 통합
        getAllTransactions: () => {
            const directTransactions = this.directInputTransactions.map(t => ({
                ...t,
                source: 'direct',
                sourceIcon: '🖊️',
                sourceLabel: '직접입력'
            }));
            
            const uploadedTransactions = this.uploadedTransactions.map(t => ({
                ...t,
                source: 'csv',
                sourceIcon: '📁',
                sourceLabel: 'CSV업로드'
            }));
            
            return [...directTransactions, ...uploadedTransactions]
                .sort((a, b) => new Date(b.date) - new Date(a.date));
        },
        
        // 데이터 통계 계산
        getDataStats: () => {
            const allData = this.dataManager.getAllTransactions();
            return {
                total: allData.length,
                direct: this.directInputTransactions.length,
                uploaded: this.uploadedTransactions.length,
                totalAmount: allData.reduce((sum, t) => sum + (t.amount || 0), 0),
                recentEntries: allData.slice(0, 5)
            };
        },
        
        // 월별 데이터 그룹화
        getMonthlyData: () => {
            const allData = this.dataManager.getAllTransactions();
            const monthlyData = {};
            
            allData.forEach(transaction => {
                const month = transaction.date.substring(0, 7); // YYYY-MM
                if (!monthlyData[month]) {
                    monthlyData[month] = {
                        income: 0,
                        expense: 0,
                        count: 0,
                        transactions: []
                    };
                }
                
                const amount = transaction.amount || 0;
                if (amount > 0) {
                    monthlyData[month].income += amount;
                } else {
                    monthlyData[month].expense += Math.abs(amount);
                }
                monthlyData[month].count++;
                monthlyData[month].transactions.push(transaction);
            });
            
            return monthlyData;
        }
    };
};

// 프로그래스 가이드 시스템
TaxAIApp.prototype.initializeProgressGuide = function() {
    this.progressGuide = {
        steps: [
            {
                id: 'data_entry',
                title: '💼 거래 데이터 입력',
                description: '직접입력 또는 CSV 업로드로 거래 데이터를 입력하세요',
                targetTab: 'input',
                weight: 30,
                completed: false
            },
            {
                id: 'data_review',
                title: '📊 데이터 조회 및 검토',
                description: '입력된 거래 데이터를 확인하고 필요시 수정하세요',
                targetTab: 'view',
                weight: 20,
                completed: false
            },
            {
                id: 'tax_calculation',
                title: '🧮 세무 계산 확인',
                description: '자동 계산된 세액을 확인하고 시뮬레이션해보세요',
                targetTab: 'calculate',
                weight: 25,
                completed: false
            },
            {
                id: 'final_check',
                title: '✅ 최종 검토 및 제출 준비',
                description: '홈택스 제출을 위한 최종 검토를 완료하세요',
                targetTab: 'checklist',
                weight: 25,
                completed: false
            }
        ],
        
        getCurrentProgress: () => {
            const completedWeight = this.progressGuide.steps
                .filter(step => step.completed)
                .reduce((sum, step) => sum + step.weight, 0);
            return Math.min(completedWeight, 100);
        },
        
        getNextStep: () => {
            return this.progressGuide.steps.find(step => !step.completed);
        },
        
        completeStep: (stepId) => {
            const step = this.progressGuide.steps.find(s => s.id === stepId);
            if (step) {
                step.completed = true;
                this.updateProgressUI();
                this.showStepCompletionAnimation(step);
                
                // 다음 단계 활성화
                const nextStep = this.progressGuide.getNextStep();
                if (nextStep) {
                    this.showNextStepGuide(nextStep);
                } else {
                    this.showWorkflowCompletion();
                }
            }
        }
    };
};

// 스마트 체크리스트 시스템
TaxAIApp.prototype.initializeSmartChecklist = function() {
    this.smartChecklist = {
        autoCheckProgress: () => {
            // 데이터 입력 체크
            const hasData = this.dataManager.getAllTransactions().length > 0;
            if (hasData && !this.progressGuide.steps[0].completed) {
                this.progressGuide.completeStep('data_entry');
            }
            
            // 데이터 검토 체크 (조회 탭 방문 + 데이터 확인)
            const hasReviewedData = this.workflowState?.hasVisitedViewTab && hasData;
            if (hasReviewedData && !this.progressGuide.steps[1].completed) {
                this.progressGuide.completeStep('data_review');
            }
            
            // 세무 계산 체크
            const hasTaxCalculation = this.taxCalculations.totalIncome > 0 || this.taxCalculations.totalExpense > 0;
            if (hasTaxCalculation && !this.progressGuide.steps[2].completed) {
                this.progressGuide.completeStep('tax_calculation');
            }
        },
        
        getChecklistItems: () => {
            const stats = this.dataManager.getDataStats();
            const taxCalc = this.taxCalculations;
            
            return [
                {
                    id: 'data_input',
                    title: '거래 데이터 입력',
                    status: stats.total > 0 ? 'completed' : 'pending',
                    description: `총 ${stats.total}건의 거래 데이터`,
                    action: stats.total === 0 ? '직접입력 또는 CSV 업로드' : null
                },
                {
                    id: 'data_classification',
                    title: '분류 및 검토',
                    status: stats.total > 0 ? 'completed' : 'pending',
                    description: '자동 분류 완료',
                    action: stats.total === 0 ? '먼저 데이터를 입력해주세요' : null
                },
                {
                    id: 'tax_calculation',
                    title: '세액 계산',
                    status: (taxCalc.totalIncome > 0 || taxCalc.totalExpense > 0) ? 'completed' : 'pending',
                    description: `매출세액: ₩${taxCalc.salesTax.toLocaleString()}`,
                    action: null
                },
                {
                    id: 'final_review',
                    title: '최종 검토',
                    status: this.workflowState?.finalReviewComplete ? 'completed' : 'warning',
                    description: '홈택스 제출 전 최종 검토',
                    action: '아래 홈택스 제출 가이드 확인'
                }
            ];
        }
    };
};

// 탭간 데이터 동기화
TaxAIApp.prototype.initializeTabSynchronization = function() {
    // 워크플로우 상태 관리
    this.workflowState = {
        hasVisitedViewTab: false,
        hasVisitedCalculateTab: false,
        hasVisitedChecklistTab: false,
        finalReviewComplete: false
    };
    
    // 기존 탭 전환 함수 확장
    const originalSwitchTab = this.switchTab.bind(this);
    this.switchTab = function(tabId) {
        // 원래 탭 전환 실행
        originalSwitchTab(tabId);
        
        // 워크플로우 상태 업데이트
        this.updateWorkflowState(tabId);
        
        // 탭별 데이터 동기화
        this.syncTabData(tabId);
        
        // 진행률 자동 체크
        this.smartChecklist.autoCheckProgress();
    };
};

// 워크플로우 상태 업데이트
TaxAIApp.prototype.updateWorkflowState = function(tabId) {
    switch(tabId) {
        case 'view':
            this.workflowState.hasVisitedViewTab = true;
            break;
        case 'calculate':
            this.workflowState.hasVisitedCalculateTab = true;
            break;
        case 'checklist':
            this.workflowState.hasVisitedChecklistTab = true;
            break;
    }
    
    // 가이드 메시지 표시
    this.showTabGuideMessage(tabId);
};

// 탭별 데이터 동기화
TaxAIApp.prototype.syncTabData = function(tabId) {
    switch(tabId) {
        case 'view':
            this.updateIntegratedTransactionView();
            break;
        case 'calculate':
            this.updateRealTimeTaxDashboard();
            break;
        case 'checklist':
            this.updateSmartChecklistView();
            break;
    }
};

// 통합 거래 데이터 뷰 업데이트
TaxAIApp.prototype.updateIntegratedTransactionView = function() {
    const allTransactions = this.dataManager.getAllTransactions();
    const container = document.getElementById('recent-transactions-list');
    
    if (!container) return;
    
    if (allTransactions.length === 0) {
        container.innerHTML = `
            <div class="no-data-state">
                <div class="no-data-icon">📊</div>
                <h3>아직 거래 데이터가 없습니다</h3>
                <p>직접입력 탭에서 거래를 입력하거나<br>CSV 파일을 업로드해보세요</p>
                <button class="btn btn-primary" onclick="taxAI.switchTab('input')">
                    직접입력하기
                </button>
            </div>
        `;
        return;
    }
    
    // 통합 테이블 렌더링
    container.innerHTML = `
        <div class="integrated-transactions-header">
            <h3>💼 전체 거래 데이터 (${allTransactions.length}건)</h3>
            <div class="data-source-legend">
                <span class="source-item">
                    <span class="source-icon">🖊️</span>
                    직접입력 (${this.directInputTransactions.length}건)
                </span>
                <span class="source-item">
                    <span class="source-icon">📁</span>
                    CSV업로드 (${this.uploadedTransactions.length}건)
                </span>
            </div>
        </div>
        
        <div class="integrated-transaction-table">
            ${this.renderIntegratedTransactionTable(allTransactions)}
        </div>
        
        <div class="transaction-summary-cards">
            ${this.renderTransactionSummaryCards()}
        </div>
    `;
};

// 통합 거래 테이블 렌더링
TaxAIApp.prototype.renderIntegratedTransactionTable = function(transactions) {
    return `
        <div class="table-responsive">
            <table class="integrated-table">
                <thead>
                    <tr>
                        <th>소스</th>
                        <th>날짜</th>
                        <th>거래처</th>
                        <th>구분</th>
                        <th>금액</th>
                        <th>부가세</th>
                        <th>메모</th>
                        <th>작업</th>
                    </tr>
                </thead>
                <tbody>
                    ${transactions.slice(0, 20).map(transaction => `
                        <tr class="transaction-row ${transaction.source}">
                            <td>
                                <span class="source-badge ${transaction.source}">
                                    ${transaction.sourceIcon} ${transaction.sourceLabel}
                                </span>
                            </td>
                            <td>${transaction.date}</td>
                            <td class="vendor-name">${transaction.businessName}</td>
                            <td>
                                <span class="type-badge ${transaction.type}">
                                    ${transaction.type === 'income' ? '매출' : '매입'}
                                </span>
                            </td>
                            <td class="amount ${transaction.type}">
                                ₩${Math.abs(transaction.amount).toLocaleString()}
                            </td>
                            <td class="vat-amount">
                                ₩${Math.abs(transaction.vatAmount || 0).toLocaleString()}
                            </td>
                            <td class="memo">${transaction.memo || '-'}</td>
                            <td class="actions">
                                ${transaction.source === 'direct' ? `
                                    <button class="btn-icon edit" onclick="taxAI.editTransaction('${transaction.id}')" title="수정">
                                        ✏️
                                    </button>
                                    <button class="btn-icon delete" onclick="taxAI.deleteTransaction('${transaction.id}')" title="삭제">
                                        🗑️
                                    </button>
                                ` : `
                                    <span class="no-action">-</span>
                                `}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        
        ${transactions.length > 20 ? `
            <div class="pagination-container">
                <p>총 ${transactions.length}건 중 20건 표시</p>
                <button class="btn btn-outline">더 보기</button>
            </div>
        ` : ''}
    `;
};

// 거래 요약 카드 렌더링
TaxAIApp.prototype.renderTransactionSummaryCards = function() {
    const stats = this.dataManager.getDataStats();
    const monthlyData = this.dataManager.getMonthlyData();
    const thisMonth = new Date().toISOString().substring(0, 7);
    const thisMonthData = monthlyData[thisMonth] || { income: 0, expense: 0, count: 0 };
    
    return `
        <div class="summary-cards-grid">
            <div class="summary-card total">
                <div class="card-header">
                    <span class="card-icon">📊</span>
                    <span class="card-title">전체 데이터</span>
                </div>
                <div class="card-value">${stats.total}건</div>
                <div class="card-subtitle">
                    직접입력 ${stats.direct}건 | CSV ${stats.uploaded}건
                </div>
            </div>
            
            <div class="summary-card income">
                <div class="card-header">
                    <span class="card-icon">💰</span>
                    <span class="card-title">이번 달 매출</span>
                </div>
                <div class="card-value">₩${thisMonthData.income.toLocaleString()}</div>
                <div class="card-subtitle">${thisMonthData.count}건</div>
            </div>
            
            <div class="summary-card expense">
                <div class="card-header">
                    <span class="card-icon">💸</span>
                    <span class="card-title">이번 달 매입</span>
                </div>
                <div class="card-value">₩${thisMonthData.expense.toLocaleString()}</div>
                <div class="card-subtitle">지출 내역</div>
            </div>
            
            <div class="summary-card profit">
                <div class="card-header">
                    <span class="card-icon">📈</span>
                    <span class="card-title">이번 달 순이익</span>
                </div>
                <div class="card-value">₩${(thisMonthData.income - thisMonthData.expense).toLocaleString()}</div>
                <div class="card-subtitle">${thisMonthData.income > thisMonthData.expense ? '흑자' : '적자'}</div>
            </div>
        </div>
    `;
};

// 워크플로우 UI 초기화
TaxAIApp.prototype.initializeWorkflowUI = function() {
    // 프로그래스 바 업데이트
    this.updateProgressUI();
    
    // 각 탭에 가이드 메시지 추가
    this.addTabGuideMessages();
    
    // 다음 단계 버튼 초기화
    this.initializeNextStepButtons();
};

// 프로그래스 UI 업데이트
TaxAIApp.prototype.updateProgressUI = function() {
    const progress = this.progressGuide.getCurrentProgress();
    const progressBar = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');
    
    if (progressBar) {
        progressBar.style.width = `${progress}%`;
    }
    
    if (progressText) {
        progressText.textContent = `${progress}% 완료`;
    }
    
    // 프로그래스 상태에 따른 메시지
    this.updateProgressMessage(progress);
};

// 진행률 메시지 업데이트
TaxAIApp.prototype.updateProgressMessage = function(progress) {
    const messageElement = document.querySelector('.progress-message');
    if (!messageElement) return;
    
    let message = '';
    let icon = '';
    
    if (progress === 0) {
        icon = '🚀';
        message = '세무신고 준비를 시작해보세요!';
    } else if (progress < 30) {
        icon = '📝';
        message = '거래 데이터를 입력하고 있습니다...';
    } else if (progress < 50) {
        icon = '👀';
        message = '데이터를 검토하고 확인하세요';
    } else if (progress < 75) {
        icon = '🧮';
        message = '세무 계산이 진행 중입니다';
    } else if (progress < 100) {
        icon = '✅';
        message = '거의 완료! 최종 검토를 해주세요';
    } else {
        icon = '🎉';
        message = '모든 준비가 완료되었습니다!';
    }
    
    messageElement.innerHTML = `${icon} ${message}`;
};

// 단계 완료 애니메이션
TaxAIApp.prototype.showStepCompletionAnimation = function(step) {
    // 토스 스타일 성취 애니메이션
    const achievement = document.createElement('div');
    achievement.className = 'achievement-popup';
    achievement.innerHTML = `
        <div class="achievement-content">
            <div class="achievement-icon">🎉</div>
            <h3>${step.title} 완료!</h3>
            <p>${step.description}</p>
        </div>
    `;
    
    document.body.appendChild(achievement);
    
    // 애니메이션 후 제거
    setTimeout(() => {
        if (achievement.parentNode) {
            achievement.parentNode.removeChild(achievement);
        }
    }, 3000);
    
    // 햅틱 피드백
    if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
    }
};

// 다음 단계 가이드 표시
TaxAIApp.prototype.showNextStepGuide = function(nextStep) {
    this.showToast(
        `다음 단계: ${nextStep.title}`, 
        'info', 
        5000,
        () => this.switchTab(nextStep.targetTab)
    );
};

// 워크플로우 완료 표시
TaxAIApp.prototype.showWorkflowCompletion = function() {
    const completionModal = document.createElement('div');
    completionModal.className = 'completion-modal';
    completionModal.innerHTML = `
        <div class="completion-content">
            <div class="completion-icon">🏆</div>
            <h2>세무신고 준비 완료!</h2>
            <p>모든 단계가 완료되었습니다.<br>이제 홈택스에서 신고를 진행하세요.</p>
            <div class="completion-stats">
                <div class="stat-item">
                    <span class="stat-label">총 거래</span>
                    <span class="stat-value">${this.dataManager.getDataStats().total}건</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">납부세액</span>
                    <span class="stat-value">₩${this.taxCalculations.payableTax.toLocaleString()}</span>
                </div>
            </div>
            <button class="btn btn-primary" onclick="this.parentNode.parentNode.remove()">
                확인
            </button>
        </div>
    `;
    
    document.body.appendChild(completionModal);
};

// 탭 가이드 메시지 표시
TaxAIApp.prototype.showTabGuideMessage = function(tabId) {
    const messages = {
        'input': '💼 거래 데이터를 입력하거나 CSV 파일을 업로드하세요',
        'view': '📊 입력된 모든 거래 데이터를 확인하고 필요시 수정하세요',
        'calculate': '🧮 실시간으로 계산된 세액을 확인하고 시뮬레이션해보세요',
        'checklist': '✅ 홈택스 제출을 위한 최종 검토를 완료하세요'
    };
    
    const message = messages[tabId];
    if (message) {
        this.showToast(message, 'info', 3000);
    }
};

// 앱 초기화 시 워크플로우 통합 기능 자동 시작
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.taxAI && typeof window.taxAI.initWorkflowIntegration === 'function') {
            window.taxAI.initWorkflowIntegration();
            console.log('🎯 세무신고 길잡이 워크플로우 통합 완료');
        }
    }, 1500);
});