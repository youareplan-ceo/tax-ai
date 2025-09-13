/**
 * 사용자 온보딩 및 가이드 시스템
 * 첫 접속자를 위한 3단계 튜토리얼과 기능별 도움말
 */

class OnboardingSystem {
    constructor() {
        this.currentStep = 0;
        this.isFirstVisit = !localStorage.getItem('taxai_visited');
        this.steps = [
            {
                target: '.tab-navigation',
                title: '🎯 TAX AI 사용법 가이드',
                content: '안녕하세요! 유아플랜 TAX AI에 오신 것을 환영합니다.<br>3단계로 간단하게 세무 업무를 처리해보세요.',
                position: 'bottom'
            },
            {
                target: '#input-section',
                title: '📝 1단계: 거래 입력',
                content: '직접 입력하거나 CSV 파일을 업로드하여<br>거래 내역을 등록할 수 있습니다.',
                position: 'top'
            },
            {
                target: '#calculate-section',
                title: '💰 2단계: 세액 계산',
                content: '실시간으로 세무 계산 결과를 확인하고<br>시각적 차트로 데이터를 분석하세요.',
                position: 'top'
            },
            {
                target: '#checklist-section',
                title: '✅ 3단계: 신고 준비',
                content: '스마트 체크리스트로 홈택스 신고까지<br>완벽하게 준비할 수 있습니다.',
                position: 'top'
            }
        ];
        
        this.init();
    }

    init() {
        if (this.isFirstVisit) {
            // 첫 방문자 환영 처리
            setTimeout(() => {
                this.showWelcomeModal();
            }, 1000);
        }
        
        this.initTooltips();
        this.initHelpButtons();
        this.initSampleData();
    }

    showWelcomeModal() {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(10px);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.5s ease;
        `;

        modal.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #0064FF 0%, #4785FF 100%);
                border-radius: 20px;
                padding: 40px;
                max-width: 600px;
                width: 90%;
                color: white;
                text-align: center;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                animation: slideUp 0.5s ease;
                position: relative;
            ">
                <div style="
                    width: 80px;
                    height: 80px;
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 24px;
                    font-size: 36px;
                ">💼</div>
                
                <h2 style="margin: 0 0 16px; font-size: 28px; font-weight: 700;">
                    YouArePlan TAX AI에 오신 것을 환영합니다!
                </h2>
                
                <p style="margin: 0 0 32px; font-size: 16px; line-height: 1.6; opacity: 0.9;">
                    정책자금 전문 컨설팅 유아플랜이 제공하는<br>
                    차세대 세무 관리 AI 코파일럿입니다.
                </p>
                
                <div style="
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 20px;
                    margin-bottom: 32px;
                ">
                    <div style="
                        background: rgba(255, 255, 255, 0.1);
                        padding: 20px;
                        border-radius: 12px;
                        backdrop-filter: blur(10px);
                    ">
                        <div style="font-size: 24px; margin-bottom: 8px;">⚡</div>
                        <div style="font-weight: 600; margin-bottom: 4px;">실시간 계산</div>
                        <div style="font-size: 12px; opacity: 0.8;">즉시 세액 확인</div>
                    </div>
                    
                    <div style="
                        background: rgba(255, 255, 255, 0.1);
                        padding: 20px;
                        border-radius: 12px;
                        backdrop-filter: blur(10px);
                    ">
                        <div style="font-size: 24px; margin-bottom: 8px;">🤖</div>
                        <div style="font-weight: 600; margin-bottom: 4px;">AI 분석</div>
                        <div style="font-size: 12px; opacity: 0.8;">지능형 세무 분석</div>
                    </div>
                    
                    <div style="
                        background: rgba(255, 255, 255, 0.1);
                        padding: 20px;
                        border-radius: 12px;
                        backdrop-filter: blur(10px);
                    ">
                        <div style="font-size: 24px; margin-bottom: 8px;">🔒</div>
                        <div style="font-weight: 600; margin-bottom: 4px;">보안 강화</div>
                        <div style="font-size: 12px; opacity: 0.8;">안전한 데이터 관리</div>
                    </div>
                </div>
                
                <div style="display: flex; gap: 16px; justify-content: center;">
                    <button onclick="onboardingSystem.startTutorial()" style="
                        background: white;
                        color: #0064FF;
                        border: none;
                        padding: 16px 32px;
                        border-radius: 25px;
                        font-weight: 600;
                        font-size: 16px;
                        cursor: pointer;
                        transition: transform 0.2s ease;
                    " onmouseover="this.style.transform='scale(1.05)'" 
                       onmouseout="this.style.transform='scale(1)'">
                        🚀 튜토리얼 시작
                    </button>
                    
                    <button onclick="onboardingSystem.skipTutorial()" style="
                        background: rgba(255, 255, 255, 0.2);
                        color: white;
                        border: 2px solid rgba(255, 255, 255, 0.3);
                        padding: 16px 32px;
                        border-radius: 25px;
                        font-weight: 600;
                        font-size: 16px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        backdrop-filter: blur(10px);
                    " onmouseover="this.style.background='rgba(255, 255, 255, 0.3)'" 
                       onmouseout="this.style.background='rgba(255, 255, 255, 0.2)'">
                        건너뛰기
                    </button>
                </div>
                
                <p style="
                    margin: 24px 0 0;
                    font-size: 12px;
                    opacity: 0.7;
                ">
                    언제든지 우상단 ❓ 버튼으로 도움말을 확인할 수 있습니다
                </p>
            </div>
        `;

        modal.className = 'welcome-modal';
        document.body.appendChild(modal);
    }

    startTutorial() {
        this.closeWelcomeModal();
        this.currentStep = 0;
        setTimeout(() => {
            this.showStep(0);
        }, 500);
    }

    skipTutorial() {
        this.closeWelcomeModal();
        this.markAsVisited();
    }

    closeWelcomeModal() {
        const modal = document.querySelector('.welcome-modal');
        if (modal) {
            modal.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => modal.remove(), 300);
        }
    }

    showStep(stepIndex) {
        if (stepIndex >= this.steps.length) {
            this.completeTutorial();
            return;
        }

        const step = this.steps[stepIndex];
        const target = document.querySelector(step.target);
        
        if (!target) {
            console.warn('튜토리얼 대상 요소를 찾을 수 없습니다:', step.target);
            return;
        }

        // 스크롤 및 포커스
        if (stepIndex > 0) {
            this.activateTab(stepIndex);
        }
        
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        setTimeout(() => {
            this.createTooltip(target, step, stepIndex);
        }, 500);
    }

    activateTab(stepIndex) {
        const tabMappings = {
            1: 'input',
            2: 'calculate', 
            3: 'checklist'
        };
        
        const tabName = tabMappings[stepIndex];
        if (tabName) {
            const tabButton = document.querySelector(`[data-tab="${tabName}"]`);
            if (tabButton) {
                tabButton.click();
            }
        }
    }

    createTooltip(target, step, stepIndex) {
        // 기존 툴팁 제거
        this.removeTooltip();

        const tooltip = document.createElement('div');
        tooltip.className = 'onboarding-tooltip';
        tooltip.style.cssText = `
            position: absolute;
            background: white;
            border: none;
            border-radius: 16px;
            padding: 24px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
            z-index: 10001;
            max-width: 350px;
            color: #2C3E50;
            font-size: 14px;
            line-height: 1.6;
            animation: tooltipAppear 0.3s ease;
        `;

        tooltip.innerHTML = `
            <div style="margin-bottom: 16px;">
                <h4 style="margin: 0 0 8px; color: #0064FF; font-size: 16px; font-weight: 700;">
                    ${step.title}
                </h4>
                <p style="margin: 0; color: #666;">
                    ${step.content}
                </p>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="color: #999; font-size: 12px;">
                    ${stepIndex + 1} / ${this.steps.length}
                </div>
                
                <div style="display: flex; gap: 8px;">
                    ${stepIndex > 0 ? `
                        <button onclick="onboardingSystem.previousStep()" style="
                            background: #F8F9FA;
                            color: #666;
                            border: none;
                            padding: 8px 16px;
                            border-radius: 20px;
                            font-size: 12px;
                            cursor: pointer;
                        ">이전</button>
                    ` : ''}
                    
                    <button onclick="onboardingSystem.nextStep()" style="
                        background: linear-gradient(135deg, #0064FF, #4785FF);
                        color: white;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 20px;
                        font-size: 12px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: transform 0.2s ease;
                    " onmouseover="this.style.transform='scale(1.05)'" 
                       onmouseout="this.style.transform='scale(1)'">
                        ${stepIndex === this.steps.length - 1 ? '완료' : '다음'}
                    </button>
                    
                    <button onclick="onboardingSystem.skipTutorial()" style="
                        background: none;
                        color: #999;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 20px;
                        font-size: 12px;
                        cursor: pointer;
                    ">건너뛰기</button>
                </div>
            </div>
        `;

        document.body.appendChild(tooltip);
        this.positionTooltip(tooltip, target, step.position);
        
        // 하이라이트 효과
        this.highlightElement(target);
    }

    positionTooltip(tooltip, target, position) {
        const targetRect = target.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        let top, left;
        
        switch (position) {
            case 'top':
                top = targetRect.top - tooltipRect.height - 16;
                left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
                break;
            case 'bottom':
                top = targetRect.bottom + 16;
                left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
                break;
            case 'left':
                top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
                left = targetRect.left - tooltipRect.width - 16;
                break;
            case 'right':
                top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
                left = targetRect.right + 16;
                break;
        }
        
        // 화면 경계 확인 및 조정
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        if (left < 16) left = 16;
        if (left + tooltipRect.width > viewportWidth - 16) {
            left = viewportWidth - tooltipRect.width - 16;
        }
        if (top < 16) top = 16;
        if (top + tooltipRect.height > viewportHeight - 16) {
            top = viewportHeight - tooltipRect.height - 16;
        }
        
        tooltip.style.top = top + window.scrollY + 'px';
        tooltip.style.left = left + 'px';
    }

    highlightElement(element) {
        // 기존 하이라이트 제거
        document.querySelectorAll('.onboarding-highlight').forEach(el => {
            el.classList.remove('onboarding-highlight');
        });
        
        element.classList.add('onboarding-highlight');
    }

    removeTooltip() {
        const tooltip = document.querySelector('.onboarding-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
        
        document.querySelectorAll('.onboarding-highlight').forEach(el => {
            el.classList.remove('onboarding-highlight');
        });
    }

    nextStep() {
        this.currentStep++;
        this.showStep(this.currentStep);
    }

    previousStep() {
        this.currentStep--;
        this.showStep(this.currentStep);
    }

    completeTutorial() {
        this.removeTooltip();
        this.markAsVisited();
        
        // 완료 알림
        if (window.productionFeatures) {
            productionFeatures.showNotification(
                '튜토리얼을 완료했습니다! 이제 TAX AI를 자유롭게 사용해보세요.', 
                'success'
            );
        }
    }

    markAsVisited() {
        localStorage.setItem('taxai_visited', 'true');
        localStorage.setItem('taxai_visit_date', new Date().toISOString());
    }

    // 툴팁 시스템
    initTooltips() {
        const tooltipElements = [
            { selector: '.form-group input', text: '여기에 거래 정보를 입력하세요' },
            { selector: '.btn-primary', text: '클릭하여 저장하거나 계산을 실행하세요' },
            { selector: '.tab-button', text: '탭을 클릭하여 다른 기능으로 이동할 수 있습니다' }
        ];

        tooltipElements.forEach(item => {
            const elements = document.querySelectorAll(item.selector);
            elements.forEach(element => {
                this.addTooltip(element, item.text);
            });
        });
    }

    addTooltip(element, text) {
        element.addEventListener('mouseenter', (e) => {
            this.showQuickTooltip(e.target, text);
        });
        
        element.addEventListener('mouseleave', () => {
            this.hideQuickTooltip();
        });
    }

    showQuickTooltip(element, text) {
        let tooltip = document.querySelector('.quick-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.className = 'quick-tooltip';
            tooltip.style.cssText = `
                position: absolute;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 12px;
                z-index: 9999;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.2s ease;
                max-width: 200px;
                line-height: 1.4;
            `;
            document.body.appendChild(tooltip);
        }

        tooltip.textContent = text;
        
        const rect = element.getBoundingClientRect();
        tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
        tooltip.style.top = rect.bottom + 8 + window.scrollY + 'px';
        tooltip.style.opacity = '1';
    }

    hideQuickTooltip() {
        const tooltip = document.querySelector('.quick-tooltip');
        if (tooltip) {
            tooltip.style.opacity = '0';
        }
    }

    // 도움말 버튼
    initHelpButtons() {
        // 전역 도움말 버튼 추가
        const helpButton = document.createElement('button');
        helpButton.innerHTML = '❓';
        helpButton.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: linear-gradient(135deg, #0064FF, #4785FF);
            color: white;
            border: none;
            font-size: 20px;
            cursor: pointer;
            box-shadow: 0 4px 20px rgba(0, 100, 255, 0.3);
            z-index: 1000;
            transition: transform 0.2s ease;
        `;
        
        helpButton.addEventListener('mouseenter', () => {
            helpButton.style.transform = 'scale(1.1)';
        });
        
        helpButton.addEventListener('mouseleave', () => {
            helpButton.style.transform = 'scale(1)';
        });
        
        helpButton.addEventListener('click', () => {
            this.showHelpModal();
        });
        
        document.body.appendChild(helpButton);
    }

    showHelpModal() {
        // 도움말 모달 구현
        console.log('도움말 모달 표시');
        if (window.productionFeatures) {
            productionFeatures.showNotification('도움말 기능이 곧 추가됩니다!', 'info');
        }
    }

    // 샘플 데이터 체험 기능
    initSampleData() {
        // 샘플 데이터 체험 버튼 추가 (직접입력 섹션에)
        const inputSection = document.querySelector('#input-section .card');
        if (inputSection) {
            const sampleButton = document.createElement('button');
            sampleButton.innerHTML = '🎯 샘플 데이터로 체험해보기';
            sampleButton.style.cssText = `
                background: linear-gradient(135deg, #00C851, #00A043);
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 25px;
                font-weight: 600;
                font-size: 14px;
                cursor: pointer;
                margin: 16px 0;
                width: 100%;
                transition: transform 0.2s ease;
            `;
            
            sampleButton.addEventListener('click', () => {
                this.loadSampleData();
            });
            
            inputSection.appendChild(sampleButton);
        }
    }

    loadSampleData() {
        // 샘플 데이터 로드
        const sampleTransactions = [
            {
                date: '2025-01-15',
                businessName: '(주)샘플컴퍼니',
                type: 'income',
                amount: 1000000,
                memo: '웹 개발 용역비'
            },
            {
                date: '2025-01-20',
                businessName: '오피스용품마트',
                type: 'expense',
                amount: 150000,
                memo: '사무용품 구매'
            }
        ];

        // 폼에 첫 번째 샘플 데이터 입력
        const firstSample = sampleTransactions[0];
        document.getElementById('transaction-date').value = firstSample.date;
        document.getElementById('business-name').value = firstSample.businessName;
        document.querySelector(`input[name="transaction-type"][value="${firstSample.type}"]`).checked = true;
        document.getElementById('amount').value = firstSample.amount;
        document.getElementById('memo').value = firstSample.memo;

        if (window.productionFeatures) {
            productionFeatures.showNotification('샘플 데이터가 로드되었습니다. 저장 버튼을 눌러보세요!', 'success');
        }
    }
}

// CSS 스타일 추가
const onboardingStyles = document.createElement('style');
onboardingStyles.textContent = `
    @keyframes tooltipAppear {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    .onboarding-highlight {
        position: relative;
        z-index: 10000;
        box-shadow: 0 0 0 4px rgba(0, 100, 255, 0.3), 0 0 20px rgba(0, 100, 255, 0.2) !important;
        border-radius: 8px;
        animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
        0% { box-shadow: 0 0 0 4px rgba(0, 100, 255, 0.3), 0 0 20px rgba(0, 100, 255, 0.2); }
        50% { box-shadow: 0 0 0 8px rgba(0, 100, 255, 0.2), 0 0 30px rgba(0, 100, 255, 0.3); }
        100% { box-shadow: 0 0 0 4px rgba(0, 100, 255, 0.3), 0 0 20px rgba(0, 100, 255, 0.2); }
    }
`;
document.head.appendChild(onboardingStyles);

// 전역 인스턴스 생성
const onboardingSystem = new OnboardingSystem();

export default OnboardingSystem;