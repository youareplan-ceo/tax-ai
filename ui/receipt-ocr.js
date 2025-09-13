/**
 * 영수증 OCR 및 스마트 알림 시스템
 * 카메라/파일 업로드를 통한 영수증 자동 인식 및 데이터 추출
 */

class ReceiptOCRSystem {
    constructor() {
        this.isProcessing = false;
        this.supportedFormats = ['image/jpeg', 'image/png', 'image/webp'];
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
        
        this.init();
    }

    init() {
        this.initOCRInterface();
        this.initNotificationSystem();
        this.initCalendarSystem();
        this.checkCameraSupport();
    }

    // OCR 인터페이스 초기화
    initOCRInterface() {
        // 업로드 섹션에 OCR 기능 추가
        const uploadSection = document.querySelector('#upload-section .card');
        if (uploadSection) {
            this.addOCRInterface(uploadSection);
        }
    }

    addOCRInterface(container) {
        const ocrContainer = document.createElement('div');
        ocrContainer.className = 'ocr-container';
        ocrContainer.style.cssText = `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 16px;
            padding: 24px;
            color: white;
            margin-bottom: 24px;
            position: relative;
            overflow: hidden;
        `;

        ocrContainer.innerHTML = `
            <div style="position: relative; z-index: 2;">
                <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 20px;">
                    <div style="
                        width: 50px;
                        height: 50px;
                        background: rgba(255, 255, 255, 0.2);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 24px;
                    ">📸</div>
                    <div>
                        <h3 style="margin: 0; font-size: 20px; font-weight: 700;">스마트 영수증 인식</h3>
                        <p style="margin: 4px 0 0; opacity: 0.9; font-size: 14px;">
                            AI가 영수증을 자동으로 분석하여 거래 정보를 추출합니다
                        </p>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
                    <button id="camera-capture" style="
                        background: rgba(255, 255, 255, 0.2);
                        border: 2px solid rgba(255, 255, 255, 0.3);
                        color: white;
                        padding: 16px;
                        border-radius: 12px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        backdrop-filter: blur(10px);
                    " onmouseover="this.style.background='rgba(255, 255, 255, 0.3)'" 
                       onmouseout="this.style.background='rgba(255, 255, 255, 0.2)'">
                        📷 카메라로 촬영
                    </button>
                    
                    <button id="file-upload-ocr" style="
                        background: rgba(255, 255, 255, 0.2);
                        border: 2px solid rgba(255, 255, 255, 0.3);
                        color: white;
                        padding: 16px;
                        border-radius: 12px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        backdrop-filter: blur(10px);
                    " onmouseover="this.style.background='rgba(255, 255, 255, 0.3)'" 
                       onmouseout="this.style.background='rgba(255, 255, 255, 0.2)'">
                        📁 파일 선택
                    </button>
                </div>

                <div id="ocr-result" style="display: none; margin-top: 20px;">
                    <div style="
                        background: rgba(255, 255, 255, 0.1);
                        border-radius: 12px;
                        padding: 16px;
                        backdrop-filter: blur(10px);
                    ">
                        <h4 style="margin: 0 0 12px; font-size: 16px;">✅ 영수증 분석 완료</h4>
                        <div id="extracted-data" style="
                            font-size: 14px;
                            line-height: 1.6;
                        "></div>
                        <div style="display: flex; gap: 12px; margin-top: 16px;">
                            <button id="apply-ocr-data" style="
                                background: #00C851;
                                color: white;
                                border: none;
                                padding: 12px 20px;
                                border-radius: 8px;
                                font-weight: 600;
                                cursor: pointer;
                                font-size: 14px;
                            ">적용하기</button>
                            <button id="edit-ocr-data" style="
                                background: rgba(255, 255, 255, 0.2);
                                color: white;
                                border: 1px solid rgba(255, 255, 255, 0.3);
                                padding: 12px 20px;
                                border-radius: 8px;
                                font-weight: 600;
                                cursor: pointer;
                                font-size: 14px;
                            ">수정하기</button>
                        </div>
                    </div>
                </div>

                <p style="
                    margin: 16px 0 0;
                    font-size: 12px;
                    opacity: 0.8;
                    text-align: center;
                ">
                    지원 형식: JPG, PNG, WebP (최대 10MB)
                </p>
            </div>

            <!-- 배경 애니메이션 -->
            <div style="
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px);
                background-size: 50px 50px;
                animation: float 20s infinite linear;
                z-index: 1;
            "></div>
        `;

        // 기존 업로드 존 앞에 삽입
        const uploadZone = container.querySelector('.upload-zone');
        container.insertBefore(ocrContainer, uploadZone);

        // 이벤트 리스너 추가
        this.attachOCREvents();
    }

    attachOCREvents() {
        // 카메라 캡처 버튼
        document.getElementById('camera-capture')?.addEventListener('click', () => {
            this.openCamera();
        });

        // 파일 업로드 버튼
        document.getElementById('file-upload-ocr')?.addEventListener('click', () => {
            this.openFileDialog();
        });

        // 적용 버튼
        document.getElementById('apply-ocr-data')?.addEventListener('click', () => {
            this.applyExtractedData();
        });

        // 수정 버튼
        document.getElementById('edit-ocr-data')?.addEventListener('click', () => {
            this.editExtractedData();
        });
    }

    checkCameraSupport() {
        this.cameraSupported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
        
        if (!this.cameraSupported) {
            const cameraButton = document.getElementById('camera-capture');
            if (cameraButton) {
                cameraButton.disabled = true;
                cameraButton.textContent = '📷 카메라 미지원';
                cameraButton.style.opacity = '0.5';
            }
        }
    }

    async openCamera() {
        if (!this.cameraSupported) {
            this.showNotification('카메라가 지원되지 않는 브라우저입니다.', 'error');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                } 
            });
            
            this.showCameraModal(stream);
        } catch (error) {
            console.error('카메라 접근 실패:', error);
            this.showNotification('카메라에 접근할 수 없습니다. 권한을 확인해주세요.', 'error');
        }
    }

    showCameraModal(stream) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 10000;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        `;

        modal.innerHTML = `
            <div style="position: relative; max-width: 90%; max-height: 80%;">
                <video id="camera-video" autoplay playsinline style="
                    width: 100%;
                    height: auto;
                    border-radius: 12px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
                "></video>
                
                <canvas id="capture-canvas" style="display: none;"></canvas>
                
                <div style="
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 80%;
                    height: 60%;
                    border: 2px dashed rgba(255, 255, 255, 0.5);
                    border-radius: 12px;
                    pointer-events: none;
                "></div>
            </div>
            
            <div style="
                display: flex;
                gap: 20px;
                margin-top: 20px;
                align-items: center;
            ">
                <button id="capture-button" style="
                    width: 70px;
                    height: 70px;
                    border-radius: 50%;
                    background: white;
                    border: 4px solid #0064FF;
                    cursor: pointer;
                    transition: transform 0.2s ease;
                    font-size: 24px;
                " onmouseover="this.style.transform='scale(1.1)'" 
                   onmouseout="this.style.transform='scale(1)'">📸</button>
                
                <button id="close-camera" style="
                    background: rgba(255, 255, 255, 0.2);
                    color: white;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    padding: 12px 24px;
                    border-radius: 25px;
                    cursor: pointer;
                    font-weight: 600;
                ">취소</button>
            </div>
            
            <p style="
                color: white;
                text-align: center;
                margin-top: 16px;
                opacity: 0.8;
                font-size: 14px;
            ">영수증을 가이드 라인 안에 맞춰 촬영하세요</p>
        `;

        document.body.appendChild(modal);

        const video = document.getElementById('camera-video');
        video.srcObject = stream;

        // 캡처 버튼
        document.getElementById('capture-button').addEventListener('click', () => {
            this.captureImage(video, stream);
            modal.remove();
        });

        // 닫기 버튼
        document.getElementById('close-camera').addEventListener('click', () => {
            stream.getTracks().forEach(track => track.stop());
            modal.remove();
        });
    }

    captureImage(video, stream) {
        const canvas = document.getElementById('capture-canvas');
        const context = canvas.getContext('2d');
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        context.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
            stream.getTracks().forEach(track => track.stop());
            this.processImage(blob);
        }, 'image/jpeg', 0.8);
    }

    openFileDialog() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = this.supportedFormats.join(',');
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.validateAndProcessFile(file);
            }
        };
        input.click();
    }

    validateAndProcessFile(file) {
        // 파일 형식 확인
        if (!this.supportedFormats.includes(file.type)) {
            this.showNotification('지원하지 않는 파일 형식입니다. JPG, PNG, WebP 파일만 업로드 가능합니다.', 'error');
            return;
        }

        // 파일 크기 확인
        if (file.size > this.maxFileSize) {
            this.showNotification('파일 크기가 너무 큽니다. 10MB 이하의 파일만 업로드 가능합니다.', 'error');
            return;
        }

        this.processImage(file);
    }

    async processImage(imageFile) {
        if (this.isProcessing) {
            this.showNotification('이미 처리 중입니다. 잠시만 기다려주세요.', 'warning');
            return;
        }

        this.isProcessing = true;
        this.showProcessingState();

        try {
            // 실제 OCR API 호출 (예시)
            const extractedData = await this.performOCR(imageFile);
            this.displayOCRResult(extractedData);
            
        } catch (error) {
            console.error('OCR 처리 실패:', error);
            this.showNotification('영수증 분석에 실패했습니다. 다시 시도해주세요.', 'error');
            this.hideOCRResult();
        } finally {
            this.isProcessing = false;
            this.hideProcessingState();
        }
    }

    async performOCR(imageFile) {
        // 실제 환경에서는 Google Vision API, AWS Textract 등 사용
        // 여기서는 시뮬레이션된 결과 반환
        
        await this.delay(2000); // 처리 시간 시뮬레이션

        // 시뮬레이션된 OCR 결과
        return {
            date: '2025-01-15',
            businessName: '(주)샘플마트',
            amount: 45000,
            vat: 4500,
            items: [
                { name: '사무용품', amount: 25000 },
                { name: '음료수', amount: 15000 },
                { name: '과자', amount: 5000 }
            ],
            confidence: 0.95
        };
    }

    showProcessingState() {
        const ocrResult = document.getElementById('ocr-result');
        if (ocrResult) {
            ocrResult.style.display = 'block';
            ocrResult.innerHTML = `
                <div style="
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    padding: 24px;
                    text-align: center;
                    backdrop-filter: blur(10px);
                ">
                    <div class="loading-spinner" style="margin: 0 auto 16px;"></div>
                    <h4 style="margin: 0 0 8px; color: white;">🔍 영수증 분석 중...</h4>
                    <p style="margin: 0; color: rgba(255, 255, 255, 0.8); font-size: 14px;">
                        AI가 영수증 내용을 읽고 있습니다
                    </p>
                </div>
            `;
        }
    }

    hideProcessingState() {
        // 처리 상태 숨기기는 결과 표시에서 처리됨
    }

    displayOCRResult(data) {
        const ocrResult = document.getElementById('ocr-result');
        if (!ocrResult) return;

        this.currentOCRData = data;

        ocrResult.style.display = 'block';
        ocrResult.innerHTML = `
            <div style="
                background: rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                padding: 16px;
                backdrop-filter: blur(10px);
            ">
                <h4 style="margin: 0 0 12px; font-size: 16px; color: white;">
                    ✅ 영수증 분석 완료 (정확도: ${Math.round(data.confidence * 100)}%)
                </h4>
                <div id="extracted-data" style="color: white; font-size: 14px; line-height: 1.6;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                        <div><strong>날짜:</strong> ${data.date}</div>
                        <div><strong>업체명:</strong> ${data.businessName}</div>
                        <div><strong>금액:</strong> ${data.amount.toLocaleString()}원</div>
                        <div><strong>부가세:</strong> ${data.vat.toLocaleString()}원</div>
                    </div>
                    ${data.items ? `
                        <details style="margin-top: 12px;">
                            <summary style="cursor: pointer; font-weight: 600;">상품 내역 (${data.items.length}개)</summary>
                            <div style="margin-top: 8px; padding-left: 16px;">
                                ${data.items.map(item => `
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                                        <span>${item.name}</span>
                                        <span>${item.amount.toLocaleString()}원</span>
                                    </div>
                                `).join('')}
                            </div>
                        </details>
                    ` : ''}
                </div>
                <div style="display: flex; gap: 12px; margin-top: 16px;">
                    <button id="apply-ocr-data" style="
                        background: #00C851;
                        color: white;
                        border: none;
                        padding: 12px 20px;
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                        font-size: 14px;
                        transition: transform 0.2s ease;
                    " onmouseover="this.style.transform='scale(1.05)'" 
                       onmouseout="this.style.transform='scale(1)'">
                        직접입력에 적용
                    </button>
                    <button id="edit-ocr-data" style="
                        background: rgba(255, 255, 255, 0.2);
                        color: white;
                        border: 1px solid rgba(255, 255, 255, 0.3);
                        padding: 12px 20px;
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                        font-size: 14px;
                        transition: all 0.2s ease;
                    " onmouseover="this.style.background='rgba(255, 255, 255, 0.3)'" 
                       onmouseout="this.style.background='rgba(255, 255, 255, 0.2)'">
                        수정하기
                    </button>
                </div>
            </div>
        `;

        // 이벤트 리스너 재연결
        this.attachOCREvents();
    }

    hideOCRResult() {
        const ocrResult = document.getElementById('ocr-result');
        if (ocrResult) {
            ocrResult.style.display = 'none';
        }
    }

    applyExtractedData() {
        if (!this.currentOCRData) return;

        // 직접입력 탭으로 이동
        const inputTab = document.querySelector('[data-tab="input"]');
        if (inputTab) {
            inputTab.click();
        }

        // 폼에 데이터 입력
        setTimeout(() => {
            const data = this.currentOCRData;
            
            document.getElementById('transaction-date').value = data.date;
            document.getElementById('business-name').value = data.businessName;
            document.querySelector('input[name="transaction-type"][value="expense"]').checked = true;
            document.getElementById('amount').value = data.amount;
            document.getElementById('vat-amount').value = data.vat;
            document.getElementById('memo').value = `영수증 자동 입력 (${data.items ? data.items.length + '개 항목' : ''})\n정확도: ${Math.round(data.confidence * 100)}%`;

            // 부가세 자동계산 해제
            document.getElementById('auto-vat').checked = false;
            document.getElementById('vat-amount').disabled = false;

            this.showNotification('영수증 데이터가 직접입력 폼에 적용되었습니다!', 'success');
        }, 500);
    }

    editExtractedData() {
        // OCR 결과 수정 모달 표시
        this.showEditModal(this.currentOCRData);
    }

    showEditModal(data) {
        // OCR 데이터 수정 모달 구현
        console.log('OCR 데이터 수정 모달:', data);
        this.showNotification('수정 기능이 곧 추가됩니다!', 'info');
    }

    // 알림 시스템
    initNotificationSystem() {
        this.notifications = [];
        this.setupTaxDeadlineNotifications();
        this.setupBrowserNotifications();
    }

    setupTaxDeadlineNotifications() {
        // 세무 신고 기한 알림
        const taxDeadlines = [
            { name: '부가세 신고', date: '2025-01-25', days: this.getDaysUntil('2025-01-25') },
            { name: '종합소득세 신고', date: '2025-05-31', days: this.getDaysUntil('2025-05-31') },
            { name: '연말정산', date: '2025-03-10', days: this.getDaysUntil('2025-03-10') }
        ];

        taxDeadlines.forEach(deadline => {
            if (deadline.days <= 30 && deadline.days > 0) {
                this.scheduleNotification(deadline);
            }
        });
    }

    getDaysUntil(dateString) {
        const targetDate = new Date(dateString);
        const today = new Date();
        const diffTime = targetDate - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    scheduleNotification(deadline) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const message = `${deadline.name} 마감이 ${deadline.days}일 남았습니다. (${deadline.date})`;
            
            setTimeout(() => {
                new Notification('YouArePlan TAX AI 알림', {
                    body: message,
                    icon: '/assets/youareplan-logo.svg',
                    badge: '/assets/youareplan-logo.svg'
                });
            }, 5000); // 5초 후 알림
        }
    }

    setupBrowserNotifications() {
        // 브라우저 알림 권한 요청
        if ('Notification' in window && Notification.permission === 'default') {
            setTimeout(() => {
                this.requestNotificationPermission();
            }, 3000);
        }
    }

    async requestNotificationPermission() {
        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                this.showNotification('알림이 활성화되었습니다. 중요한 세무 일정을 놓치지 마세요!', 'success');
                
                // 환영 알림
                setTimeout(() => {
                    new Notification('YouArePlan TAX AI', {
                        body: '세무 일정 알림이 설정되었습니다. 마감일을 미리 알려드릴게요!',
                        icon: '/assets/youareplan-logo.svg'
                    });
                }, 2000);
            }
        } catch (error) {
            console.log('알림 권한 요청 실패:', error);
        }
    }

    // 캘린더 시스템
    initCalendarSystem() {
        this.addTaxCalendarWidget();
    }

    addTaxCalendarWidget() {
        // 체크리스트 섹션에 세무 캘린더 위젯 추가
        const checklistSection = document.querySelector('#checklist-section');
        if (checklistSection) {
            const calendarWidget = document.createElement('div');
            calendarWidget.innerHTML = `
                <div class="card" style="
                    background: linear-gradient(135deg, #ff7b7b 0%, #667eea 100%);
                    color: white;
                    border: none;
                ">
                    <div class="card-header">
                        <h3 style="color: white; margin: 0; display: flex; align-items: center; gap: 12px;">
                            <span style="font-size: 24px;">📅</span>
                            다가오는 세무 일정
                        </h3>
                    </div>
                    <div id="tax-calendar" style="margin-top: 16px;">
                        ${this.generateTaxCalendar()}
                    </div>
                </div>
            `;
            
            checklistSection.appendChild(calendarWidget);
        }
    }

    generateTaxCalendar() {
        const upcomingDeadlines = [
            { name: '부가세 신고', date: '2025-01-25', priority: 'high' },
            { name: '원천세 신고', date: '2025-02-10', priority: 'medium' },
            { name: '연말정산 서류 제출', date: '2025-03-10', priority: 'high' },
            { name: '종합소득세 신고', date: '2025-05-31', priority: 'high' }
        ];

        return upcomingDeadlines.map(item => {
            const days = this.getDaysUntil(item.date);
            const urgencyClass = days <= 7 ? 'urgent' : days <= 30 ? 'warning' : 'normal';
            
            return `
                <div style="
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    padding: 16px;
                    margin-bottom: 12px;
                    border-left: 4px solid ${item.priority === 'high' ? '#ff4757' : '#ffa502'};
                    backdrop-filter: blur(10px);
                ">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-weight: 600; margin-bottom: 4px;">${item.name}</div>
                            <div style="font-size: 14px; opacity: 0.9;">${item.date}</div>
                        </div>
                        <div style="
                            background: ${days <= 7 ? '#ff4757' : days <= 30 ? '#ffa502' : '#2ed573'};
                            color: white;
                            padding: 6px 12px;
                            border-radius: 20px;
                            font-size: 12px;
                            font-weight: 600;
                        ">
                            ${days > 0 ? `D-${days}` : days === 0 ? '오늘' : '완료'}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 유틸리티 메서드
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    showNotification(message, type = 'info', duration = 5000) {
        if (window.productionFeatures) {
            productionFeatures.showNotification(message, type, duration);
        }
    }
}

// 전역 인스턴스 생성
const receiptOCRSystem = new ReceiptOCRSystem();

export default ReceiptOCRSystem;