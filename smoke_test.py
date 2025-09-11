#!/usr/bin/env python3
"""
YouArePlan EasyTax v8.0.0 - Smoke Test 전체 플로우
업로드 → 분류 → 세액 → 체크리스트 플로우 완전 자동 테스트
"""

import requests
import json
import time
from datetime import datetime

class SmokeTestRunner:
    def __init__(self, base_url="http://localhost:8081"):
        self.base_url = base_url
        self.test_results = []
        
    def log_test(self, name, success, duration_ms, details=None, error=None):
        """테스트 결과 로깅"""
        result = {
            "test": name,
            "success": success,
            "duration_ms": round(duration_ms, 2),
            "timestamp": datetime.now().isoformat(),
            "details": details,
            "error": error
        }
        self.test_results.append(result)
        
        status = "✅" if success else "❌"
        print(f"{status} {name}: {duration_ms:.2f}ms")
        if error:
            print(f"   오류: {error}")
        if details and success:
            print(f"   상세: {details}")
    
    def test_health_check(self):
        """1. 헬스체크 테스트"""
        start_time = time.time()
        try:
            response = requests.get(f"{self.base_url}/health", timeout=10)
            duration_ms = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                if data.get("ok"):
                    self.log_test("헬스체크", True, duration_ms, "서버 정상 작동")
                    return True
                else:
                    self.log_test("헬스체크", False, duration_ms, error="ok=False")
                    return False
            else:
                self.log_test("헬스체크", False, duration_ms, error=f"HTTP {response.status_code}")
                return False
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            self.log_test("헬스체크", False, duration_ms, error=str(e))
            return False
    
    def test_ai_classification(self):
        """2. AI 분류 테스트"""
        start_time = time.time()
        try:
            payload = {
                "text_context": "거래처: 스타벅스 코리아, 금액: 15,000원, 메모: 팀 회의용 커피",
                "use_llm": True,
                "need_reasoning": True
            }
            
            response = requests.post(f"{self.base_url}/ai/classify-entry", json=payload, timeout=30)
            duration_ms = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                result_data = data.get("data", {})
                account_code = result_data.get("account_code", "")
                
                self.log_test("AI 분류", True, duration_ms, f"계정: {account_code}")
                return True
            else:
                self.log_test("AI 분류", False, duration_ms, error=f"HTTP {response.status_code}")
                return False
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            self.log_test("AI 분류", False, duration_ms, error=str(e))
            return False
    
    def test_tax_estimation(self):
        """3. 세액 추정 테스트"""
        start_time = time.time()
        try:
            # 가상의 세액 추정 요청
            payload = {
                "period": "2025-09",
                "sales_amount": 1000000,
                "purchase_amount": 800000
            }
            
            response = requests.post(f"{self.base_url}/tax/estimate", json=payload, timeout=30)
            duration_ms = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                if data.get("ok"):
                    estimated_vat = data.get("estimated_due_vat", 0)
                    self.log_test("세액 추정", True, duration_ms, f"예상 세액: {estimated_vat:,}원")
                    return True
                else:
                    self.log_test("세액 추정", False, duration_ms, error="ok=False")
                    return False
            else:
                self.log_test("세액 추정", False, duration_ms, error=f"HTTP {response.status_code}")
                return False
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            self.log_test("세액 추정", False, duration_ms, error=str(e))
            return False
    
    def test_checklist_generation(self):
        """4. 체크리스트 생성 테스트"""
        start_time = time.time()
        try:
            payload = {
                "period": "2025-09",
                "business_type": "서비스업"
            }
            
            response = requests.post(f"{self.base_url}/prep/refresh", json=payload, timeout=30)
            duration_ms = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                if data.get("ok"):
                    generated = data.get("generated", 0)
                    self.log_test("체크리스트 생성", True, duration_ms, f"{generated}개 항목 생성")
                    return True
                else:
                    self.log_test("체크리스트 생성", False, duration_ms, error="ok=False")
                    return False
            else:
                self.log_test("체크리스트 생성", False, duration_ms, error=f"HTTP {response.status_code}")
                return False
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            self.log_test("체크리스트 생성", False, duration_ms, error=str(e))
            return False
    
    def test_file_upload_simulation(self):
        """5. 파일 업로드 시뮬레이션 (CSV 오류 확인)"""
        start_time = time.time()
        try:
            # CSV 파일 데이터 시뮬레이션
            csv_content = "date,vendor,amount,memo\n2025-09-11,스타벅스,15000,회의용 커피\n"
            files = {"file": ("test.csv", csv_content, "text/csv")}
            
            response = requests.post(f"{self.base_url}/ingest/upload", files=files, timeout=30)
            duration_ms = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                self.log_test("파일 업로드", True, duration_ms, "CSV 파일 처리 성공")
                return True
            else:
                # 알려진 이슈이므로 경고로 처리
                self.log_test("파일 업로드", False, duration_ms, error=f"HTTP {response.status_code} (알려진 이슈)")
                return False
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            self.log_test("파일 업로드", False, duration_ms, error=f"{str(e)} (알려진 이슈)")
            return False
    
    def run_full_smoke_test(self):
        """전체 Smoke Test 실행"""
        print("🔥 YouArePlan EasyTax v8.0.0 - Smoke Test 시작")
        print("=" * 60)
        
        # 테스트 순서: 헬스체크 → AI 분류 → 세액 추정 → 체크리스트 → 파일 업로드
        tests = [
            ("헬스체크", self.test_health_check),
            ("AI 분류", self.test_ai_classification),
            ("세액 추정", self.test_tax_estimation),
            ("체크리스트 생성", self.test_checklist_generation),
            ("파일 업로드", self.test_file_upload_simulation)
        ]
        
        total_start = time.time()
        success_count = 0
        
        for test_name, test_func in tests:
            print(f"\n🧪 {test_name} 테스트 실행 중...")
            success = test_func()
            if success:
                success_count += 1
            time.sleep(0.5)  # 테스트 간격
        
        total_duration = (time.time() - total_start) * 1000
        success_rate = (success_count / len(tests)) * 100
        
        print("\n" + "=" * 60)
        print(f"🎯 Smoke Test 완료!")
        print(f"📊 성공률: {success_rate:.1f}% ({success_count}/{len(tests)})")
        print(f"⏱️ 총 소요시간: {total_duration:.2f}ms")
        
        # 결과 분석
        if success_rate >= 80:
            overall_status = "✅ 성공"
            status_msg = "프로덕션 배포 준비 완료"
        elif success_rate >= 60:
            overall_status = "⚠️ 부분 성공"
            status_msg = "일부 이슈 있음, 배포 가능"
        else:
            overall_status = "❌ 실패"
            status_msg = "배포 전 이슈 해결 필요"
        
        print(f"🏆 최종 결과: {overall_status}")
        print(f"📋 상태: {status_msg}")
        
        # 상세 결과 저장
        smoke_test_report = {
            "smoke_test_summary": {
                "timestamp": datetime.now().isoformat(),
                "target_url": self.base_url,
                "total_tests": len(tests),
                "successful_tests": success_count,
                "failed_tests": len(tests) - success_count,
                "success_rate_percent": round(success_rate, 1),
                "total_duration_ms": round(total_duration, 2),
                "overall_status": overall_status,
                "deployment_ready": success_rate >= 80
            },
            "detailed_results": self.test_results
        }
        
        # 리포트 저장
        with open("reports/smoke_test_report.json", "w", encoding="utf-8") as f:
            json.dump(smoke_test_report, f, ensure_ascii=False, indent=2)
        
        print(f"📄 상세 리포트: reports/smoke_test_report.json")
        
        return success_rate >= 80

def main():
    """메인 실행"""
    runner = SmokeTestRunner()
    success = runner.run_full_smoke_test()
    
    if success:
        print("\n🎉 Smoke Test 성공 - 프로덕션 배포 승인!")
        return 0
    else:
        print("\n⚠️ Smoke Test 부분 실패 - 알려진 이슈 포함")
        return 1

if __name__ == "__main__":
    exit(main())