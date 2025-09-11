// YouArePlan EasyTax - 세무 AI 코파일럿 v8
// API 호출 및 UI 상호작용 스크립트

const API = (path) => path; // API 엔드포인트 기본 경로

// 초기 대시보드 진입 시 프리패치
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 YouArePlan EasyTax v8 - 초기화 중...');
    
    // 필수 API 프리패치 (병렬 호출)
    try {
        const [healthCheck, apiStatus] = await Promise.all([
            fetch('/health'),
            fetch('/api/status')
        ]);
        
        if (healthCheck.ok && apiStatus.ok) {
            console.log('✅ API 서버 연결 확인');
            showMessage('global-status', 'API 서버 연결됨', true);
        }
    } catch (error) {
        console.error('⚠️ API 서버 연결 실패:', error);
        showMessage('global-status', 'API 서버 연결 실패', false);
    }
});

// 로딩 상태 관리
function setLoading(element, isLoading) {
    const card = element.closest('.card');
    if (isLoading) {
        card.classList.add('loading');
    } else {
        card.classList.remove('loading');
    }
}

// 성공/오류 메시지 표시
function showMessage(elementId, message, isSuccess = true) {
    const element = document.getElementById(elementId);
    element.innerHTML = isSuccess ? 
        `<span style="color: var(--accent-color);">✅ ${message}</span>` : 
        `<span style="color: var(--danger-color);">❌ ${message}</span>`;
}

// 결과 디스플레이 업데이트
function updateResultDisplay(elementId, data) {
    const element = document.getElementById(elementId);
    if (typeof data === 'object') {
        element.innerHTML = `<pre style="margin: 0; white-space: pre-wrap;">${JSON.stringify(data, null, 2)}</pre>`;
    } else {
        element.textContent = data;
    }
}

// API 호출 함수들
async function postForm(url, formData) {
    try {
        const response = await fetch(API(url), {
            method: 'POST',
            body: formData
        });
        return await response.json();
    } catch (error) {
        console.error('API 호출 오류:', error);
        throw error;
    }
}

async function getJson(url) {
    try {
        const response = await fetch(API(url));
        return await response.json();
    } catch (error) {
        console.error('API 호출 오류:', error);
        throw error;
    }
}

// 1단계: 파일 업로드
document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const uploadBtn = e.target.querySelector('button[type="submit"]');
    setLoading(uploadBtn, true);
    
    try {
        const formData = new FormData();
        formData.append('period', document.getElementById('period').value);
        formData.append('source', document.getElementById('source').value);
        
        const fileInput = document.getElementById('file');
        const file = fileInput.files[0];
        if (!file) {
            alert('📁 업로드할 CSV 파일을 선택해주세요.');
            return;
        }
        
        formData.append('file', file, file.name);
        
        const result = await postForm('/ingest/upload', formData);
        
        if (result.ok) {
            showMessage('uploadResult', 
                `업로드 성공! ${result.stored_entries}개 항목 저장, ${result.classified}개 자동 분류됨`);
            
            // 자동으로 분류 결과 조회
            const period = document.getElementById('period').value;
            document.getElementById('listPeriod').value = period;
            document.getElementById('btnList').click();
        } else {
            showMessage('uploadResult', '업로드 실패: ' + (result.error || '알 수 없는 오류'), false);
        }
    } catch (error) {
        showMessage('uploadResult', '네트워크 오류: ' + error.message, false);
    } finally {
        setLoading(uploadBtn, false);
    }
});

// 2단계: 분류 결과 조회
document.getElementById('btnList').addEventListener('click', async () => {
    const btn = document.getElementById('btnList');
    setLoading(btn, true);
    
    try {
        const period = document.getElementById('listPeriod').value || '';
        const result = await getJson(`/entries/list?period=${encodeURIComponent(period)}`);
        
        const tbody = document.querySelector('#tbl tbody');
        tbody.innerHTML = '';
        
        if (result.ok && result.items && result.items.length > 0) {
            result.items.forEach(item => {
                const confidence = item.confidence ? parseFloat(item.confidence) : null;
                const confidenceClass = confidence === null ? '' : 
                    confidence < 0.6 ? 'conf-low' : 
                    confidence < 0.8 ? 'conf-mid' : 'conf-high';
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.date || '-'}</td>
                    <td>${item.vendor || '-'}</td>
                    <td style="text-align: right;">${item.amount ? item.amount.toLocaleString() + '원' : '-'}</td>
                    <td style="text-align: right;">${item.vat ? item.vat.toLocaleString() + '원' : '-'}</td>
                    <td>${item.memo || '-'}</td>
                    <td><span style="padding: 0.25rem 0.5rem; background: #e3f2fd; border-radius: 4px; font-size: 0.8rem;">${item.account_code || '-'}</span></td>
                    <td><span style="padding: 0.25rem 0.5rem; background: ${item.tax_type === '과세' ? '#e8f5e8' : '#fff3cd'}; border-radius: 4px; font-size: 0.8rem;">${item.tax_type || '-'}</span></td>
                    <td class="${confidenceClass}" style="text-align: center;">${confidence ? (confidence * 100).toFixed(0) + '%' : '-'}</td>
                `;
                tbody.appendChild(row);
            });
        } else {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="8" style="text-align: center; color: var(--text-secondary);">조회된 데이터가 없습니다. 먼저 CSV 파일을 업로드해주세요.</td>';
            tbody.appendChild(row);
        }
    } catch (error) {
        console.error('분류 결과 조회 오류:', error);
        const tbody = document.querySelector('#tbl tbody');
        tbody.innerHTML = '<td colspan="8" style="text-align: center; color: var(--danger-color);">조회 중 오류가 발생했습니다.</td>';
    } finally {
        setLoading(btn, false);
    }
});

// 3단계: 세액 계산
document.getElementById('btnEstimate').addEventListener('click', async () => {
    const btn = document.getElementById('btnEstimate');
    setLoading(btn, true);
    
    try {
        const period = document.getElementById('estPeriod').value;
        if (!period) {
            alert('계산할 기간을 입력해주세요 (예: 2025-06)');
            return;
        }
        
        const result = await getJson(`/tax/estimate?period=${encodeURIComponent(period)}`);
        
        if (result.ok) {
            const displayData = {
                "📊 세액 계산 결과": `${result.period} 기간`,
                "💰 매출 부가세": `${result.sales_vat?.toLocaleString() || 0}원`,
                "💳 매입 부가세": `${result.purchase_vat?.toLocaleString() || 0}원`, 
                "🚫 불공제 부가세": `${result.non_deductible_vat?.toLocaleString() || 0}원`,
                "📈 납부할 부가세": `${result.estimated_due_vat?.toLocaleString() || 0}원`
            };
            updateResultDisplay('estOut', displayData);
        } else {
            updateResultDisplay('estOut', '세액 계산 중 오류가 발생했습니다.');
        }
    } catch (error) {
        console.error('세액 계산 오류:', error);
        updateResultDisplay('estOut', '네트워크 오류가 발생했습니다.');
    } finally {
        setLoading(btn, false);
    }
});

// 4단계: 체크리스트 생성
document.getElementById('btnPrep').addEventListener('click', async () => {
    const btn = document.getElementById('btnPrep');
    setLoading(btn, true);
    
    try {
        const period = document.getElementById('prepPeriod').value;
        if (!period) {
            alert('체크리스트를 생성할 기간을 입력해주세요 (예: 2025-06)');
            return;
        }
        
        const response = await fetch(`/prep/refresh?period=${encodeURIComponent(period)}&taxType=VAT`, {
            method: 'POST'
        });
        const result = await response.json();
        
        if (result.ok) {
            const displayData = {
                "📋 체크리스트 생성 완료": `${result.generated}개 항목 생성됨`,
                "🔍 발견된 주의사항": result.signals?.map(s => `• ${s.code}: ${s.desc}`).join('\n') || '없음'
            };
            updateResultDisplay('prepOut', displayData);
        } else {
            updateResultDisplay('prepOut', '체크리스트 생성 중 오류가 발생했습니다.');
        }
    } catch (error) {
        console.error('체크리스트 생성 오류:', error);
        updateResultDisplay('prepOut', '네트워크 오류가 발생했습니다.');
    } finally {
        setLoading(btn, false);
    }
});

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎉 YouArePlan EasyTax v8 로드 완료');
    
    // 기본값 설정
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM 형식
    document.getElementById('period').value = currentMonth;
    document.getElementById('listPeriod').value = currentMonth;
    document.getElementById('estPeriod').value = currentMonth;
    document.getElementById('prepPeriod').value = currentMonth;
    
    // 네비게이션 링크 스크롤 이벤트
    document.querySelectorAll('.main-nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const target = document.querySelector(targetId);
            if (target) {
                target.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start' 
                });
            }
        });
    });
});

// 전역 오류 처리
window.addEventListener('error', function(e) {
    console.error('전역 오류 발생:', e.error);
});

// 미처리 Promise 오류 처리
window.addEventListener('unhandledrejection', function(e) {
    console.error('미처리 Promise 오류:', e.reason);
    e.preventDefault();
});