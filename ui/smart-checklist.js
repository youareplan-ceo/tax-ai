// 스마트 체크리스트 및 홈택스 제출 준비 가이드 모듈
// 자동 진행률 체크 및 단계별 안내

// TaxAIApp 클래스 확장 - 스마트 체크리스트
TaxAIApp.prototype.initSmartChecklistTab = function() {
    console.log('✅ 스마트 체크리스트 탭 초기화 중...');
    
    this.checklistManager = {
        // 체크리스트 항목 정의
        items: [
            {
                id: 'data_input',
                category: 'preparation',
                title: '거래 데이터 입력',
                description: '직접입력 또는 CSV 업로드로 거래 데이터 준비',
                icon: '💼',
                weight: 30,
                autoCheck: true,
                checkFunction: () => this.dataManager.getDataStats().total > 0
            },
            {
                id: 'data_verification',
                category: 'preparation', 
                title: '데이터 검증 및 분류',
                description: '입력된 거래 데이터의 정확성 확인',
                icon: '🔍',
                weight: 15,
                autoCheck: true,
                checkFunction: () => this.workflowState?.hasVisitedViewTab && this.dataManager.getDataStats().total > 0
            },
            {
                id: 'tax_calculation',
                category: 'calculation',
                title: '세액 계산 완료',
                description: '매출세액, 매입세액, 납부세액 자동 계산',
                icon: '🧮',
                weight: 20,
                autoCheck: true,
                checkFunction: () => this.taxCalculations.totalIncome > 0 || this.taxCalculations.totalExpense > 0
            },
            {
                id: 'amount_verification',
                category: 'calculation',
                title: '금액 검증',
                description: '계산된 세액의 적정성 검토',
                icon: '💰',
                weight: 10,
                autoCheck: false,
                manualCheck: true
            },
            {
                id: 'document_preparation',
                category: 'submission',
                title: '제출 서류 준비',
                description: '홈택스 신고를 위한 필수 서류 및 정보 준비',
                icon: '📋',
                weight: 15,
                autoCheck: false,
                manualCheck: true
            },
            {
                id: 'final_review',
                category: 'submission',
                title: '최종 검토',
                description: '모든 정보의 정확성 최종 확인',
                icon: '✅',
                weight: 10,
                autoCheck: false,
                manualCheck: true
            }
        ],
        
        // 수동 체크 상태
        manualChecks: {},
        
        // 전체 진행률 계산
        getOverallProgress: () => {
            const completedWeight = this.checklistManager.items
                .filter(item => this.checklistManager.isItemCompleted(item))
                .reduce((sum, item) => sum + item.weight, 0);
            return Math.min(completedWeight, 100);
        },
        
        // 항목 완료 여부 확인
        isItemCompleted: (item) => {
            if (item.autoCheck) {
                return item.checkFunction();
            } else if (item.manualCheck) {
                return this.checklistManager.manualChecks[item.id] || false;
            }
            return false;
        },
        
        // 수동 체크 토글
        toggleManualCheck: (itemId) => {
            this.checklistManager.manualChecks[itemId] = !this.checklistManager.manualChecks[itemId];
            this.updateSmartChecklistView();
            this.updateProgressUI();
        }
    };
    
    this.hometaxGuide = {
        // 홈택스 제출 단계
        steps: [
            {
                step: 1,
                title: '홈택스 접속 및 로그인',
                description: '국세청 홈택스 웹사이트에 접속하여 공동인증서 또는 간편인증으로 로그인',
                url: 'https://hometax.go.kr',
                icon: '🏛️',
                tips: ['공동인증서가 없다면 간편인증(카카오페이, 네이버페이 등)을 이용하세요', '로그인 전 팝업 차단을 해제해주세요']
            },
            {
                step: 2,
                title: '부가가치세 신고 메뉴 선택',
                description: '신고/납부 > 부가가치세 > 정기신고 선택',
                icon: '📋',
                tips: ['법인사업자는 법인 메뉴를, 개인사업자는 개인 메뉴를 선택하세요', '신고기한을 반드시 확인하세요']
            },
            {
                step: 3,
                title: '기본정보 확인',
                description: '사업자등록번호, 상호명, 신고기간 등 기본정보 확인',
                icon: '📝',
                tips: ['정보가 틀렸다면 세무서에 문의하세요', '신고기간이 올바른지 반드시 확인하세요']
            },
            {
                step: 4,
                title: '매출세액 입력',
                description: '계산된 매출세액을 해당 항목에 입력',
                icon: '💰',
                tips: ['소수점은 버림 처리됩니다', '계산기를 사용하여 정확한 금액을 입력하세요']
            },
            {
                step: 5,
                title: '매입세액 입력',
                description: '계산된 매입세액을 해당 항목에 입력',
                icon: '💸',
                tips: ['공제받을 수 있는 매입세액만 입력하세요', '영수증과 계산서가 있는 항목만 공제 가능합니다']
            },
            {
                step: 6,
                title: '납부세액 확인',
                description: '자동으로 계산된 납부세액 확인',
                icon: '🧾',
                tips: ['환급세액이 나올 경우 환급 계좌를 확인하세요', '납부세액이 있다면 납부 방법을 미리 준비하세요']
            },
            {
                step: 7,
                title: '신고서 제출',
                description: '모든 정보 확인 후 최종 제출',
                icon: '✅',
                tips: ['제출 전 반드시 모든 항목을 재검토하세요', '제출 후에는 수정이 어려우니 신중하게 확인하세요']
            }
        ]
    };
};

// 스마트 체크리스트 뷰 업데이트
TaxAIApp.prototype.updateSmartChecklistView = function() {
    const container = document.getElementById('checklist-content');
    if (!container) return;
    
    container.innerHTML = `
        <div class="smart-checklist-header">
            <h2>✅ 세무신고 준비 체크리스트</h2>
            <div class="checklist-progress">
                <div class="progress-info">
                    <span class="progress-label">전체 진행률</span>
                    <span class="progress-percentage">${this.checklistManager.getOverallProgress()}%</span>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar-bg">
                        <div class="progress-bar-fill" style="width: ${this.checklistManager.getOverallProgress()}%"></div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="checklist-categories">
            ${this.renderChecklistCategories()}
        </div>
        
        <div class="completion-status">
            ${this.renderCompletionStatus()}
        </div>
        
        <div class="hometax-guide-section">
            ${this.renderHomeTaxGuide()}
        </div>
        
        <div class="final-actions">
            ${this.renderFinalActions()}
        </div>
    `;
};

// 체크리스트 카테고리 렌더링
TaxAIApp.prototype.renderChecklistCategories = function() {
    const categories = {
        preparation: { title: '📋 데이터 준비', color: 'blue' },
        calculation: { title: '🧮 세액 계산', color: 'green' },
        submission: { title: '📤 제출 준비', color: 'purple' }
    };
    
    return Object.entries(categories).map(([categoryId, category]) => {
        const categoryItems = this.checklistManager.items.filter(item => item.category === categoryId);
        const completedItems = categoryItems.filter(item => this.checklistManager.isItemCompleted(item));
        const progress = categoryItems.length > 0 ? (completedItems.length / categoryItems.length) * 100 : 0;
        
        return `
            <div class="checklist-category ${category.color}">
                <div class="category-header">
                    <h3>${category.title}</h3>
                    <div class="category-progress">
                        <span>${completedItems.length}/${categoryItems.length}</span>
                        <div class="mini-progress">
                            <div class="mini-progress-fill" style="width: ${progress}%"></div>
                        </div>
                    </div>
                </div>
                
                <div class="category-items">
                    ${categoryItems.map(item => this.renderChecklistItem(item)).join('')}
                </div>
            </div>
        `;
    }).join('');
};

// 체크리스트 항목 렌더링
TaxAIApp.prototype.renderChecklistItem = function(item) {
    const isCompleted = this.checklistManager.isItemCompleted(item);
    const canToggle = item.manualCheck;
    
    return `
        <div class="checklist-item ${isCompleted ? 'completed' : ''} ${canToggle ? 'toggleable' : ''}"
             ${canToggle ? `onclick="taxAI.checklistManager.toggleManualCheck('${item.id}')"` : ''}>
            <div class="item-icon">${item.icon}</div>
            <div class="item-content">
                <div class="item-title">${item.title}</div>
                <div class="item-description">${item.description}</div>
                ${this.renderItemDetails(item)}
            </div>
            <div class="item-status">
                ${isCompleted ? '✅' : (item.autoCheck ? '⏳' : '⭕')}
            </div>
        </div>
    `;
};

// 항목 세부 정보 렌더링
TaxAIApp.prototype.renderItemDetails = function(item) {
    switch(item.id) {
        case 'data_input':
            const stats = this.dataManager.getDataStats();
            return `<div class="item-stats">총 ${stats.total}건 (직접입력: ${stats.direct}건, CSV: ${stats.uploaded}건)</div>`;
            
        case 'tax_calculation':
            const calc = this.taxCalculations;
            return `<div class="item-stats">납부세액: ₩${calc.payableTax.toLocaleString()}</div>`;
            
        case 'amount_verification':
            return `<div class="item-help">💡 세액이 예상 범위 내에 있는지 확인하세요</div>`;
            
        case 'document_preparation':
            return `<div class="item-help">📄 사업자등록증, 공동인증서, 거래명세서 등</div>`;
            
        default:
            return '';
    }
};

// 완료 상태 렌더링
TaxAIApp.prototype.renderCompletionStatus = function() {
    const progress = this.checklistManager.getOverallProgress();
    
    if (progress === 100) {
        return `
            <div class="completion-status success">
                <div class="status-icon">🎉</div>
                <div class="status-content">
                    <h3>모든 준비가 완료되었습니다!</h3>
                    <p>이제 홈택스에서 부가가치세 신고를 진행하세요.</p>
                </div>
                <button class="btn btn-primary" onclick="window.open('https://hometax.go.kr', '_blank')">
                    홈택스 바로가기
                </button>
            </div>
        `;
    } else if (progress >= 70) {
        return `
            <div class="completion-status warning">
                <div class="status-icon">⚠️</div>
                <div class="status-content">
                    <h3>거의 완료되었습니다</h3>
                    <p>남은 항목들을 완료하고 최종 검토를 진행하세요.</p>
                </div>
            </div>
        `;
    } else {
        const nextItem = this.checklistManager.items.find(item => !this.checklistManager.isItemCompleted(item));
        return `
            <div class="completion-status info">
                <div class="status-icon">📝</div>
                <div class="status-content">
                    <h3>진행 중입니다</h3>
                    <p>다음 단계: ${nextItem ? nextItem.title : '완료'}</p>
                </div>
            </div>
        `;
    }
};

// 홈택스 가이드 렌더링
TaxAIApp.prototype.renderHomeTaxGuide = function() {
    return `
        <div class="hometax-guide">
            <div class="guide-header">
                <h3>🏛️ 홈택스 신고 단계별 가이드</h3>
                <p>아래 단계를 따라 홈택스에서 부가가치세 신고를 완료하세요</p>
            </div>
            
            <div class="guide-steps">
                ${this.hometaxGuide.steps.map(step => this.renderGuideStep(step)).join('')}
            </div>
            
            <div class="tax-data-reference">
                <h4>📊 입력 참조 데이터</h4>
                <div class="reference-cards">
                    <div class="reference-card sales">
                        <div class="card-title">매출세액</div>
                        <div class="card-value">₩${this.taxCalculations.salesTax.toLocaleString()}</div>
                        <div class="card-code">홈택스 입력란: 매출세액</div>
                        <button class="btn-copy-sm" onclick="taxAI.copyToClipboard('${this.taxCalculations.salesTax}')">복사</button>
                    </div>
                    
                    <div class="reference-card purchase">
                        <div class="card-title">매입세액</div>
                        <div class="card-value">₩${this.taxCalculations.purchaseTax.toLocaleString()}</div>
                        <div class="card-code">홈택스 입력란: 매입세액</div>
                        <button class="btn-copy-sm" onclick="taxAI.copyToClipboard('${this.taxCalculations.purchaseTax}')">복사</button>
                    </div>
                    
                    <div class="reference-card payable highlight">
                        <div class="card-title">납부세액</div>
                        <div class="card-value">₩${this.taxCalculations.payableTax.toLocaleString()}</div>
                        <div class="card-code">홈택스 자동 계산</div>
                        <button class="btn-copy-sm" onclick="taxAI.copyToClipboard('${this.taxCalculations.payableTax}')">복사</button>
                    </div>
                </div>
            </div>
        </div>
    `;
};

// 가이드 단계 렌더링
TaxAIApp.prototype.renderGuideStep = function(step) {
    return `
        <div class="guide-step">
            <div class="step-number">${step.step}</div>
            <div class="step-content">
                <div class="step-header">
                    <span class="step-icon">${step.icon}</span>
                    <h4>${step.title}</h4>
                </div>
                <p>${step.description}</p>
                ${step.tips && step.tips.length > 0 ? `
                    <div class="step-tips">
                        <strong>💡 팁:</strong>
                        <ul>
                            ${step.tips.map(tip => `<li>${tip}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                ${step.url ? `
                    <div class="step-action">
                        <button class="btn btn-outline btn-sm" onclick="window.open('${step.url}', '_blank')">
                            바로가기
                        </button>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
};

// 최종 액션 렌더링
TaxAIApp.prototype.renderFinalActions = function() {
    const progress = this.checklistManager.getOverallProgress();
    const canSubmit = progress === 100;
    
    return `
        <div class="final-actions-container">
            <h3>🚀 최종 단계</h3>
            
            <div class="action-buttons">
                <button class="btn btn-outline" onclick="taxAI.downloadTaxSummary()">
                    📄 세무 요약서 다운로드
                </button>
                
                <button class="btn btn-outline" onclick="taxAI.printChecklist()">
                    🖨️ 체크리스트 인쇄
                </button>
                
                <button class="btn ${canSubmit ? 'btn-primary' : 'btn-disabled'}" 
                        ${canSubmit ? "onclick=\"window.open('https://hometax.go.kr', '_blank')\"" : 'disabled'}>
                    🏛️ 홈택스에서 신고하기
                </button>
            </div>
            
            ${!canSubmit ? `
                <div class="submit-warning">
                    ⚠️ 모든 체크리스트 항목을 완료한 후 신고를 진행하세요
                </div>
            ` : `
                <div class="submit-ready">
                    ✅ 신고 준비가 완료되었습니다!
                </div>
            `}
            
            <div class="emergency-contact">
                <h4>❓ 도움이 필요하세요?</h4>
                <p>국세청 상담센터: 126 (평일 09:00~17:00)</p>
                <p>홈택스 기술지원: 1588-0060</p>
            </div>
        </div>
    `;
};

// 체크리스트 인쇄
TaxAIApp.prototype.printChecklist = function() {
    const printContent = `
        <div style="padding: 20px; font-family: Arial, sans-serif;">
            <h1>세무신고 준비 체크리스트</h1>
            <p>생성일: ${new Date().toLocaleDateString()}</p>
            
            <h2>진행 상황</h2>
            <p>전체 진행률: ${this.checklistManager.getOverallProgress()}%</p>
            
            <h2>체크리스트 항목</h2>
            ${this.checklistManager.items.map(item => `
                <div style="margin: 10px 0; padding: 10px; border: 1px solid #ddd;">
                    <strong>${item.icon} ${item.title}</strong> 
                    ${this.checklistManager.isItemCompleted(item) ? '✅ 완료' : '⭕ 미완료'}
                    <br>
                    <small>${item.description}</small>
                </div>
            `).join('')}
            
            <h2>세액 정보</h2>
            <table style="border-collapse: collapse; width: 100%;">
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">매출세액</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">₩${this.taxCalculations.salesTax.toLocaleString()}</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">매입세액</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">₩${this.taxCalculations.purchaseTax.toLocaleString()}</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">납부세액</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">₩${this.taxCalculations.payableTax.toLocaleString()}</td>
                </tr>
            </table>
        </div>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
};

// 자동 체크리스트 업데이트 (탭 전환 시 호출)
TaxAIApp.prototype.autoUpdateChecklist = function() {
    // 자동 체크 항목들 업데이트
    this.checklistManager.items.forEach(item => {
        if (item.autoCheck && item.checkFunction()) {
            // 완료 상태 변경 시 애니메이션 효과
            const wasCompleted = this.checklistManager.isItemCompleted(item);
            if (!wasCompleted) {
                setTimeout(() => this.showChecklistItemCompletion(item), 500);
            }
        }
    });
    
    // 뷰 업데이트
    if (this.currentTab === 'checklist') {
        this.updateSmartChecklistView();
    }
};

// 체크리스트 항목 완료 애니메이션
TaxAIApp.prototype.showChecklistItemCompletion = function(item) {
    this.showToast(`${item.icon} ${item.title} 완료!`, 'success', 3000);
    
    // 햅틱 피드백
    if (navigator.vibrate) {
        navigator.vibrate(100);
    }
};