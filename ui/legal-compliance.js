/**
 * 법적 안전성 및 신뢰성 강화 시스템
 * 이용약관, 개인정보처리방침, 면책조항, 보안 강화
 */

class LegalComplianceSystem {
    constructor() {
        this.userConsents = {};
        this.dataRetentionPolicy = 365; // 1년
        this.encryptionEnabled = true;
        
        this.init();
    }

    init() {
        this.initLegalPages();
        this.initConsentManagement();
        this.initDataSecurity();
        this.initBetaWarnings();
        this.initDisclaimers();
    }

    // 법적 페이지 생성
    initLegalPages() {
        this.createTermsOfService();
        this.createPrivacyPolicy();
        this.createDisclaimer();
        this.addLegalFooterLinks();
    }

    createTermsOfService() {
        this.termsContent = `
            <div class="legal-document">
                <h1>서비스 이용약관</h1>
                <p class="last-updated">최종 업데이트: 2025년 1월 13일</p>

                <section>
                    <h2>제1조 (목적)</h2>
                    <p>본 약관은 유아플랜 컨설팅(이하 "회사")이 제공하는 TAX AI 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.</p>
                </section>

                <section>
                    <h2>제2조 (정의)</h2>
                    <ol>
                        <li>"서비스"란 회사가 제공하는 세무 업무 지원 AI 코파일럿 서비스를 의미합니다.</li>
                        <li>"이용자"란 본 약관에 따라 회사가 제공하는 서비스를 받는 자를 의미합니다.</li>
                        <li>"개인정보"란 생존하는 개인에 관한 정보로서 성명, 연락처 등에 의하여 특정 개인을 알아볼 수 있는 정보를 의미합니다.</li>
                    </ol>
                </section>

                <section>
                    <h2>제3조 (서비스의 제공)</h2>
                    <ol>
                        <li>회사는 다음과 같은 서비스를 제공합니다:
                            <ul>
                                <li>세무 데이터 입력 및 관리</li>
                                <li>세액 계산 및 분석</li>
                                <li>세무 신고 가이드</li>
                                <li>영수증 OCR 인식</li>
                            </ul>
                        </li>
                        <li>서비스는 현재 베타 버전으로 제공되며, 정식 서비스와 차이가 있을 수 있습니다.</li>
                    </ol>
                </section>

                <section>
                    <h2>제4조 (이용자의 의무)</h2>
                    <ol>
                        <li>이용자는 정확한 정보를 입력해야 합니다.</li>
                        <li>이용자는 서비스를 이용하여 얻은 정보의 정확성을 스스로 확인해야 합니다.</li>
                        <li>이용자는 서비스를 불법적인 목적으로 이용해서는 안 됩니다.</li>
                    </ol>
                </section>

                <section>
                    <h2>제5조 (회사의 책임 제한)</h2>
                    <ol>
                        <li>회사는 서비스를 통해 제공되는 정보의 정확성을 보장하지 않습니다.</li>
                        <li>회사는 이용자가 서비스를 이용하여 얻은 정보로 인한 손해에 대해 책임지지 않습니다.</li>
                        <li>최종 세무 신고는 반드시 세무 전문가의 검토를 거쳐야 합니다.</li>
                    </ol>
                </section>

                <section>
                    <h2>제6조 (개인정보 보호)</h2>
                    <p>회사는 관련 법령에 따라 이용자의 개인정보를 보호하며, 자세한 사항은 개인정보처리방침에 따릅니다.</p>
                </section>

                <section>
                    <h2>제7조 (약관의 변경)</h2>
                    <p>회사는 필요에 따라 본 약관을 변경할 수 있으며, 변경된 약관은 서비스 내 공지를 통해 안내합니다.</p>
                </section>

                <div class="contact-info">
                    <h3>문의처</h3>
                    <p>유아플랜 컨설팅<br>
                    이메일: contact@youareplan.co.kr<br>
                    전화: 02-1234-5678</p>
                </div>
            </div>
        `;
    }

    createPrivacyPolicy() {
        this.privacyContent = `
            <div class="legal-document">
                <h1>개인정보처리방침</h1>
                <p class="last-updated">최종 업데이트: 2025년 1월 13일</p>

                <section>
                    <h2>1. 개인정보 수집 및 이용 목적</h2>
                    <p>유아플랜 컨설팅은 다음의 목적을 위하여 개인정보를 처리합니다:</p>
                    <ul>
                        <li>서비스 제공 및 운영</li>
                        <li>고객 상담 및 지원</li>
                        <li>서비스 개선 및 개발</li>
                        <li>법적 의무 이행</li>
                    </ul>
                </section>

                <section>
                    <h2>2. 수집하는 개인정보 항목</h2>
                    <h3>필수 정보</h3>
                    <ul>
                        <li>성명, 연락처 (전문가 상담 신청 시)</li>
                        <li>세무 데이터 (거래 정보, 금액 등)</li>
                    </ul>
                    
                    <h3>자동 수집 정보</h3>
                    <ul>
                        <li>IP 주소, 쿠키, 서비스 이용 기록</li>
                        <li>기기 정보 (브라우저 종류, OS 등)</li>
                    </ul>
                </section>

                <section>
                    <h2>3. 개인정보 처리 및 보유 기간</h2>
                    <ul>
                        <li>원칙적으로 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.</li>
                        <li>단, 관련 법령에 따라 보존할 필요가 있는 경우 일정 기간 보관합니다.</li>
                        <li>세무 관련 데이터: 5년 (국세기본법)</li>
                        <li>서비스 이용 기록: 1년</li>
                    </ul>
                </section>

                <section>
                    <h2>4. 개인정보 보안</h2>
                    <ul>
                        <li>개인정보를 암호화하여 저장합니다.</li>
                        <li>HTTPS를 통한 안전한 데이터 전송</li>
                        <li>접근 권한 관리 및 로그 모니터링</li>
                        <li>정기적인 보안 점검 실시</li>
                    </ul>
                </section>

                <section>
                    <h2>5. 개인정보 제3자 제공</h2>
                    <p>회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 단, 다음의 경우는 예외로 합니다:</p>
                    <ul>
                        <li>이용자의 동의가 있는 경우</li>
                        <li>법령의 규정에 의한 경우</li>
                        <li>수사 목적으로 법정절차에 의한 요구가 있는 경우</li>
                    </ul>
                </section>

                <section>
                    <h2>6. 이용자의 권리</h2>
                    <p>이용자는 언제든지 다음의 권리를 행사할 수 있습니다:</p>
                    <ul>
                        <li>개인정보 열람 요구</li>
                        <li>개인정보 정정 및 삭제 요구</li>
                        <li>개인정보 처리 정지 요구</li>
                    </ul>
                </section>

                <section>
                    <h2>7. 쿠키 사용</h2>
                    <p>서비스 향상을 위해 쿠키를 사용할 수 있으며, 이용자는 브라우저 설정을 통해 쿠키 사용을 거부할 수 있습니다.</p>
                </section>

                <div class="contact-info">
                    <h3>개인정보보호 담당자</h3>
                    <p>이름: 개인정보보호책임자<br>
                    이메일: privacy@youareplan.co.kr<br>
                    전화: 02-1234-5678</p>
                </div>
            </div>
        `;
    }

    createDisclaimer() {
        this.disclaimerContent = `
            <div class="legal-document">
                <h1>면책조항</h1>
                <p class="last-updated">최종 업데이트: 2025년 1월 13일</p>

                <div class="warning-box">
                    <h2>⚠️ 중요 고지사항</h2>
                    <p>본 서비스는 <strong>베타 버전</strong>으로 제공되며, 세무 전문가의 검토 없이는 실제 세무 신고에 사용하지 마시기 바랍니다.</p>
                </div>

                <section>
                    <h2>1. 서비스 성격</h2>
                    <ul>
                        <li>본 서비스는 세무 업무 보조 도구로서, 최종 세무 결정을 대체하지 않습니다.</li>
                        <li>모든 세무 관련 결정은 반드시 세무 전문가와 상담 후 진행하시기 바랍니다.</li>
                        <li>서비스에서 제공하는 정보는 참고 용도이며, 법적 조언이 아닙니다.</li>
                    </ul>
                </section>

                <section>
                    <h2>2. 데이터 정확성</h2>
                    <ul>
                        <li>OCR(광학문자인식) 기능은 기술적 한계가 있어 100% 정확하지 않을 수 있습니다.</li>
                        <li>세액 계산 결과는 입력 데이터와 세법 변경사항에 따라 달라질 수 있습니다.</li>
                        <li>이용자는 모든 입력 정보와 계산 결과를 검증할 책임이 있습니다.</li>
                    </ul>
                </section>

                <section>
                    <h2>3. 책임 한계</h2>
                    <ul>
                        <li>유아플랜 컨설팅은 서비스 이용으로 인한 직간접적 손해에 대해 책임지지 않습니다.</li>
                        <li>세무 신고 오류, 가산세, 벌금 등은 이용자의 책임입니다.</li>
                        <li>서비스 장애, 데이터 손실 등에 대한 책임은 관련 법령에 따라 제한됩니다.</li>
                    </ul>
                </section>

                <section>
                    <h2>4. 세무 전문가 상담 권고</h2>
                    <p class="highlight">
                        복잡한 세무 상황이나 중요한 세무 결정의 경우 반드시 세무사, 공인회계사 등 
                        세무 전문가의 검토와 상담을 받으시기 바랍니다.
                    </p>
                </section>

                <section>
                    <h2>5. 베타 서비스 주의사항</h2>
                    <ul>
                        <li>베타 서비스는 예고 없이 변경되거나 중단될 수 있습니다.</li>
                        <li>일부 기능이 정상적으로 작동하지 않을 수 있습니다.</li>
                        <li>중요한 데이터는 별도로 백업하시기 바랍니다.</li>
                        <li>정식 서비스 전환 시 일부 데이터가 이전되지 않을 수 있습니다.</li>
                    </ul>
                </section>

                <div class="emergency-contact">
                    <h3>🆘 긴급 문의</h3>
                    <p>서비스 사용 중 중대한 오류를 발견하시면 즉시 연락해 주시기 바랍니다.</p>
                    <p>이메일: urgent@youareplan.co.kr<br>
                    전화: 02-1234-5678</p>
                </div>
            </div>
        `;
    }

    addLegalFooterLinks() {
        // 푸터의 법적 링크 활성화
        const footerLinks = document.querySelectorAll('.footer-legal-link');
        footerLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const linkText = link.textContent;
                
                if (linkText.includes('이용약관')) {
                    this.showLegalModal('이용약관', this.termsContent);
                } else if (linkText.includes('개인정보')) {
                    this.showLegalModal('개인정보처리방침', this.privacyContent);
                } else if (linkText.includes('면책')) {
                    this.showLegalModal('면책조항', this.disclaimerContent);
                }
            });
        });
    }

    showLegalModal(title, content) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease;
        `;

        modal.innerHTML = `
            <div style="
                background: white;
                border-radius: 16px;
                max-width: 800px;
                width: 90%;
                max-height: 80%;
                position: relative;
                overflow: hidden;
            ">
                <div style="
                    padding: 24px;
                    border-bottom: 1px solid #eee;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: #f8f9fa;
                ">
                    <h2 style="margin: 0; color: #2C3E50;">${title}</h2>
                    <button onclick="this.closest('.legal-modal').remove()" style="
                        background: none;
                        border: none;
                        font-size: 24px;
                        color: #666;
                        cursor: pointer;
                        padding: 4px;
                    ">×</button>
                </div>
                
                <div style="
                    padding: 24px;
                    overflow-y: auto;
                    max-height: calc(80vh - 100px);
                ">
                    ${content}
                </div>
                
                <div style="
                    padding: 20px 24px;
                    border-top: 1px solid #eee;
                    text-align: right;
                    background: #f8f9fa;
                ">
                    <button onclick="this.closest('.legal-modal').remove()" style="
                        background: #0064FF;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                    ">확인</button>
                </div>
            </div>
        `;

        modal.className = 'legal-modal';
        document.body.appendChild(modal);

        // 모달 외부 클릭 시 닫기
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    // 동의 관리
    initConsentManagement() {
        this.checkRequiredConsents();
        this.addConsentBanner();
    }

    checkRequiredConsents() {
        const consents = localStorage.getItem('taxai_consents');
        if (!consents) {
            setTimeout(() => {
                this.showConsentDialog();
            }, 2000);
        }
    }

    showConsentDialog() {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #0064FF, #4785FF);
            color: white;
            padding: 20px;
            z-index: 10000;
            box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
            animation: slideUp 0.3s ease;
        `;

        modal.innerHTML = `
            <div style="max-width: 1200px; margin: 0 auto;">
                <div style="display: flex; justify-content: between; align-items: center; gap: 20px; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 300px;">
                        <h3 style="margin: 0 0 8px; font-size: 18px;">🍪 서비스 이용 동의</h3>
                        <p style="margin: 0; font-size: 14px; opacity: 0.9; line-height: 1.5;">
                            원활한 서비스 제공을 위해 쿠키 사용과 개인정보 처리에 동의해 주세요. 
                            자세한 내용은 개인정보처리방침을 확인하시기 바랍니다.
                        </p>
                    </div>
                    
                    <div style="display: flex; gap: 12px; align-items: center;">
                        <button onclick="legalCompliance.showPrivacySettings()" style="
                            background: rgba(255, 255, 255, 0.2);
                            color: white;
                            border: 1px solid rgba(255, 255, 255, 0.3);
                            padding: 10px 16px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 14px;
                        ">설정</button>
                        
                        <button onclick="legalCompliance.acceptAllConsents()" style="
                            background: white;
                            color: #0064FF;
                            border: none;
                            padding: 12px 24px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-weight: 600;
                            font-size: 14px;
                        ">모두 동의</button>
                    </div>
                </div>
            </div>
        `;

        modal.className = 'consent-banner';
        document.body.appendChild(modal);
    }

    showPrivacySettings() {
        // 개인정보 설정 모달
        console.log('개인정보 설정 모달 표시');
        this.showNotification('개인정보 설정 기능이 곧 추가됩니다.', 'info');
    }

    acceptAllConsents() {
        this.userConsents = {
            necessary: true,
            analytics: true,
            marketing: false,
            timestamp: new Date().toISOString()
        };

        localStorage.setItem('taxai_consents', JSON.stringify(this.userConsents));
        
        // 배너 제거
        const banner = document.querySelector('.consent-banner');
        if (banner) {
            banner.style.animation = 'slideDown 0.3s ease';
            setTimeout(() => banner.remove(), 300);
        }

        this.showNotification('동의가 완료되었습니다.', 'success');
    }

    addConsentBanner() {
        // 쿠키 동의 배너는 위에서 처리됨
    }

    // 데이터 보안
    initDataSecurity() {
        this.enforceSecurityPolicies();
        this.initDataEncryption();
        this.setupSecurityHeaders();
    }

    enforceSecurityPolicies() {
        // CSP 헤더 시뮬레이션
        if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
            const csp = document.createElement('meta');
            csp.httpEquiv = 'Content-Security-Policy';
            csp.content = "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; img-src 'self' data: https:";
            document.head.appendChild(csp);
        }

        // X-Frame-Options
        if (!document.querySelector('meta[http-equiv="X-Frame-Options"]')) {
            const xframe = document.createElement('meta');
            xframe.httpEquiv = 'X-Frame-Options';
            xframe.content = 'DENY';
            document.head.appendChild(xframe);
        }
    }

    initDataEncryption() {
        // 클라이언트 사이드 암호화 (민감한 데이터용)
        this.encryptionKey = this.generateEncryptionKey();
    }

    generateEncryptionKey() {
        // 실제 환경에서는 더 안전한 키 생성 방식 사용
        return 'taxai_' + Math.random().toString(36).substring(2, 15);
    }

    encryptData(data) {
        if (!this.encryptionEnabled) return data;
        
        try {
            // 간단한 인코딩 (실제로는 AES 등 사용)
            return btoa(JSON.stringify(data));
        } catch (e) {
            console.warn('데이터 암호화 실패:', e);
            return data;
        }
    }

    decryptData(encryptedData) {
        if (!this.encryptionEnabled) return encryptedData;
        
        try {
            return JSON.parse(atob(encryptedData));
        } catch (e) {
            console.warn('데이터 복호화 실패:', e);
            return encryptedData;
        }
    }

    setupSecurityHeaders() {
        // 보안 헤더 검증
        this.checkSecurityHeaders();
    }

    checkSecurityHeaders() {
        // HTTPS 강제
        if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
            this.showSecurityWarning('보안을 위해 HTTPS 연결을 사용해주세요.');
        }

        // Referrer Policy
        if (!document.querySelector('meta[name="referrer"]')) {
            const referrer = document.createElement('meta');
            referrer.name = 'referrer';
            referrer.content = 'strict-origin-when-cross-origin';
            document.head.appendChild(referrer);
        }
    }

    // 베타 경고
    initBetaWarnings() {
        this.addBetaBadge();
        this.showBetaDisclaimer();
    }

    addBetaBadge() {
        // 베타 배지는 이미 CSS에서 처리됨
    }

    showBetaDisclaimer() {
        // 첫 방문 시 베타 서비스 경고
        if (!localStorage.getItem('taxai_beta_warning_shown')) {
            setTimeout(() => {
                this.showBetaWarningModal();
            }, 1000);
        }
    }

    showBetaWarningModal() {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease;
        `;

        modal.innerHTML = `
            <div style="
                background: white;
                border-radius: 16px;
                padding: 32px;
                max-width: 500px;
                width: 90%;
                text-align: center;
                position: relative;
            ">
                <div style="
                    width: 60px;
                    height: 60px;
                    background: #FFA502;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 20px;
                    font-size: 28px;
                ">⚠️</div>
                
                <h2 style="margin: 0 0 16px; color: #FF6B35; font-size: 24px;">베타 서비스 안내</h2>
                
                <div style="background: #FFF3E0; padding: 20px; border-radius: 12px; margin-bottom: 24px; text-align: left;">
                    <p style="margin: 0 0 12px; font-weight: 600; color: #E65100;">중요 고지사항:</p>
                    <ul style="margin: 0; padding-left: 20px; color: #BF360C; line-height: 1.6;">
                        <li>본 서비스는 <strong>베타 버전</strong>입니다</li>
                        <li>실제 세무 신고 전 <strong>반드시 세무 전문가 검토</strong> 필요</li>
                        <li>계산 결과는 <strong>참고용</strong>이며 법적 효력이 없습니다</li>
                        <li>중요한 데이터는 <strong>별도 백업</strong>을 권장합니다</li>
                    </ul>
                </div>
                
                <p style="margin: 0 0 24px; color: #666; font-size: 14px; line-height: 1.5;">
                    유아플랜은 세무 업무의 효율성 향상을 위해 이 도구를 제공하지만, 
                    최종 책임은 이용자에게 있음을 알려드립니다.
                </p>
                
                <div style="display: flex; gap: 12px; justify-content: center;">
                    <button onclick="legalCompliance.acknowledgeBetaWarning()" style="
                        background: #FF6B35;
                        color: white;
                        border: none;
                        padding: 14px 28px;
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                        font-size: 16px;
                    ">이해했습니다</button>
                    
                    <button onclick="legalCompliance.viewFullDisclaimer()" style="
                        background: #F5F5F5;
                        color: #666;
                        border: 1px solid #DDD;
                        padding: 14px 28px;
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                        font-size: 16px;
                    ">전체 면책조항 보기</button>
                </div>
            </div>
        `;

        modal.className = 'beta-warning-modal';
        document.body.appendChild(modal);
    }

    acknowledgeBetaWarning() {
        localStorage.setItem('taxai_beta_warning_shown', 'true');
        localStorage.setItem('taxai_beta_warning_date', new Date().toISOString());
        
        const modal = document.querySelector('.beta-warning-modal');
        if (modal) {
            modal.remove();
        }
        
        this.showNotification('베타 서비스 안내사항을 확인했습니다.', 'success');
    }

    viewFullDisclaimer() {
        const modal = document.querySelector('.beta-warning-modal');
        if (modal) {
            modal.remove();
        }
        
        this.showLegalModal('면책조항', this.disclaimerContent);
        this.acknowledgeBetaWarning();
    }

    // 면책조항
    initDisclaimers() {
        this.addDisclaimerBanners();
        this.addCalculationWarnings();
    }

    addDisclaimerBanners() {
        // 계산 결과 섹션에 면책조항 추가
        const calculateSection = document.querySelector('#calculate-section');
        if (calculateSection) {
            const disclaimer = document.createElement('div');
            disclaimer.style.cssText = `
                background: linear-gradient(135deg, #FF6B35, #F7931E);
                color: white;
                padding: 16px;
                border-radius: 12px;
                margin-bottom: 20px;
                font-size: 14px;
                line-height: 1.5;
            `;
            
            disclaimer.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="font-size: 20px;">⚖️</span>
                    <div>
                        <strong>법적 고지:</strong> 
                        계산 결과는 참고용이며, 실제 세무 신고 시에는 반드시 세무 전문가의 검토를 받으시기 바랍니다.
                        <button onclick="legalCompliance.showLegalModal('면책조항', legalCompliance.disclaimerContent)" 
                                style="background: none; border: 1px solid rgba(255,255,255,0.5); color: white; padding: 4px 8px; border-radius: 4px; margin-left: 8px; font-size: 12px; cursor: pointer;">
                            자세히 보기
                        </button>
                    </div>
                </div>
            `;
            
            calculateSection.insertBefore(disclaimer, calculateSection.firstChild);
        }
    }

    addCalculationWarnings() {
        // 폼 제출 시 경고 메시지
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'transaction-form') {
                this.showCalculationWarning();
            }
        });
    }

    showCalculationWarning() {
        this.showNotification(
            '입력된 데이터는 참고용입니다. 정확한 세무 신고를 위해 세무 전문가와 상담하세요.',
            'warning',
            8000
        );
    }

    showSecurityWarning(message) {
        this.showNotification(message, 'warning', 10000);
    }

    showNotification(message, type = 'info', duration = 5000) {
        if (window.productionFeatures) {
            productionFeatures.showNotification(message, type, duration);
        }
    }
}

// CSS 스타일 추가
const legalStyles = document.createElement('style');
legalStyles.textContent = `
    .legal-document {
        font-family: 'Pretendard', -apple-system, sans-serif;
        line-height: 1.6;
        color: #2C3E50;
    }
    
    .legal-document h1 {
        color: #0064FF;
        border-bottom: 3px solid #0064FF;
        padding-bottom: 12px;
        margin-bottom: 24px;
    }
    
    .legal-document h2 {
        color: #34495E;
        margin-top: 32px;
        margin-bottom: 16px;
    }
    
    .legal-document h3 {
        color: #5D6D7E;
        margin-top: 24px;
        margin-bottom: 12px;
    }
    
    .legal-document section {
        margin-bottom: 24px;
        padding: 16px;
        background: #F8F9FA;
        border-radius: 8px;
        border-left: 4px solid #0064FF;
    }
    
    .legal-document ul, .legal-document ol {
        padding-left: 20px;
    }
    
    .legal-document li {
        margin-bottom: 8px;
    }
    
    .last-updated {
        color: #7F8C8D;
        font-style: italic;
        margin-bottom: 24px;
    }
    
    .warning-box {
        background: linear-gradient(135deg, #FF6B35, #F7931E);
        color: white;
        padding: 20px;
        border-radius: 12px;
        margin-bottom: 24px;
    }
    
    .warning-box h2 {
        color: white;
        margin-top: 0;
    }
    
    .highlight {
        background: #E3F2FD;
        padding: 16px;
        border-radius: 8px;
        border-left: 4px solid #2196F3;
        font-weight: 600;
    }
    
    .contact-info, .emergency-contact {
        background: #E8F5E8;
        padding: 20px;
        border-radius: 12px;
        margin-top: 32px;
        border-left: 4px solid #4CAF50;
    }
    
    .emergency-contact {
        background: #FFEBEE;
        border-left-color: #F44336;
    }
    
    @keyframes slideUp {
        from { transform: translateY(100%); }
        to { transform: translateY(0); }
    }
    
    @keyframes slideDown {
        from { transform: translateY(0); }
        to { transform: translateY(100%); }
    }
`;
document.head.appendChild(legalStyles);

// 전역 인스턴스 생성
const legalCompliance = new LegalComplianceSystem();

export default LegalComplianceSystem;