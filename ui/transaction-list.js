// YouArePlan Tax AI - 거래 목록 관리 모듈 (토스 스타일)
// 필터링, 정렬, 페이지네이션, 반응형 디자인 지원

class TransactionListManager {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.totalItems = 0;
        this.allTransactions = [];
        this.filteredTransactions = [];
        this.sortField = 'date';
        this.sortOrder = 'desc';

        // 필터 상태
        this.filters = {
            period: 'current-month',
            type: 'all',
            search: ''
        };

        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadTransactions();
    }

    // 이벤트 바인딩
    bindEvents() {
        // 필터 이벤트
        const periodFilter = document.getElementById('period-filter');
        const typeFilter = document.getElementById('type-filter');
        const searchInput = document.getElementById('search-input');
        const searchButton = document.getElementById('search-button');
        const resetFilters = document.getElementById('reset-filters');

        if (periodFilter) {
            periodFilter.addEventListener('change', () => {
                this.filters.period = periodFilter.value;
                this.applyFilters();
            });
        }

        if (typeFilter) {
            typeFilter.addEventListener('change', () => {
                this.filters.type = typeFilter.value;
                this.applyFilters();
            });
        }

        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(() => {
                this.filters.search = searchInput.value;
                this.applyFilters();
            }, 300));

            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.filters.search = searchInput.value;
                    this.applyFilters();
                }
            });
        }

        if (searchButton) {
            searchButton.addEventListener('click', () => {
                this.filters.search = searchInput?.value || '';
                this.applyFilters();
            });
        }

        if (resetFilters) {
            resetFilters.addEventListener('click', () => {
                this.resetFilters();
            });
        }

        // 정렬 이벤트
        document.querySelectorAll('.sortable').forEach(header => {
            header.addEventListener('click', () => {
                const field = header.getAttribute('data-sort');
                this.handleSort(field);
            });
        });

        // 페이지네이션 이벤트
        const prevPageBtn = document.getElementById('prev-page');
        const nextPageBtn = document.getElementById('next-page');

        if (prevPageBtn) {
            prevPageBtn.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.renderCurrentPage();
                }
            });
        }

        if (nextPageBtn) {
            nextPageBtn.addEventListener('click', () => {
                const totalPages = Math.ceil(this.filteredTransactions.length / this.itemsPerPage);
                if (this.currentPage < totalPages) {
                    this.currentPage++;
                    this.renderCurrentPage();
                }
            });
        }
    }

    // API에서 거래 데이터 로드
    async loadTransactions() {
        this.showLoading(true);

        try {
            const response = await this.apiCall('/entries/list?per_page=100');

            if (response.success) {
                this.allTransactions = response.data.map(entry => ({
                    id: entry.id,
                    date: entry.trx_date,
                    vendor: entry.vendor,
                    amount: parseFloat(entry.amount) || 0,
                    vat: parseFloat(entry.vat) || 0,
                    memo: entry.memo || '',
                    account_code: entry.account_code,
                    tax_type: entry.tax_type,
                    type: parseFloat(entry.amount) > 0 ? 'income' : 'expense',
                    classified: !!(entry.account_code && entry.tax_type)
                }));

                console.log('📊 거래 데이터 로드 완료:', this.allTransactions.length, '건');
                this.applyFilters();
            } else {
                throw new Error(response.message || '데이터 로드 실패');
            }
        } catch (error) {
            console.error('❌ 거래 데이터 로드 오류:', error);
            this.showError('거래 데이터를 불러오는데 실패했습니다.');
        } finally {
            this.showLoading(false);
        }
    }

    // API 호출 헬퍼
    async apiCall(endpoint, options = {}) {
        const url = `http://localhost:8080${endpoint}`;
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        };

        const response = await fetch(url, { ...defaultOptions, ...options });
        return await response.json();
    }

    // 필터 적용
    applyFilters() {
        let filtered = [...this.allTransactions];

        // 기간 필터
        if (this.filters.period !== 'all') {
            const now = new Date();
            let startDate, endDate;

            switch (this.filters.period) {
                case 'current-month':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                    break;
                case 'last-month':
                    startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    endDate = new Date(now.getFullYear(), now.getMonth(), 0);
                    break;
                case 'current-quarter':
                    const quarter = Math.floor(now.getMonth() / 3);
                    startDate = new Date(now.getFullYear(), quarter * 3, 1);
                    endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
                    break;
            }

            if (startDate && endDate) {
                filtered = filtered.filter(transaction => {
                    const transactionDate = new Date(transaction.date);
                    return transactionDate >= startDate && transactionDate <= endDate;
                });
            }
        }

        // 거래 유형 필터
        if (this.filters.type !== 'all') {
            filtered = filtered.filter(transaction => transaction.type === this.filters.type);
        }

        // 검색 필터
        if (this.filters.search) {
            const searchTerm = this.filters.search.toLowerCase();
            filtered = filtered.filter(transaction =>
                (transaction.vendor || '').toLowerCase().includes(searchTerm) ||
                (transaction.memo || '').toLowerCase().includes(searchTerm)
            );
        }

        this.filteredTransactions = filtered;
        this.currentPage = 1;
        this.sortTransactions();
        this.renderCurrentPage();
        this.updateResultsCount();
    }

    // 정렬 처리
    handleSort(field) {
        if (this.sortField === field) {
            this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = field;
            this.sortOrder = 'desc';
        }

        this.sortTransactions();
        this.renderCurrentPage();
        this.updateSortIndicators();
    }

    // 거래 데이터 정렬
    sortTransactions() {
        this.filteredTransactions.sort((a, b) => {
            let valueA, valueB;

            switch (this.sortField) {
                case 'date':
                    valueA = new Date(a.date);
                    valueB = new Date(b.date);
                    break;
                case 'vendor':
                    valueA = (a.vendor || '').toLowerCase();
                    valueB = (b.vendor || '').toLowerCase();
                    break;
                case 'amount':
                    valueA = Math.abs(a.amount);
                    valueB = Math.abs(b.amount);
                    break;
                default:
                    return 0;
            }

            if (valueA < valueB) return this.sortOrder === 'asc' ? -1 : 1;
            if (valueA > valueB) return this.sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    }

    // 현재 페이지 렌더링
    renderCurrentPage() {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageData = this.filteredTransactions.slice(startIndex, endIndex);

        this.renderDesktopTable(pageData);
        this.renderMobileCards(pageData);
        this.renderPagination();
    }

    // 데스크톱 테이블 렌더링
    renderDesktopTable(transactions) {
        const tbody = document.getElementById('transaction-table-body');
        if (!tbody) return;

        tbody.innerHTML = transactions.map(transaction => this.createTableRow(transaction)).join('');

        // 액션 버튼 이벤트 바인딩
        this.bindActionEvents();
    }

    // 모바일 카드 렌더링
    renderMobileCards(transactions) {
        const container = document.getElementById('transaction-cards');
        if (!container) return;

        container.innerHTML = transactions.map(transaction => this.createMobileCard(transaction)).join('');

        // 스와이프 및 액션 이벤트 바인딩
        this.bindMobileEvents();
    }

    // 테이블 행 생성
    createTableRow(transaction) {
        const isPositive = transaction.amount > 0;
        const formattedDate = this.formatDate(transaction.date);
        const formattedAmount = this.formatCurrency(Math.abs(transaction.amount));
        const formattedVat = this.formatCurrency(Math.abs(transaction.vat));

        return `
            <tr data-id="${transaction.id}">
                <td>${formattedDate}</td>
                <td>
                    <div class="vendor-info">
                        <div class="vendor-name">${transaction.vendor || '미지정'}</div>
                        ${transaction.memo ? `<div class="vendor-memo">${transaction.memo}</div>` : ''}
                    </div>
                </td>
                <td>
                    <span class="transaction-type-badge ${transaction.type}">
                        ${transaction.type === 'income' ? '📈 매출' : '📉 매입'}
                    </span>
                </td>
                <td>
                    <span class="transaction-amount ${isPositive ? 'positive' : 'negative'}">
                        ${formattedAmount}원
                    </span>
                </td>
                <td>${formattedVat}원</td>
                <td>
                    <span class="transaction-status ${transaction.classified ? 'classified' : 'unclassified'}">
                        ${transaction.classified ? '✅ 분류완료' : '⏳ 미분류'}
                    </span>
                </td>
                <td>
                    <div class="transaction-actions">
                        <button class="action-btn edit" data-action="edit" data-id="${transaction.id}">
                            ✏️ 수정
                        </button>
                        <button class="action-btn delete" data-action="delete" data-id="${transaction.id}">
                            🗑️ 삭제
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    // 모바일 카드 생성
    createMobileCard(transaction) {
        const isPositive = transaction.amount > 0;
        const formattedDate = this.formatDate(transaction.date);
        const formattedAmount = this.formatCurrency(Math.abs(transaction.amount));

        return `
            <div class="transaction-card" data-id="${transaction.id}">
                <div class="transaction-card-header">
                    <span class="transaction-card-date">${formattedDate}</span>
                    <span class="transaction-type-badge ${transaction.type}">
                        ${transaction.type === 'income' ? '📈 매출' : '📉 매입'}
                    </span>
                </div>

                <div class="transaction-card-body">
                    <div class="transaction-card-vendor">${transaction.vendor || '미지정'}</div>
                    ${transaction.memo ? `<div class="transaction-card-memo">${transaction.memo}</div>` : ''}
                </div>

                <div class="transaction-card-footer">
                    <span class="transaction-card-amount ${isPositive ? 'positive' : 'negative'}">
                        ${formattedAmount}원
                    </span>
                    <span class="transaction-status ${transaction.classified ? 'classified' : 'unclassified'}">
                        ${transaction.classified ? '✅ 분류완료' : '⏳ 미분류'}
                    </span>
                </div>

                <div class="transaction-card-actions">
                    <button class="action-btn edit" data-action="edit" data-id="${transaction.id}">
                        ✏️
                    </button>
                    <button class="action-btn delete" data-action="delete" data-id="${transaction.id}">
                        🗑️
                    </button>
                </div>
            </div>
        `;
    }

    // 액션 버튼 이벤트 바인딩
    bindActionEvents() {
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.getAttribute('data-action');
                const id = btn.getAttribute('data-id');
                this.handleAction(action, id);
            });
        });
    }

    // 모바일 스와이프 이벤트
    bindMobileEvents() {
        document.querySelectorAll('.transaction-card').forEach(card => {
            let startX = 0;
            let currentX = 0;
            let isSwipeActive = false;

            card.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                isSwipeActive = true;
            });

            card.addEventListener('touchmove', (e) => {
                if (!isSwipeActive) return;

                currentX = e.touches[0].clientX;
                const deltaX = startX - currentX;

                if (deltaX > 0 && deltaX <= 80) {
                    card.style.transform = `translateX(-${deltaX}px)`;
                }
            });

            card.addEventListener('touchend', (e) => {
                if (!isSwipeActive) return;

                const deltaX = startX - currentX;

                if (deltaX > 40) {
                    card.classList.add('swipe-active');
                } else {
                    card.style.transform = '';
                }

                isSwipeActive = false;
            });

            // 탭으로 스와이프 해제
            card.addEventListener('click', () => {
                if (card.classList.contains('swipe-active')) {
                    card.classList.remove('swipe-active');
                    card.style.transform = '';
                }
            });
        });

        this.bindActionEvents(); // 모바일 액션 버튼도 바인딩
    }

    // 액션 처리
    async handleAction(action, transactionId) {
        const transaction = this.allTransactions.find(t => t.id == transactionId);
        if (!transaction) return;

        if (action === 'edit') {
            this.openEditModal(transaction);
        } else if (action === 'delete') {
            if (confirm(`"${transaction.vendor}" 거래를 삭제하시겠습니까?`)) {
                await this.deleteTransaction(transactionId);
            }
        }
    }

    // 거래 삭제
    async deleteTransaction(transactionId) {
        try {
            // API 호출로 삭제 (실제 구현에서는 DELETE 엔드포인트 사용)
            console.log('🗑️ 거래 삭제:', transactionId);

            // 로컬 데이터에서 제거
            this.allTransactions = this.allTransactions.filter(t => t.id != transactionId);
            this.applyFilters();

            if (window.taxAI && window.taxAI.showToast) {
                window.taxAI.showToast('거래가 삭제되었습니다.', 'success');
            }

            // 프로그레스 업데이트
            if (window.taxAI && window.taxAI.updateProgressFromData) {
                setTimeout(() => window.taxAI.updateProgressFromData(), 500);
            }

        } catch (error) {
            console.error('❌ 거래 삭제 오류:', error);
            if (window.taxAI && window.taxAI.showToast) {
                window.taxAI.showToast('거래 삭제에 실패했습니다.', 'error');
            }
        }
    }

    // 수정 모달 열기 (간단한 구현)
    openEditModal(transaction) {
        // 간단한 프롬프트로 구현 (추후 모달로 개선 가능)
        const newVendor = prompt('거래처명을 수정하세요:', transaction.vendor);
        const newMemo = prompt('메모를 수정하세요:', transaction.memo);

        if (newVendor !== null || newMemo !== null) {
            // 로컬 데이터 업데이트
            transaction.vendor = newVendor || transaction.vendor;
            transaction.memo = newMemo || transaction.memo;

            this.renderCurrentPage();

            if (window.taxAI && window.taxAI.showToast) {
                window.taxAI.showToast('거래가 수정되었습니다.', 'success');
            }
        }
    }

    // 페이지네이션 렌더링
    renderPagination() {
        const totalPages = Math.ceil(this.filteredTransactions.length / this.itemsPerPage);
        const startItem = (this.currentPage - 1) * this.itemsPerPage + 1;
        const endItem = Math.min(this.currentPage * this.itemsPerPage, this.filteredTransactions.length);

        // 페이지 정보 업데이트
        const infoElement = document.getElementById('pagination-info-text');
        if (infoElement) {
            infoElement.textContent = `${startItem}-${endItem} / ${this.filteredTransactions.length}개`;
        }

        // 이전/다음 버튼 상태
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');

        if (prevBtn) prevBtn.disabled = this.currentPage <= 1;
        if (nextBtn) nextBtn.disabled = this.currentPage >= totalPages;

        // 페이지 번호 버튼 생성
        this.renderPageNumbers(totalPages);
    }

    // 페이지 번호 버튼 렌더링
    renderPageNumbers(totalPages) {
        const container = document.getElementById('pagination-numbers');
        if (!container) return;

        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        let html = '';
        for (let i = startPage; i <= endPage; i++) {
            html += `
                <button class="pagination-number ${i === this.currentPage ? 'active' : ''}"
                        data-page="${i}">${i}</button>
            `;
        }

        container.innerHTML = html;

        // 페이지 번호 클릭 이벤트
        container.querySelectorAll('.pagination-number').forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentPage = parseInt(btn.getAttribute('data-page'));
                this.renderCurrentPage();
            });
        });
    }

    // 결과 수 업데이트
    updateResultsCount() {
        const countElement = document.getElementById('results-count');
        if (countElement) {
            countElement.textContent = `총 ${this.filteredTransactions.length}건`;
        }
    }

    // 정렬 표시기 업데이트
    updateSortIndicators() {
        document.querySelectorAll('.sortable').forEach(header => {
            header.classList.remove('sorted', 'asc', 'desc');
            if (header.getAttribute('data-sort') === this.sortField) {
                header.classList.add('sorted', this.sortOrder);
            }
        });
    }

    // 필터 초기화
    resetFilters() {
        this.filters = {
            period: 'current-month',
            type: 'all',
            search: ''
        };

        // UI 초기화
        const periodFilter = document.getElementById('period-filter');
        const typeFilter = document.getElementById('type-filter');
        const searchInput = document.getElementById('search-input');

        if (periodFilter) periodFilter.value = 'current-month';
        if (typeFilter) typeFilter.value = 'all';
        if (searchInput) searchInput.value = '';

        this.applyFilters();
    }

    // 로딩 상태 표시
    showLoading(show) {
        const loadingElement = document.getElementById('transactions-loading');
        const tableContainer = document.querySelector('.transaction-table-container');
        const cardsContainer = document.querySelector('.transaction-cards');
        const paginationContainer = document.getElementById('pagination-container');

        if (loadingElement) {
            loadingElement.style.display = show ? 'flex' : 'none';
        }

        [tableContainer, cardsContainer, paginationContainer].forEach(element => {
            if (element) {
                element.style.display = show ? 'none' : '';
            }
        });
    }

    // 오류 표시
    showError(message) {
        const emptyElement = document.getElementById('transactions-empty');
        if (emptyElement) {
            emptyElement.querySelector('.empty-message').textContent = '오류 발생';
            emptyElement.querySelector('.empty-submessage').textContent = message;
            emptyElement.classList.remove('hidden');
        }
    }

    // 유틸리티 함수들
    formatDate(dateString) {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('ko-KR', {
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return dateString;
        }
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('ko-KR').format(amount);
    }

    debounce(func, wait) {
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
}

// TaxAIApp에 거래 목록 기능 추가
TaxAIApp.prototype.initTransactionList = function() {
    // 조회 탭이 활성화될 때 거래 목록 매니저 초기화
    const viewTabButton = document.querySelector('[data-tab="view"]');
    if (viewTabButton) {
        viewTabButton.addEventListener('click', () => {
            setTimeout(() => {
                if (!this.transactionListManager) {
                    console.log('📋 거래 목록 매니저 초기화');
                    this.transactionListManager = new TransactionListManager();
                }
            }, 100);
        });
    }
};

// 앱 초기화 시 거래 목록 기능 추가
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.taxAI) {
            window.taxAI.initTransactionList();
        }
    }, 1000);
});