// 실시간 세무 계산 대시보드 모듈
// Chart.js를 사용한 월별 트렌드 차트 및 세무 시뮬레이션

// TaxAIApp 클래스 확장 - 실시간 세무 대시보드
TaxAIApp.prototype.initTaxDashboard = function() {
    console.log('🧮 실시간 세무 대시보드 초기화 중...');
    
    // Chart.js 라이브러리 동적 로드
    this.loadChartJS(() => {
        this.initializeTaxCharts();
        this.initializeTaxSimulator();
        this.initializeHomeTaxHelper();
    });
};

// Chart.js 동적 로드
TaxAIApp.prototype.loadChartJS = function(callback) {
    if (window.Chart) {
        callback();
        return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = callback;
    document.head.appendChild(script);
};

// 실시간 세무 대시보드 업데이트
TaxAIApp.prototype.updateRealTimeTaxDashboard = function() {
    // 백엔드에서 실시간 세무 계산 데이터 가져오기
    if (this.isOnline && typeof this.syncTaxCalculations === 'function') {
        this.syncTaxCalculations();
    }
    
    // 대시보드 UI 업데이트
    this.updateTaxCards();
    this.updateTaxCharts();
    this.updateTaxInsights();
    this.updateHomeTaxData();
};

// 세무 카드 업데이트
TaxAIApp.prototype.updateTaxCards = function() {
    const taxContainer = document.getElementById('tax-calculation-results');
    if (!taxContainer) return;
    
    const calc = this.taxCalculations;
    const stats = this.dataManager.getDataStats();
    
    taxContainer.innerHTML = `
        <div class="tax-dashboard-header">
            <h2>🧮 실시간 세무 계산 대시보드</h2>
            <div class="dashboard-subtitle">
                총 ${stats.total}건의 거래 데이터 기준 · 실시간 업데이트
            </div>
        </div>
        
        <div class="tax-cards-grid">
            ${this.renderTaxCard('sales', '매출세액', calc.salesTax, '💰', 'positive')}
            ${this.renderTaxCard('purchase', '매입세액', calc.purchaseTax, '💸', 'neutral')}
            ${this.renderTaxCard('payable', '납부세액', calc.payableTax, '🧾', calc.payableTax > 0 ? 'negative' : 'positive')}
            ${this.renderTaxCard('income', '총 매출', calc.totalIncome, '📈', 'positive')}
            ${this.renderTaxCard('expense', '총 매입', calc.totalExpense, '📉', 'neutral')}
            ${this.renderTaxCard('profit', '순이익', calc.netProfit, '💎', calc.netProfit > 0 ? 'positive' : 'negative')}
        </div>
        
        <div class="tax-insights-section">
            ${this.renderTaxInsights()}
        </div>
        
        <div class="tax-charts-section">
            <div class="chart-container">
                <h3>📊 월별 세액 트렌드</h3>
                <canvas id="taxTrendChart" width="400" height="200"></canvas>
            </div>
            <div class="chart-container">
                <h3>📋 세액 구성 비율</h3>
                <canvas id="taxCompositionChart" width="400" height="200"></canvas>
            </div>
        </div>
        
        <div class="tax-simulator-section">
            ${this.renderTaxSimulator()}
        </div>
        
        <div class="hometax-helper-section">
            ${this.renderHomeTaxHelper()}
        </div>
    `;
    
    // 차트 초기화 (DOM 업데이트 후)
    setTimeout(() => {
        this.initializeTaxCharts();
    }, 100);
};

// 세무 카드 렌더링
TaxAIApp.prototype.renderTaxCard = function(type, title, value, icon, status) {
    const isPositive = status === 'positive';
    const isNegative = status === 'negative';
    const formattedValue = Math.abs(value).toLocaleString();
    
    return `
        <div class="tax-card ${status}" data-type="${type}">
            <div class="tax-card-header">
                <span class="tax-card-icon">${icon}</span>
                <span class="tax-card-title">${title}</span>
            </div>
            <div class="tax-card-value">
                ₩${formattedValue}
                ${value !== 0 ? `<span class="change-indicator ${isPositive ? 'up' : isNegative ? 'down' : ''}"></span>` : ''}
            </div>
            <div class="tax-card-actions">
                <button class="btn-icon copy" onclick="taxAI.copyToClipboard('${formattedValue}')" title="복사">
                    📋
                </button>
                <button class="btn-icon details" onclick="taxAI.showTaxDetails('${type}')" title="상세보기">
                    ℹ️
                </button>
            </div>
        </div>
    `;
};

// 세무 인사이트 렌더링
TaxAIApp.prototype.renderTaxInsights = function() {
    const calc = this.taxCalculations;
    const insights = this.generateTaxInsights(calc);
    
    return `
        <div class="tax-insights">
            <h3>💡 절세 포인트 & 인사이트</h3>
            <div class="insights-grid">
                ${insights.map(insight => `
                    <div class="insight-card ${insight.type}">
                        <div class="insight-icon">${insight.icon}</div>
                        <div class="insight-content">
                            <h4>${insight.title}</h4>
                            <p>${insight.message}</p>
                            ${insight.action ? `<button class="btn btn-sm">${insight.action}</button>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
};

// 세무 인사이트 생성
TaxAIApp.prototype.generateTaxInsights = function(calc) {
    const insights = [];
    
    // 납부세액 분석
    if (calc.payableTax > 0) {
        insights.push({
            type: 'warning',
            icon: '⚠️',
            title: '납부세액 발생',
            message: `${calc.payableTax.toLocaleString()}원의 부가가치세를 납부해야 합니다.`,
            action: '납부 계획 세우기'
        });
    } else if (calc.payableTax < 0) {
        insights.push({
            type: 'success',
            icon: '💰',
            title: '환급세액 발생',
            message: `${Math.abs(calc.payableTax).toLocaleString()}원의 부가가치세를 환급받을 수 있습니다.`,
            action: '환급 신청하기'
        });
    }
    
    // 매입세액 활용도 분석
    const deductionRate = calc.totalIncome > 0 ? (calc.purchaseTax / calc.salesTax) * 100 : 0;
    if (deductionRate < 50 && calc.totalIncome > 0) {
        insights.push({
            type: 'tip',
            icon: '💡',
            title: '매입세액 공제 기회',
            message: `매입세액 공제율이 ${deductionRate.toFixed(1)}%입니다. 추가 매입세액 공제를 검토해보세요.`,
            action: '공제 항목 확인'
        });
    }
    
    // 수익성 분석
    const profitMargin = calc.totalIncome > 0 ? (calc.netProfit / calc.totalIncome) * 100 : 0;
    if (profitMargin > 20) {
        insights.push({
            type: 'success',
            icon: '📈',
            title: '좋은 수익성',
            message: `수익률이 ${profitMargin.toFixed(1)}%로 양호합니다. 안정적인 사업 운영 중입니다.`
        });
    } else if (profitMargin < 5) {
        insights.push({
            type: 'warning',
            icon: '📉',
            title: '수익성 개선 필요',
            message: `수익률이 ${profitMargin.toFixed(1)}%로 낮습니다. 비용 절감이나 매출 증대를 고려해보세요.`,
            action: '개선 방안 검토'
        });
    }
    
    return insights;
};

// 세무 시뮬레이터 렌더링
TaxAIApp.prototype.renderTaxSimulator = function() {
    return `
        <div class="tax-simulator">
            <h3>🔮 세무 시뮬레이션</h3>
            <div class="simulator-description">
                가상의 거래를 추가하여 세액 변화를 미리 확인해보세요
            </div>
            
            <div class="simulator-form">
                <div class="form-row">
                    <div class="form-group">
                        <label>거래 유형</label>
                        <select id="sim-type">
                            <option value="income">매출</option>
                            <option value="expense">매입</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>금액</label>
                        <input type="number" id="sim-amount" placeholder="1,000,000" step="1000">
                    </div>
                    <div class="form-group">
                        <label>부가세</label>
                        <input type="number" id="sim-vat" placeholder="100,000" step="1000">
                    </div>
                </div>
                
                <div class="simulator-actions">
                    <button class="btn btn-primary" onclick="taxAI.runTaxSimulation()">
                        시뮬레이션 실행
                    </button>
                    <button class="btn btn-outline" onclick="taxAI.resetTaxSimulation()">
                        초기화
                    </button>
                </div>
            </div>
            
            <div id="simulation-results" class="simulation-results">
                <!-- 시뮬레이션 결과가 여기에 표시됩니다 -->
            </div>
        </div>
    `;
};

// 홈택스 도우미 렌더링
TaxAIApp.prototype.renderHomeTaxHelper = function() {
    const calc = this.taxCalculations;
    
    return `
        <div class="hometax-helper">
            <h3>🏛️ 홈택스 입력 도우미</h3>
            <div class="helper-description">
                홈택스 신고 시 입력할 정확한 수치를 제공합니다
            </div>
            
            <div class="hometax-data-cards">
                <div class="hometax-card">
                    <div class="card-title">매출세액</div>
                    <div class="card-value" id="hometax-sales-tax">₩${calc.salesTax.toLocaleString()}</div>
                    <div class="card-code">홈택스 코드: 101</div>
                    <button class="btn-copy" onclick="taxAI.copyToClipboard('${calc.salesTax}')">복사</button>
                </div>
                
                <div class="hometax-card">
                    <div class="card-title">매입세액</div>
                    <div class="card-value" id="hometax-purchase-tax">₩${calc.purchaseTax.toLocaleString()}</div>
                    <div class="card-code">홈택스 코드: 201</div>
                    <button class="btn-copy" onclick="taxAI.copyToClipboard('${calc.purchaseTax}')">복사</button>
                </div>
                
                <div class="hometax-card highlight">
                    <div class="card-title">납부(환급)세액</div>
                    <div class="card-value" id="hometax-payable-tax">₩${calc.payableTax.toLocaleString()}</div>
                    <div class="card-code">홈택스 코드: 301</div>
                    <button class="btn-copy" onclick="taxAI.copyToClipboard('${calc.payableTax}')">복사</button>
                </div>
            </div>
            
            <div class="hometax-guide">
                <h4>📋 홈택스 신고 단계별 가이드</h4>
                <div class="guide-steps">
                    <div class="guide-step">
                        <div class="step-number">1</div>
                        <div class="step-content">
                            <h5>홈택스 접속</h5>
                            <p>국세청 홈택스(hometax.go.kr) → 부가가치세 신고</p>
                        </div>
                    </div>
                    
                    <div class="guide-step">
                        <div class="step-number">2</div>
                        <div class="step-content">
                            <h5>매출세액 입력</h5>
                            <p>위 매출세액 값을 복사하여 입력</p>
                        </div>
                    </div>
                    
                    <div class="guide-step">
                        <div class="step-number">3</div>
                        <div class="step-content">
                            <h5>매입세액 입력</h5>
                            <p>위 매입세액 값을 복사하여 입력</p>
                        </div>
                    </div>
                    
                    <div class="guide-step">
                        <div class="step-number">4</div>
                        <div class="step-content">
                            <h5>최종 제출</h5>
                            <p>납부세액 확인 후 신고서 제출</p>
                        </div>
                    </div>
                </div>
                
                <div class="guide-actions">
                    <button class="btn btn-primary" onclick="window.open('https://hometax.go.kr', '_blank')">
                        홈택스 바로가기
                    </button>
                    <button class="btn btn-outline" onclick="taxAI.downloadTaxSummary()">
                        요약서 다운로드
                    </button>
                </div>
            </div>
        </div>
    `;
};

// 차트 초기화
TaxAIApp.prototype.initializeTaxCharts = function() {
    if (!window.Chart) return;
    
    this.initTaxTrendChart();
    this.initTaxCompositionChart();
};

// 월별 세액 트렌드 차트
TaxAIApp.prototype.initTaxTrendChart = function() {
    const canvas = document.getElementById('taxTrendChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const monthlyData = this.dataManager.getMonthlyData();
    
    const months = Object.keys(monthlyData).sort().slice(-6); // 최근 6개월
    const salesTaxData = months.map(month => {
        const data = monthlyData[month];
        return data.income * 0.1; // 간단한 매출세액 계산 (10%)
    });
    const purchaseTaxData = months.map(month => {
        const data = monthlyData[month];
        return data.expense * 0.1; // 간단한 매입세액 계산 (10%)
    });
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: months.map(month => month.replace('-', '년 ') + '월'),
            datasets: [
                {
                    label: '매출세액',
                    data: salesTaxData,
                    borderColor: '#22c55e',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    tension: 0.4
                },
                {
                    label: '매입세액',
                    data: purchaseTaxData,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₩' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
};

// 세액 구성 비율 차트
TaxAIApp.prototype.initTaxCompositionChart = function() {
    const canvas = document.getElementById('taxCompositionChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const calc = this.taxCalculations;
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['매출세액', '매입세액'],
            datasets: [{
                data: [calc.salesTax, calc.purchaseTax],
                backgroundColor: [
                    '#22c55e',
                    '#ef4444'
                ],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed;
                            return context.label + ': ₩' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
};

// 세무 시뮬레이션 실행
TaxAIApp.prototype.runTaxSimulation = function() {
    const type = document.getElementById('sim-type').value;
    const amount = parseFloat(document.getElementById('sim-amount').value) || 0;
    const vat = parseFloat(document.getElementById('sim-vat').value) || 0;
    
    if (amount === 0) {
        this.showToast('금액을 입력해주세요', 'error');
        return;
    }
    
    // 현재 세액 계산
    const currentCalc = { ...this.taxCalculations };
    
    // 시뮬레이션 세액 계산
    const simCalc = { ...currentCalc };
    if (type === 'income') {
        simCalc.salesTax += vat;
        simCalc.totalIncome += amount;
    } else {
        simCalc.purchaseTax += vat;
        simCalc.totalExpense += amount;
    }
    simCalc.payableTax = simCalc.salesTax - simCalc.purchaseTax;
    simCalc.netProfit = simCalc.totalIncome - simCalc.totalExpense;
    
    // 결과 표시
    this.displaySimulationResults(currentCalc, simCalc, { type, amount, vat });
};

// 시뮬레이션 결과 표시
TaxAIApp.prototype.displaySimulationResults = function(current, simulated, transaction) {
    const resultsContainer = document.getElementById('simulation-results');
    if (!resultsContainer) return;
    
    const taxDiff = simulated.payableTax - current.payableTax;
    const profitDiff = simulated.netProfit - current.netProfit;
    
    resultsContainer.innerHTML = `
        <div class="simulation-results-content">
            <h4>시뮬레이션 결과</h4>
            <div class="simulation-scenario">
                <strong>가정:</strong> ${transaction.type === 'income' ? '매출' : '매입'} 
                ₩${transaction.amount.toLocaleString()} (부가세 ₩${transaction.vat.toLocaleString()}) 추가
            </div>
            
            <div class="results-comparison">
                <div class="comparison-row">
                    <span class="label">납부세액</span>
                    <span class="current">₩${current.payableTax.toLocaleString()}</span>
                    <span class="arrow">→</span>
                    <span class="simulated">₩${simulated.payableTax.toLocaleString()}</span>
                    <span class="diff ${taxDiff >= 0 ? 'negative' : 'positive'}">
                        ${taxDiff >= 0 ? '+' : ''}₩${taxDiff.toLocaleString()}
                    </span>
                </div>
                
                <div class="comparison-row">
                    <span class="label">순이익</span>
                    <span class="current">₩${current.netProfit.toLocaleString()}</span>
                    <span class="arrow">→</span>
                    <span class="simulated">₩${simulated.netProfit.toLocaleString()}</span>
                    <span class="diff ${profitDiff >= 0 ? 'positive' : 'negative'}">
                        ${profitDiff >= 0 ? '+' : ''}₩${profitDiff.toLocaleString()}
                    </span>
                </div>
            </div>
            
            <div class="simulation-insight">
                ${this.generateSimulationInsight(taxDiff, profitDiff, transaction)}
            </div>
        </div>
    `;
};

// 시뮬레이션 인사이트 생성
TaxAIApp.prototype.generateSimulationInsight = function(taxDiff, profitDiff, transaction) {
    if (transaction.type === 'income') {
        return `
            <div class="insight positive">
                <strong>💡 인사이트:</strong> 
                매출 증가로 ${Math.abs(profitDiff).toLocaleString()}원의 순이익이 증가하지만, 
                ${Math.abs(taxDiff).toLocaleString()}원의 추가 세금이 발생합니다.
            </div>
        `;
    } else {
        return `
            <div class="insight neutral">
                <strong>💡 인사이트:</strong> 
                매입 증가로 매입세액 공제 효과가 있어 
                납부세액이 ${Math.abs(taxDiff).toLocaleString()}원 감소합니다.
            </div>
        `;
    }
};

// 클립보드 복사 기능
TaxAIApp.prototype.copyToClipboard = function(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            this.showToast('클립보드에 복사되었습니다', 'success');
        });
    } else {
        // fallback
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        this.showToast('클립보드에 복사되었습니다', 'success');
    }
};

// 세무 요약서 다운로드
TaxAIApp.prototype.downloadTaxSummary = function() {
    const calc = this.taxCalculations;
    const stats = this.dataManager.getDataStats();
    const today = new Date().toISOString().split('T')[0];
    
    const summary = `
세무 계산 요약서
생성일: ${today}

=== 거래 데이터 현황 ===
총 거래 건수: ${stats.total}건
직접입력: ${stats.direct}건
CSV업로드: ${stats.uploaded}건

=== 세액 계산 결과 ===
매출세액: ₩${calc.salesTax.toLocaleString()}
매입세액: ₩${calc.purchaseTax.toLocaleString()}
납부세액: ₩${calc.payableTax.toLocaleString()}

총 매출: ₩${calc.totalIncome.toLocaleString()}
총 매입: ₩${calc.totalExpense.toLocaleString()}
순이익: ₩${calc.netProfit.toLocaleString()}

=== 홈택스 입력 참조 ===
매출세액 (코드 101): ${calc.salesTax}
매입세액 (코드 201): ${calc.purchaseTax}
납부세액 (코드 301): ${calc.payableTax}

Generated by YouArePlan TAX AI
    `.trim();
    
    const blob = new Blob([summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `세무계산요약서_${today}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    this.showToast('세무 요약서가 다운로드되었습니다', 'success');
};

// 시뮬레이션 초기화
TaxAIApp.prototype.resetTaxSimulation = function() {
    document.getElementById('sim-amount').value = '';
    document.getElementById('sim-vat').value = '';
    document.getElementById('simulation-results').innerHTML = '';
};