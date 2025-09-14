// 세무 신고 가이드 모듈
// 홈택스 단계별 신고 가이드 제공

// TaxAIApp 클래스 확장 - 세무 신고 가이드
TaxAIApp.prototype.initTaxGuide = function() {
    console.log('📖 세무 신고 가이드 초기화 중...');

    // 가이드 탭 클릭 시 초기화
    this.bindGuideEvents();
    this.loadGuideContent('vat'); // 기본값: 부가가치세
};

// 가이드 이벤트 바인딩
TaxAIApp.prototype.bindGuideEvents = function() {
    // 세금 종류 선택 이벤트
    document.addEventListener('click', (e) => {
        if (e.target.closest('.tax-type-card')) {
            const card = e.target.closest('.tax-type-card');
            const taxType = card.dataset.taxType;

            // 활성 상태 변경
            document.querySelectorAll('.tax-type-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');

            // 가이드 콘텐츠 로드
            this.loadGuideContent(taxType);
        }

        // 값 복사 버튼 이벤트
        if (e.target.closest('.copy-value-btn')) {
            const btn = e.target.closest('.copy-value-btn');
            const value = btn.dataset.value;
            this.copyToClipboard(value);
        }

        // 단계별 네비게이션
        if (e.target.closest('.step-nav-btn')) {
            const btn = e.target.closest('.step-nav-btn');
            const stepIndex = parseInt(btn.dataset.step);
            this.navigateToStep(stepIndex);
        }
    });
};

// 가이드 콘텐츠 로드
TaxAIApp.prototype.loadGuideContent = function(taxType) {
    const guideContent = document.getElementById('guide-content');
    if (!guideContent) return;

    switch (taxType) {
        case 'vat':
            guideContent.innerHTML = this.renderVATGuide();
            break;
        case 'income':
            guideContent.innerHTML = this.renderIncomeGuide();
            break;
        case 'year-end':
            guideContent.innerHTML = this.renderYearEndGuide();
            break;
        default:
            guideContent.innerHTML = this.renderVATGuide();
    }

    // 가이드 로드 후 스크롤을 맨 위로
    setTimeout(() => {
        const guideSection = document.getElementById('guide-section');
        if (guideSection) {
            guideSection.scrollTop = 0;
        }
    }, 100);
};

// 부가가치세 신고 가이드
TaxAIApp.prototype.renderVATGuide = function() {
    const calc = this.taxCalculations;

    return `
        <div class="guide-wrapper">
            <div class="guide-header">
                <h3>💰 부가가치세 신고 가이드</h3>
                <div class="guide-summary">
                    현재 계산된 값을 홈택스에 입력하여 부가가치세 신고를 완료하세요.
                </div>
            </div>

            <!-- 계산 값 요약 -->
            <div class="calculated-values">
                <h4>📊 입력할 계산 값</h4>
                <div class="value-cards">
                    <div class="value-card">
                        <div class="value-label">매출세액</div>
                        <div class="value-amount">${calc.salesTax.toLocaleString()}원</div>
                        <button class="copy-value-btn" data-value="${calc.salesTax}" title="값 복사">
                            📋 복사
                        </button>
                    </div>
                    <div class="value-card">
                        <div class="value-label">매입세액</div>
                        <div class="value-amount">${calc.purchaseTax.toLocaleString()}원</div>
                        <button class="copy-value-btn" data-value="${calc.purchaseTax}" title="값 복사">
                            📋 복사
                        </button>
                    </div>
                    <div class="value-card highlight">
                        <div class="value-label">납부(환급)세액</div>
                        <div class="value-amount">${calc.payableTax.toLocaleString()}원</div>
                        <button class="copy-value-btn" data-value="${calc.payableTax}" title="값 복사">
                            📋 복사
                        </button>
                    </div>
                </div>
            </div>

            <!-- 단계별 가이드 -->
            <div class="step-guide">
                <h4>📋 홈택스 신고 단계</h4>
                <div class="guide-steps">
                    ${this.renderVATSteps()}
                </div>
            </div>

            <!-- 홈택스 바로가기 -->
            <div class="guide-actions">
                <button class="btn btn-primary" onclick="window.open('https://hometax.go.kr', '_blank')">
                    🌐 홈택스 바로가기
                </button>
                <button class="btn btn-outline" onclick="taxAI.downloadVATGuide()">
                    📄 가이드 다운로드
                </button>
            </div>
        </div>
    `;
};

// 부가가치세 신고 단계들
TaxAIApp.prototype.renderVATSteps = function() {
    const steps = [
        {
            title: "홈택스 접속 및 로그인",
            description: "국세청 홈택스(hometax.go.kr)에 접속하여 공동인증서 또는 간편인증으로 로그인합니다.",
            screenshot: "/assets/screenshots/hometax-login.png",
            tips: ["공동인증서가 없다면 간편인증을 이용하세요", "사업자등록증이 준비되어 있는지 확인하세요"]
        },
        {
            title: "신고/납부 > 부가가치세 선택",
            description: "메인 메뉴에서 '신고/납부' → '부가가치세'를 선택합니다.",
            screenshot: "/assets/screenshots/vat-menu.png",
            tips: ["정기신고를 선택하세요", "신고기간을 확인하세요"]
        },
        {
            title: "매출세액 입력",
            description: "계산된 매출세액을 해당 필드에 입력합니다.",
            inputField: "sales_tax",
            value: this.taxCalculations.salesTax,
            screenshot: "/assets/screenshots/sales-tax-input.png",
            tips: ["콤마 없이 숫자만 입력하세요", "복사 버튼을 활용하세요"]
        },
        {
            title: "매입세액 입력",
            description: "계산된 매입세액을 해당 필드에 입력합니다.",
            inputField: "purchase_tax",
            value: this.taxCalculations.purchaseTax,
            screenshot: "/assets/screenshots/purchase-tax-input.png",
            tips: ["영수증과 세금계산서 기준으로 계산된 값입니다"]
        },
        {
            title: "납부세액 확인 및 제출",
            description: "시스템에서 자동 계산된 납부세액을 확인하고 신고서를 제출합니다.",
            value: this.taxCalculations.payableTax,
            screenshot: "/assets/screenshots/final-submit.png",
            tips: ["제출 전 모든 항목을 다시 한번 확인하세요", "납부세액이 음수면 환급 대상입니다"]
        }
    ];

    return steps.map((step, index) => `
        <div class="guide-step" data-step="${index + 1}">
            <div class="step-number">${index + 1}</div>
            <div class="step-content">
                <h5 class="step-title">${step.title}</h5>
                <p class="step-description">${step.description}</p>

                ${step.value ? `
                    <div class="step-value">
                        <span class="step-value-label">입력값:</span>
                        <span class="step-value-amount">${step.value.toLocaleString()}원</span>
                        <button class="copy-value-btn btn-sm" data-value="${step.value}">복사</button>
                    </div>
                ` : ''}

                ${step.screenshot ? `
                    <div class="step-screenshot">
                        <img src="${step.screenshot}" alt="${step.title} 스크린샷" loading="lazy">
                    </div>
                ` : ''}

                ${step.tips ? `
                    <div class="step-tips">
                        <strong>💡 팁:</strong>
                        <ul>
                            ${step.tips.map(tip => `<li>${tip}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('');
};

// 종합소득세 신고 가이드
TaxAIApp.prototype.renderIncomeGuide = function() {
    return `
        <div class="guide-wrapper">
            <div class="guide-header">
                <h3>📊 종합소득세 신고 가이드</h3>
                <div class="guide-summary">
                    개인사업자의 연간 소득에 대한 종합소득세 신고 절차를 안내합니다.
                </div>
            </div>

            <!-- 준비 사항 -->
            <div class="guide-preparation">
                <h4>📋 준비 사항</h4>
                <div class="preparation-list">
                    <div class="prep-item">
                        <span class="prep-icon">📄</span>
                        <div class="prep-content">
                            <div class="prep-title">소득금액증명원</div>
                            <div class="prep-description">국세청에서 발급받은 연간 소득 증명</div>
                        </div>
                    </div>
                    <div class="prep-item">
                        <span class="prep-icon">💸</span>
                        <div class="prep-content">
                            <div class="prep-title">필요경비 증빙서류</div>
                            <div class="prep-description">사업 운영에 사용된 경비 영수증들</div>
                        </div>
                    </div>
                    <div class="prep-item">
                        <span class="prep-icon">🏦</span>
                        <div class="prep-content">
                            <div class="prep-title">소득공제 서류</div>
                            <div class="prep-description">보험료, 의료비, 기부금 등 공제 서류</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 신고 기간 알림 -->
            <div class="guide-notice">
                <h4>⏰ 신고 기간</h4>
                <p>매년 5월 1일 ~ 5월 31일 (종합소득세 정기신고)</p>
                <p class="notice-warning">기한 내 미신고 시 가산세가 부과될 수 있습니다.</p>
            </div>

            <div class="guide-actions">
                <button class="btn btn-primary" onclick="window.open('https://hometax.go.kr', '_blank')">
                    🌐 홈택스 바로가기
                </button>
                <button class="btn btn-outline" onclick="taxAI.downloadIncomeGuide()">
                    📄 가이드 다운로드
                </button>
            </div>
        </div>
    `;
};

// 연말정산 가이드
TaxAIApp.prototype.renderYearEndGuide = function() {
    return `
        <div class="guide-wrapper">
            <div class="guide-header">
                <h3>📋 연말정산 가이드</h3>
                <div class="guide-summary">
                    근로소득자의 연말정산 절차와 공제 항목을 안내합니다.
                </div>
            </div>

            <!-- 공제 항목들 -->
            <div class="deduction-items">
                <h4>💰 주요 공제 항목</h4>
                <div class="deduction-grid">
                    <div class="deduction-card">
                        <div class="deduction-icon">🏠</div>
                        <div class="deduction-title">주택자금공제</div>
                        <div class="deduction-description">주택청약, 주택담보대출 이자</div>
                    </div>
                    <div class="deduction-card">
                        <div class="deduction-icon">🏥</div>
                        <div class="deduction-title">의료비공제</div>
                        <div class="deduction-description">본인 및 가족 의료비</div>
                    </div>
                    <div class="deduction-card">
                        <div class="deduction-icon">🎓</div>
                        <div class="deduction-title">교육비공제</div>
                        <div class="deduction-description">자녀 교육비, 본인 교육비</div>
                    </div>
                    <div class="deduction-card">
                        <div class="deduction-icon">❤️</div>
                        <div class="deduction-title">기부금공제</div>
                        <div class="deduction-description">정치자금, 종교단체 기부금</div>
                    </div>
                </div>
            </div>

            <!-- 연말정산 일정 -->
            <div class="yearend-schedule">
                <h4>📅 연말정산 일정</h4>
                <div class="schedule-timeline">
                    <div class="timeline-item">
                        <div class="timeline-date">1월</div>
                        <div class="timeline-content">
                            <div class="timeline-title">공제증명서 발급</div>
                            <div class="timeline-description">각종 공제 증명서 수집</div>
                        </div>
                    </div>
                    <div class="timeline-item">
                        <div class="timeline-date">2월</div>
                        <div class="timeline-content">
                            <div class="timeline-title">연말정산 신고</div>
                            <div class="timeline-description">회사 또는 개인 신고</div>
                        </div>
                    </div>
                    <div class="timeline-item">
                        <div class="timeline-date">3월</div>
                        <div class="timeline-content">
                            <div class="timeline-title">정산금 지급</div>
                            <div class="timeline-description">환급 또는 추가납부</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="guide-actions">
                <button class="btn btn-primary" onclick="window.open('https://hometax.go.kr', '_blank')">
                    🌐 홈택스 바로가기
                </button>
                <button class="btn btn-outline" onclick="taxAI.downloadYearEndGuide()">
                    📄 가이드 다운로드
                </button>
            </div>
        </div>
    `;
};

// 단계별 네비게이션
TaxAIApp.prototype.navigateToStep = function(stepIndex) {
    const step = document.querySelector(`[data-step="${stepIndex}"]`);
    if (step) {
        step.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // 강조 효과
        step.classList.add('highlighted');
        setTimeout(() => {
            step.classList.remove('highlighted');
        }, 2000);
    }
};

// 가이드 다운로드 기능들
TaxAIApp.prototype.downloadVATGuide = function() {
    const calc = this.taxCalculations;
    const guide = `
부가가치세 신고 가이드
생성일: ${new Date().toLocaleDateString()}

=== 계산된 세액 정보 ===
매출세액: ${calc.salesTax.toLocaleString()}원
매입세액: ${calc.purchaseTax.toLocaleString()}원
납부세액: ${calc.payableTax.toLocaleString()}원

=== 홈택스 신고 절차 ===
1. 홈택스(hometax.go.kr) 접속 및 로그인
2. 신고/납부 > 부가가치세 선택
3. 매출세액 입력: ${calc.salesTax}
4. 매입세액 입력: ${calc.purchaseTax}
5. 납부세액 확인 및 제출: ${calc.payableTax}

=== 주의사항 ===
- 콤마 없이 숫자만 입력하세요
- 제출 전 모든 항목을 다시 확인하세요
- 납부세액이 음수면 환급 대상입니다

Generated by YouArePlan TAX AI
    `.trim();

    this.downloadTextFile(guide, '부가가치세_신고가이드.txt');
    this.showToast('부가가치세 가이드가 다운로드되었습니다', 'success');
};

TaxAIApp.prototype.downloadIncomeGuide = function() {
    const guide = `
종합소득세 신고 가이드
생성일: ${new Date().toLocaleDateString()}

=== 준비사항 ===
1. 소득금액증명원
2. 필요경비 증빙서류
3. 소득공제 서류

=== 신고기간 ===
매년 5월 1일 ~ 5월 31일

=== 신고절차 ===
1. 홈택스 접속
2. 종합소득세 신고 선택
3. 소득금액 입력
4. 필요경비 입력
5. 소득공제 입력
6. 신고서 제출

Generated by YouArePlan TAX AI
    `.trim();

    this.downloadTextFile(guide, '종합소득세_신고가이드.txt');
    this.showToast('종합소득세 가이드가 다운로드되었습니다', 'success');
};

TaxAIApp.prototype.downloadYearEndGuide = function() {
    const guide = `
연말정산 가이드
생성일: ${new Date().toLocaleDateString()}

=== 주요 공제항목 ===
1. 주택자금공제
2. 의료비공제
3. 교육비공제
4. 기부금공제

=== 연말정산 일정 ===
1월: 공제증명서 발급
2월: 연말정산 신고
3월: 정산금 지급

=== 신고방법 ===
1. 회사를 통한 신고
2. 개인 직접 신고 (홈택스)

Generated by YouArePlan TAX AI
    `.trim();

    this.downloadTextFile(guide, '연말정산_가이드.txt');
    this.showToast('연말정산 가이드가 다운로드되었습니다', 'success');
};

// 텍스트 파일 다운로드 헬퍼
TaxAIApp.prototype.downloadTextFile = function(content, filename) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};