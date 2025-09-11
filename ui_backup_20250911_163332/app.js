// YouArePlan EasyTax v8 - 가계부형 UI 전용 스크립트
// 5탭 인터페이스: 가계부, 영수증업로드, 자동분류, 간편신고, 리포트

class EasyTaxApp {
    constructor() {
        this.currentTab = 'ledger';
        this.entries = [];
        this.reports = {};
        this.taxStatus = {};
        this.apiBaseUrl = window.location.origin;
        this.isApiAvailable = false;
        
        this.init();
    }

    // 초기화
    async init() {
        console.log('🚀 YouArePlan EasyTax v8 - 가계부형 UI 초기화');
        
        this.bindEvents();
        this.loadFromLocalStorage();
        await this.checkApiStatus();
        this.showTab('ledger');
        this.loadSampleData();
        this.updateSummaryCards();
    }

    // API 상태 확인
    async checkApiStatus() {
        try {
            const healthResponse = await fetch(`${this.apiBaseUrl}/health`);
            const statusResponse = await fetch(`${this.apiBaseUrl}/api/status`);
            
            if (healthResponse.ok && statusResponse.ok) {
                this.isApiAvailable = true;
                console.log('✅ API 서버 연결됨');
                this.showAlert('success', 'API 서버가 연결되었습니다. 실시간 데이터를 사용합니다.');
            } else {
                this.fallbackToStubMode();
            }
        } catch (error) {
            console.warn('⚠️ API 서버 연결 실패, 스텁 모드로 전환:', error);
            this.fallbackToStubMode();
        }
    }

    // 스텁 모드 전환
    fallbackToStubMode() {
        this.isApiAvailable = false;
        this.showAlert('warning', '오프라인 모드: 샘플 데이터를 사용합니다.');
        console.log('📱 스텁 모드 활성화');
    }

    // 이벤트 바인딩
    bindEvents() {
        // 탭 버튼들
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabId = btn.dataset.tab;
                this.showTab(tabId);
            });
        });

        // 가계부 필터 이벤트
        const filterInputs = document.querySelectorAll('#ledger-content .filter-group input, #ledger-content .filter-group select');
        filterInputs.forEach(input => {
            input.addEventListener('change', () => this.filterEntries());
        });

        // 업로드 관련 이벤트
        this.bindUploadEvents();
        
        // 분류 관련 이벤트
        this.bindClassificationEvents();
        
        // 신고 관련 이벤트
        this.bindFilingEvents();
        
        // 리포트 관련 이벤트
        this.bindReportEvents();

        // 모달 이벤트
        this.bindModalEvents();

        // 전역 에러 핸들링
        window.addEventListener('error', this.handleGlobalError.bind(this));
        window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
    }

    // 업로드 이벤트 바인딩
    bindUploadEvents() {
        const csvUploadArea = document.getElementById('csv-upload-area');
        const csvFileInput = document.getElementById('csv-file-input');
        const imageUploadArea = document.getElementById('image-upload-area');
        const imageFileInput = document.getElementById('image-file-input');

        // CSV 업로드
        csvUploadArea.addEventListener('click', () => csvFileInput.click());
        csvUploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        csvUploadArea.addEventListener('drop', (e) => this.handleFileDrop(e, 'csv'));
        csvFileInput.addEventListener('change', (e) => this.handleFileSelect(e, 'csv'));

        // 이미지 업로드  
        imageUploadArea.addEventListener('click', () => imageFileInput.click());
        imageUploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        imageUploadArea.addEventListener('drop', (e) => this.handleFileDrop(e, 'image'));
        imageFileInput.addEventListener('change', (e) => this.handleFileSelect(e, 'image'));
    }

    // 분류 이벤트 바인딩
    bindClassificationEvents() {
        const classifyAllBtn = document.getElementById('classify-all-btn');
        const reClassifyBtn = document.getElementById('reclassify-btn');

        if (classifyAllBtn) {
            classifyAllBtn.addEventListener('click', () => this.classifyAllEntries());
        }
        if (reClassifyBtn) {
            reClassifyBtn.addEventListener('click', () => this.reClassifyEntries());
        }
    }

    // 신고 이벤트 바인딩
    bindFilingEvents() {
        const generateTaxBtn = document.getElementById('generate-tax-btn');
        const checklistItems = document.querySelectorAll('.checklist-checkbox');

        if (generateTaxBtn) {
            generateTaxBtn.addEventListener('click', () => this.generateTaxReport());
        }

        checklistItems.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const item = e.target.closest('.checklist-item');
                if (e.target.checked) {
                    item.classList.add('completed');
                } else {
                    item.classList.remove('completed');
                }
                this.updateTaxProgress();
            });
        });
    }

    // 리포트 이벤트 바인딩
    bindReportEvents() {
        const generateReportBtn = document.getElementById('generate-report-btn');
        const downloadReportBtn = document.getElementById('download-report-btn');

        if (generateReportBtn) {
            generateReportBtn.addEventListener('click', () => this.generateMonthlyReport());
        }
        if (downloadReportBtn) {
            downloadReportBtn.addEventListener('click', () => this.downloadReport());
        }
    }

    // 모달 이벤트 바인딩
    bindModalEvents() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closeModal();
            }
            if (e.target.classList.contains('modal-close')) {
                this.closeModal();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    // 탭 표시
    showTab(tabId) {
        // 모든 탭 숨기기
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // 모든 탭 버튼 비활성화
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // 선택된 탭 활성화
        const selectedTab = document.getElementById(`${tabId}-content`);
        const selectedBtn = document.querySelector(`[data-tab="${tabId}"]`);
        
        if (selectedTab && selectedBtn) {
            selectedTab.classList.add('active');
            selectedBtn.classList.add('active');
            this.currentTab = tabId;
            
            // 탭별 초기화 작업
            this.onTabChange(tabId);
        }
    }

    // 탭 변경 시 작업
    onTabChange(tabId) {
        switch(tabId) {
            case 'ledger':
                this.updateSummaryCards();
                this.renderLedgerTable();
                break;
            case 'upload':
                this.updateUploadStatus();
                break;
            case 'classification':
                this.updateClassificationStats();
                break;
            case 'filing':
                this.updateTaxProgress();
                break;
            case 'reports':
                this.updateReportsView();
                break;
        }
    }

    // 파일 드래그 오버 처리
    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('dragover');
    }

    // 파일 드롭 처리
    handleFileDrop(e, type) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFiles(files, type);
        }
    }

    // 파일 선택 처리
    handleFileSelect(e, type) {
        const files = e.target.files;
        if (files.length > 0) {
            this.processFiles(files, type);
        }
    }

    // 파일 처리
    async processFiles(files, type) {
        const file = files[0];
        
        if (type === 'csv') {
            if (!file.name.toLowerCase().endsWith('.csv')) {
                this.showAlert('danger', 'CSV 파일만 업로드 가능합니다.');
                return;
            }
            await this.processCsvFile(file);
        } else if (type === 'image') {
            if (!file.type.startsWith('image/')) {
                this.showAlert('danger', '이미지 파일만 업로드 가능합니다.');
                return;
            }
            await this.processImageFile(file);
        }
    }

    // CSV 파일 처리
    async processCsvFile(file) {
        this.showProgress('CSV 파일 처리 중...', 0);
        
        try {
            if (this.isApiAvailable) {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('period', this.getCurrentPeriod());
                formData.append('source', 'csv_upload');

                const response = await fetch(`${this.apiBaseUrl}/ingest/upload`, {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();
                
                if (result.ok) {
                    this.showProgress('CSV 파일 처리 완료', 100);
                    this.showAlert('success', `${result.stored_entries}개 항목이 저장되었습니다.`);
                    this.loadEntries();
                } else {
                    throw new Error(result.error || '업로드 실패');
                }
            } else {
                await this.processCsvFileLocally(file);
            }
        } catch (error) {
            this.showAlert('danger', `CSV 파일 처리 중 오류: ${error.message}`);
        } finally {
            this.hideProgress();
        }
    }

    // 로컬 CSV 파일 처리
    async processCsvFileLocally(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const csv = e.target.result;
                    const lines = csv.split('\n');
                    const entries = [];
                    
                    // CSV 파싱 (간단한 구현)
                    for (let i = 1; i < lines.length; i++) {
                        const line = lines[i].trim();
                        if (!line) continue;
                        
                        const cols = line.split(',');
                        if (cols.length >= 3) {
                            entries.push({
                                id: Date.now() + i,
                                date: cols[0] || new Date().toISOString().split('T')[0],
                                vendor: cols[1] || '미분류',
                                amount: parseInt(cols[2]) || 0,
                                vat: parseInt(cols[3]) || 0,
                                memo: cols[4] || '',
                                account_code: '미분류',
                                tax_type: '과세',
                                confidence: 0.8,
                                classification_status: 'auto'
                            });
                        }
                    }
                    
                    this.entries = [...this.entries, ...entries];
                    this.saveToLocalStorage();
                    this.showAlert('success', `${entries.length}개 항목이 추가되었습니다.`);
                    this.updateSummaryCards();
                    this.renderLedgerTable();
                    resolve();
                } catch (error) {
                    reject(error);
                }
            };
            reader.readAsText(file);
        });
    }

    // 이미지 파일 처리
    async processImageFile(file) {
        this.showProgress('이미지 분석 중...', 0);
        
        try {
            if (this.isApiAvailable) {
                const formData = new FormData();
                formData.append('file', file);
                
                const response = await fetch(`${this.apiBaseUrl}/ai/classify-receipt`, {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();
                
                if (result.ok) {
                    this.showProgress('이미지 분석 완료', 100);
                    this.showAlert('success', '영수증이 성공적으로 분석되었습니다.');
                    // 분석 결과를 entries에 추가
                    this.addEntryFromReceipt(result);
                } else {
                    throw new Error(result.error || '이미지 분석 실패');
                }
            } else {
                await this.processImageFileLocally(file);
            }
        } catch (error) {
            this.showAlert('danger', `이미지 처리 중 오류: ${error.message}`);
        } finally {
            this.hideProgress();
        }
    }

    // 로컬 이미지 처리 (스텁)
    async processImageFileLocally(file) {
        // 실제로는 OCR 처리가 필요하지만 여기서는 샘플 데이터 생성
        const mockEntry = {
            id: Date.now(),
            date: new Date().toISOString().split('T')[0],
            vendor: '영수증 업로드',
            amount: Math.floor(Math.random() * 100000) + 10000,
            vat: Math.floor(Math.random() * 10000) + 1000,
            memo: `${file.name} 분석 결과`,
            account_code: '접대비',
            tax_type: '과세',
            confidence: 0.6,
            classification_status: 'auto'
        };
        
        this.entries.push(mockEntry);
        this.saveToLocalStorage();
        this.showAlert('success', '영수증이 추가되었습니다. (샘플 데이터)');
        this.updateSummaryCards();
        this.renderLedgerTable();
    }

    // 전체 항목 분류
    async classifyAllEntries() {
        this.showProgress('전체 항목 분류 중...', 0);
        
        try {
            if (this.isApiAvailable) {
                const response = await fetch(`${this.apiBaseUrl}/ai/classify-all`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ period: this.getCurrentPeriod() })
                });

                const result = await response.json();
                
                if (result.ok) {
                    this.showProgress('분류 완료', 100);
                    this.showAlert('success', `${result.classified_count}개 항목이 분류되었습니다.`);
                    this.loadEntries();
                } else {
                    throw new Error(result.error || '분류 실패');
                }
            } else {
                this.classifyAllEntriesLocally();
            }
        } catch (error) {
            this.showAlert('danger', `분류 중 오류: ${error.message}`);
        } finally {
            this.hideProgress();
        }
    }

    // 로컬 전체 분류
    classifyAllEntriesLocally() {
        const accountCodes = ['접대비', '사무용품비', '통신비', '광고선전비', '차량유지비', '임차료'];
        let classified = 0;
        
        this.entries.forEach(entry => {
            if (entry.classification_status !== 'manual') {
                entry.account_code = accountCodes[Math.floor(Math.random() * accountCodes.length)];
                entry.confidence = 0.7 + Math.random() * 0.3;
                entry.classification_status = 'auto';
                classified++;
            }
        });
        
        this.saveToLocalStorage();
        this.showAlert('success', `${classified}개 항목이 재분류되었습니다.`);
        this.renderLedgerTable();
        this.updateClassificationStats();
    }

    // 세금 리포트 생성
    async generateTaxReport() {
        this.showProgress('세금 계산 중...', 0);
        
        try {
            if (this.isApiAvailable) {
                const response = await fetch(`${this.apiBaseUrl}/tax/estimate?period=${this.getCurrentPeriod()}`);
                const result = await response.json();
                
                if (result.ok) {
                    this.taxStatus = result;
                    this.showProgress('세금 계산 완료', 100);
                    this.showAlert('success', '세금 계산이 완료되었습니다.');
                    this.updateTaxProgress();
                } else {
                    throw new Error(result.error || '세금 계산 실패');
                }
            } else {
                this.generateTaxReportLocally();
            }
        } catch (error) {
            this.showAlert('danger', `세금 계산 중 오류: ${error.message}`);
        } finally {
            this.hideProgress();
        }
    }

    // 로컬 세금 계산
    generateTaxReportLocally() {
        const totalSales = this.entries
            .filter(e => e.amount > 0)
            .reduce((sum, e) => sum + e.amount, 0);
            
        const totalVat = this.entries.reduce((sum, e) => sum + (e.vat || 0), 0);
        
        this.taxStatus = {
            period: this.getCurrentPeriod(),
            sales_vat: Math.floor(totalSales * 0.1),
            purchase_vat: totalVat,
            non_deductible_vat: Math.floor(totalVat * 0.1),
            estimated_due_vat: Math.max(0, Math.floor(totalSales * 0.1) - totalVat)
        };
        
        this.showAlert('success', '세금 계산이 완료되었습니다. (샘플 계산)');
        this.updateTaxProgress();
    }

    // 월간 리포트 생성
    async generateMonthlyReport() {
        this.showProgress('리포트 생성 중...', 0);
        
        try {
            if (this.isApiAvailable) {
                const response = await fetch(`${this.apiBaseUrl}/prep/refresh?period=${this.getCurrentPeriod()}&taxType=VAT`, {
                    method: 'POST'
                });
                const result = await response.json();
                
                if (result.ok) {
                    this.showProgress('리포트 생성 완료', 100);
                    this.showAlert('success', '월간 리포트가 생성되었습니다.');
                    this.updateReportsView();
                } else {
                    throw new Error(result.error || '리포트 생성 실패');
                }
            } else {
                this.generateMonthlyReportLocally();
            }
        } catch (error) {
            this.showAlert('danger', `리포트 생성 중 오류: ${error.message}`);
        } finally {
            this.hideProgress();
        }
    }

    // 로컬 월간 리포트 생성
    generateMonthlyReportLocally() {
        const currentMonth = this.getCurrentPeriod();
        const monthlyEntries = this.entries.filter(e => e.date.startsWith(currentMonth));
        
        this.reports[currentMonth] = {
            period: currentMonth,
            total_entries: monthlyEntries.length,
            total_amount: monthlyEntries.reduce((sum, e) => sum + Math.abs(e.amount), 0),
            total_vat: monthlyEntries.reduce((sum, e) => sum + (e.vat || 0), 0),
            classification_rate: monthlyEntries.filter(e => e.classification_status !== 'pending').length / monthlyEntries.length
        };
        
        this.saveToLocalStorage();
        this.showAlert('success', `${currentMonth} 월간 리포트가 생성되었습니다.`);
        this.updateReportsView();
    }

    // 요약 카드 업데이트
    updateSummaryCards() {
        const currentMonth = this.getCurrentPeriod();
        const monthlyEntries = this.entries.filter(e => e.date.startsWith(currentMonth));
        
        const totalIncome = monthlyEntries
            .filter(e => e.amount > 0)
            .reduce((sum, e) => sum + e.amount, 0);
            
        const totalExpense = monthlyEntries
            .filter(e => e.amount < 0)
            .reduce((sum, e) => sum + Math.abs(e.amount), 0);
            
        const totalVat = monthlyEntries.reduce((sum, e) => sum + (e.vat || 0), 0);
        
        const pendingCount = monthlyEntries.filter(e => e.classification_status === 'pending').length;
        
        // DOM 업데이트
        this.updateElement('#total-income .amount', this.formatCurrency(totalIncome));
        this.updateElement('#total-expense .amount', this.formatCurrency(totalExpense));
        this.updateElement('#total-vat .amount', this.formatCurrency(totalVat));
        this.updateElement('#pending-items .amount', pendingCount);
        
        this.updateElement('#total-income .sub-info', `${monthlyEntries.filter(e => e.amount > 0).length}건`);
        this.updateElement('#total-expense .sub-info', `${monthlyEntries.filter(e => e.amount < 0).length}건`);
        this.updateElement('#total-vat .sub-info', `${currentMonth} 기준`);
        this.updateElement('#pending-items .sub-info', '분류 필요');
    }

    // 가계부 테이블 렌더링
    renderLedgerTable() {
        const tbody = document.querySelector('#ledger-table tbody');
        if (!tbody) return;
        
        let filteredEntries = [...this.entries];
        
        // 필터 적용
        const filters = this.getFilterValues();
        filteredEntries = this.applyFilters(filteredEntries, filters);
        
        // 테이블 렌더링
        tbody.innerHTML = '';
        
        if (filteredEntries.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                        조회된 데이터가 없습니다.
                    </td>
                </tr>
            `;
            return;
        }
        
        filteredEntries.forEach(entry => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${entry.date}</td>
                <td>${entry.vendor}</td>
                <td style="text-align: right; color: ${entry.amount >= 0 ? 'var(--accent-color)' : 'var(--danger-color)'};'">
                    ${this.formatCurrency(entry.amount)}
                </td>
                <td style="text-align: right;">${this.formatCurrency(entry.vat || 0)}</td>
                <td>${entry.memo || '-'}</td>
                <td>
                    <span class="account-code-tag" style="background: #e3f2fd; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem;">
                        ${entry.account_code}
                    </span>
                </td>
                <td>
                    <span class="tax-type-tag" style="background: ${entry.tax_type === '과세' ? '#e8f5e8' : '#fff3cd'}; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem;">
                        ${entry.tax_type}
                    </span>
                </td>
                <td style="text-align: center;">
                    <span class="confidence-badge ${this.getConfidenceClass(entry.confidence)}"'>
                        ${entry.confidence ? Math.round(entry.confidence * 100) + '%' : '-'}
                    </span>
                </td>
            `;
            
            // 행 클릭 시 상세 정보 모달
            row.addEventListener('click', () => this.showEntryModal(entry));
            row.style.cursor = 'pointer';
            
            tbody.appendChild(row);
        });
    }

    // 필터 값 가져오기
    getFilterValues() {
        return {
            period: document.getElementById('filter-period')?.value || '',
            vendor: document.getElementById('filter-vendor')?.value || '',
            accountCode: document.getElementById('filter-account')?.value || '',
            minAmount: parseInt(document.getElementById('filter-min-amount')?.value || '0'),
            maxAmount: parseInt(document.getElementById('filter-max-amount')?.value || '0')
        };
    }

    // 필터 적용
    applyFilters(entries, filters) {
        return entries.filter(entry => {
            if (filters.period && !entry.date.startsWith(filters.period)) return false;
            if (filters.vendor && !entry.vendor.includes(filters.vendor)) return false;
            if (filters.accountCode && entry.account_code !== filters.accountCode) return false;
            if (filters.minAmount > 0 && Math.abs(entry.amount) < filters.minAmount) return false;
            if (filters.maxAmount > 0 && Math.abs(entry.amount) > filters.maxAmount) return false;
            return true;
        });
    }

    // 필터링
    filterEntries() {
        this.renderLedgerTable();
    }

    // 분류 통계 업데이트
    updateClassificationStats() {
        const totalEntries = this.entries.length;
        const classifiedEntries = this.entries.filter(e => e.classification_status !== 'pending').length;
        const manualEntries = this.entries.filter(e => e.classification_status === 'manual').length;
        
        const classificationRate = totalEntries > 0 ? (classifiedEntries / totalEntries * 100).toFixed(1) : 0;
        
        this.updateElement('#classification-total .stat-value', totalEntries);
        this.updateElement('#classification-auto .stat-value', classifiedEntries - manualEntries);
        this.updateElement('#classification-manual .stat-value', manualEntries);
        this.updateElement('#classification-rate .stat-value', classificationRate + '%');
    }

    // 세금 진행률 업데이트
    updateTaxProgress() {
        const checklistItems = document.querySelectorAll('.checklist-item');
        const completedItems = document.querySelectorAll('.checklist-item.completed');
        const progress = checklistItems.length > 0 ? (completedItems.length / checklistItems.length * 100) : 0;
        
        const progressBar = document.querySelector('#tax-progress .progress-fill');
        const progressText = document.querySelector('#tax-progress .progress-text');
        
        if (progressBar) progressBar.style.width = progress + '%';
        if (progressText) progressText.textContent = `${progress.toFixed(0)}% 완료 (${completedItems.length}/${checklistItems.length})`;
        
        // 세금 계산 결과 표시
        if (this.taxStatus.period) {
            this.updateElement('#tax-sales-vat', this.formatCurrency(this.taxStatus.sales_vat || 0));
            this.updateElement('#tax-purchase-vat', this.formatCurrency(this.taxStatus.purchase_vat || 0));
            this.updateElement('#tax-due-vat', this.formatCurrency(this.taxStatus.estimated_due_vat || 0));
        }
    }

    // 리포트 뷰 업데이트
    updateReportsView() {
        const currentMonth = this.getCurrentPeriod();
        const report = this.reports[currentMonth];
        
        if (report) {
            this.updateElement('#report-period', report.period);
            this.updateElement('#report-entries', report.total_entries);
            this.updateElement('#report-amount', this.formatCurrency(report.total_amount));
            this.updateElement('#report-vat', this.formatCurrency(report.total_vat));
            this.updateElement('#report-classification', Math.round(report.classification_rate * 100) + '%');
        }
        
        // 차트 업데이트 (플레이스홀더)
        this.updateChartPlaceholder();
    }

    // 차트 플레이스홀더 업데이트
    updateChartPlaceholder() {
        const chartContainer = document.querySelector('.chart-placeholder');
        if (chartContainer) {
            chartContainer.innerHTML = `
                📊 월간 세무 통계 차트<br>
                <small style="color: var(--text-secondary); margin-top: 0.5rem; display: block;">
                    ${this.entries.length}개 항목 기준으로 생성됩니다.
                </small>
            `;
        }
    }

    // 업로드 상태 업데이트
    updateUploadStatus() {
        const csvCount = this.entries.filter(e => e.source === 'csv').length;
        const imageCount = this.entries.filter(e => e.source === 'image').length;
        
        this.updateElement('#csv-upload-count', csvCount + '건');
        this.updateElement('#image-upload-count', imageCount + '건');
    }

    // 진행률 표시
    showProgress(message, percentage) {
        const progressContainer = document.querySelector('.progress-container');
        const progressBar = document.querySelector('.progress-fill');
        const progressText = document.querySelector('.progress-text');
        
        if (progressContainer) {
            progressContainer.style.display = 'block';
            if (progressBar) progressBar.style.width = percentage + '%';
            if (progressText) progressText.textContent = message;
        }
    }

    // 진행률 숨기기
    hideProgress() {
        const progressContainer = document.querySelector('.progress-container');
        if (progressContainer) {
            setTimeout(() => {
                progressContainer.style.display = 'none';
            }, 1000);
        }
    }

    // 알림 표시
    showAlert(type, message) {
        const alertContainer = document.getElementById('alert-container');
        if (!alertContainer) return;
        
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.innerHTML = `
            <span>
                ${type === 'success' ? '✅' : type === 'warning' ? '⚠️' : type === 'danger' ? '❌' : 'ℹ️'}
            </span>
            <span>${message}</span>
        `;
        
        alertContainer.appendChild(alert);
        
        // 3초 후 자동 제거
        setTimeout(() => {
            alert.remove();
        }, 5000);
    }

    // 모달 표시
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    }

    // 모달 닫기
    closeModal() {
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    // 항목 상세 모달
    showEntryModal(entry) {
        const modalHtml = `
            <div class="modal-header">
                <h3>거래 상세정보</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="row">
                    <label>날짜:</label>
                    <span>${entry.date}</span>
                </div>
                <div class="row">
                    <label>업체명:</label>
                    <span>${entry.vendor}</span>
                </div>
                <div class="row">
                    <label>금액:</label>
                    <span style="color: ${entry.amount >= 0 ? 'var(--accent-color)' : 'var(--danger-color)'};">
                        ${this.formatCurrency(entry.amount)}
                    </span>
                </div>
                <div class="row">
                    <label>부가세:</label>
                    <span>${this.formatCurrency(entry.vat || 0)}</span>
                </div>
                <div class="row">
                    <label>메모:</label>
                    <span>${entry.memo || '없음'}</span>
                </div>
                <div class="row">
                    <label>계정코드:</label>
                    <span>${entry.account_code}</span>
                </div>
                <div class="row">
                    <label>과세구분:</label>
                    <span>${entry.tax_type}</span>
                </div>
                <div class="row">
                    <label>분류 신뢰도:</label>
                    <span class="${this.getConfidenceClass(entry.confidence)}">
                        ${entry.confidence ? Math.round(entry.confidence * 100) + '%' : '미분류'}
                    </span>
                </div>
            </div>
        `;
        
        const modalContent = document.querySelector('#entry-modal .modal-content');
        if (modalContent) {
            modalContent.innerHTML = modalHtml;
            this.showModal('entry-modal');
        }
    }

    // 리포트 다운로드
    downloadReport() {
        const currentMonth = this.getCurrentPeriod();
        const monthlyEntries = this.entries.filter(e => e.date.startsWith(currentMonth));
        
        if (monthlyEntries.length === 0) {
            this.showAlert('warning', '다운로드할 데이터가 없습니다.');
            return;
        }
        
        const csvContent = this.generateCsvReport(monthlyEntries);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `tax_report_${currentMonth}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        
        this.showAlert('success', `${currentMonth} 리포트가 다운로드되었습니다.`);
    }

    // CSV 리포트 생성
    generateCsvReport(entries) {
        const headers = ['날짜', '업체명', '금액', '부가세', '메모', '계정코드', '과세구분', '신뢰도'];
        const rows = [headers.join(',')];
        
        entries.forEach(entry => {
            const row = [
                entry.date,
                `"${entry.vendor}"`,
                entry.amount,
                entry.vat || 0,
                `"${entry.memo || ''}"`,
                entry.account_code,
                entry.tax_type,
                entry.confidence ? Math.round(entry.confidence * 100) + '%' : ''
            ];
            rows.push(row.join(','));
        });
        
        return '\ufeff' + rows.join('\n'); // BOM for UTF-8
    }

    // 샘플 데이터 로드
    loadSampleData() {
        if (this.entries.length === 0) {
            this.entries = [
                {
                    id: 1,
                    date: '2025-09-01',
                    vendor: '서울 식당',
                    amount: 35000,
                    vat: 3500,
                    memo: '점심 식사',
                    account_code: '접대비',
                    tax_type: '과세',
                    confidence: 0.95,
                    classification_status: 'auto',
                    source: 'sample'
                },
                {
                    id: 2,
                    date: '2025-09-02',
                    vendor: '사무용품 마트',
                    amount: 12000,
                    vat: 1200,
                    memo: '볼펜, 포스트잇',
                    account_code: '사무용품비',
                    tax_type: '과세',
                    confidence: 0.88,
                    classification_status: 'auto',
                    source: 'sample'
                },
                {
                    id: 3,
                    date: '2025-09-03',
                    vendor: '통신사',
                    amount: 45000,
                    vat: 4500,
                    memo: '월 통신비',
                    account_code: '통신비',
                    tax_type: '과세',
                    confidence: 0.99,
                    classification_status: 'auto',
                    source: 'sample'
                }
            ];
            this.saveToLocalStorage();
        }
    }

    // API에서 데이터 로드
    async loadEntries() {
        if (!this.isApiAvailable) return;
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/entries/list?period=${this.getCurrentPeriod()}`);
            const result = await response.json();
            
            if (result.ok && result.items) {
                this.entries = result.items;
                this.saveToLocalStorage();
                this.updateSummaryCards();
                this.renderLedgerTable();
            }
        } catch (error) {
            console.warn('API에서 데이터 로드 실패:', error);
        }
    }

    // 로컬스토리지에서 데이터 로드
    loadFromLocalStorage() {
        const saved = localStorage.getItem('easytax_data');
        if (saved) {
            const data = JSON.parse(saved);
            this.entries = data.entries || [];
            this.reports = data.reports || {};
            this.taxStatus = data.taxStatus || {};
        }
    }

    // 로컬스토리지에 데이터 저장
    saveToLocalStorage() {
        const data = {
            entries: this.entries,
            reports: this.reports,
            taxStatus: this.taxStatus,
            lastUpdated: new Date().toISOString()
        };
        localStorage.setItem('easytax_data', JSON.stringify(data));
    }

    // 영수증에서 항목 추가
    addEntryFromReceipt(receiptData) {
        const entry = {
            id: Date.now(),
            date: receiptData.date || new Date().toISOString().split('T')[0],
            vendor: receiptData.vendor || '영수증 업로드',
            amount: receiptData.amount || 0,
            vat: receiptData.vat || 0,
            memo: receiptData.memo || '영수증 분석 결과',
            account_code: receiptData.account_code || '미분류',
            tax_type: receiptData.tax_type || '과세',
            confidence: receiptData.confidence || 0.7,
            classification_status: 'auto',
            source: 'receipt'
        };
        
        this.entries.push(entry);
        this.saveToLocalStorage();
        this.updateSummaryCards();
        this.renderLedgerTable();
    }

    // 현재 기간 반환
    getCurrentPeriod() {
        return new Date().toISOString().slice(0, 7); // YYYY-MM
    }

    // 신뢰도 클래스 반환
    getConfidenceClass(confidence) {
        if (!confidence) return '';
        if (confidence < 0.6) return 'conf-low';
        if (confidence < 0.8) return 'conf-mid';
        return 'conf-high';
    }

    // 통화 형식 지정
    formatCurrency(amount) {
        return new Intl.NumberFormat('ko-KR').format(amount) + '원';
    }

    // DOM 요소 업데이트
    updateElement(selector, content) {
        const element = document.querySelector(selector);
        if (element) {
            element.textContent = content;
        }
    }

    // 전역 에러 핸들링
    handleGlobalError(event) {
        console.error('전역 에러:', event.error);
        this.showAlert('danger', '예상치 못한 오류가 발생했습니다.');
    }

    // Promise 거부 핸들링
    handleUnhandledRejection(event) {
        console.error('미처리 Promise 거부:', event.reason);
        event.preventDefault();
    }
}

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 YouArePlan EasyTax v8 가계부형 UI 로딩 중...');
    window.easyTaxApp = new EasyTaxApp();
});