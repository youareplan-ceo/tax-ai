#!/usr/bin/env python3
"""
YouArePlan EasyTax v8 - E2E (End-to-End) 테스트 스크립트

전체 워크플로우를 자동으로 테스트하는 종합 테스트 도구:
1. 파일 업로드 → 2. AI 자동 분류 → 3. 세액 계산 → 4. 체크리스트 생성

사용법:
    python e2e_test.py
    python e2e_test.py --host localhost --port 8081 --verbose
    python e2e_test.py --load-test 50 --report-format json
"""

import requests
import json
import time
import argparse
import sys
import os
from typing import Dict, Any, List, Optional
from datetime import datetime
import tempfile
from pathlib import Path

class YouArePlanE2ETester:
    """YouArePlan EasyTax v8 E2E 테스터"""
    
    def __init__(self, host: str = "localhost", port: int = 8081, verbose: bool = False):
        self.base_url = f"http://{host}:{port}"
        self.verbose = verbose
        self.test_results = []
        self.start_time = None
        self.session = requests.Session()
        
    def log(self, message: str, level: str = "INFO"):
        """로그 출력"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        if self.verbose or level == "ERROR":
            print(f"[{timestamp}] {level}: {message}")
    
    def log_result(self, test_name: str, success: bool, duration: float, 
                   data: Dict[str, Any] = None, error: str = None):
        """테스트 결과 기록"""
        result = {
            "timestamp": datetime.now().isoformat(),
            "test_name": test_name,
            "success": success,
            "duration_ms": round(duration * 1000, 2),
            "data": data or {},
            "error": error
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        self.log(f"{status} {test_name} ({result['duration_ms']}ms)")
        if error:
            self.log(f"   Error: {error}", "ERROR")
    
    def create_test_csv(self, filename: str = None) -> str:
        """테스트용 CSV 파일 생성"""
        if filename is None:
            temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False, encoding='utf-8')
            filename = temp_file.name
        else:
            temp_file = open(filename, 'w', encoding='utf-8')
        
        csv_content = """date,vendor,amount,vat,memo
2025-09-01,네이버클라우드,88000,8000,서버 호스팅 비용 - 9월분
2025-09-02,교보문고,44000,4000,도서 구매 - 개발 서적  
2025-09-03,DEF고객사,220000,20000,시스템 개발 서비스 매출
2025-09-04,올리브영,16500,1500,사무용 비품 구매
2025-09-05,SK텔레콤,77000,7000,통신비 - 9월분
2025-09-06,스타벅스,12000,0,회의용 음료 - 불공제
2025-09-07,GS25,8800,800,야근 간식 구매
2025-09-08,카카오,55000,5000,카카오워크 구독료
2025-09-09,GitHub,15000,0,GitHub Pro 구독 - 개발도구
2025-09-10,우버이츠,25000,0,야근 식사 - 복리후생비"""
        
        temp_file.write(csv_content)
        temp_file.close()
        
        self.log(f"테스트 CSV 파일 생성: {filename}")
        return filename
    
    def test_server_health(self) -> bool:
        """서버 상태 확인"""
        try:
            start_time = time.time()
            response = self.session.get(f"{self.base_url}/health", timeout=10)
            duration = time.time() - start_time
            
            success = response.status_code == 200
            data = response.json() if success else {}
            error = None if success else f"HTTP {response.status_code}"
            
            self.log_result("Server Health Check", success, duration, data, error)
            return success
            
        except Exception as e:
            self.log_result("Server Health Check", False, 0, error=str(e))
            return False
    
    def test_api_status(self) -> bool:
        """API 상태 확인"""
        try:
            start_time = time.time()
            response = self.session.get(f"{self.base_url}/api/status", timeout=10)
            duration = time.time() - start_time
            
            success = response.status_code == 200
            data = response.json() if success else {}
            error = None if success else f"HTTP {response.status_code}"
            
            self.log_result("API Status Check", success, duration, data, error)
            return success
            
        except Exception as e:
            self.log_result("API Status Check", False, 0, error=str(e))
            return False
    
    def test_file_upload(self, csv_file: str, period: str = "2025-09") -> Optional[str]:
        """파일 업로드 테스트"""
        try:
            start_time = time.time()
            
            with open(csv_file, 'rb') as f:
                files = {'file': (os.path.basename(csv_file), f, 'text/csv')}
                data = {'period': period, 'source': 'hometax_csv'}
                response = self.session.post(f"{self.base_url}/ingest/upload", 
                                           files=files, data=data, timeout=30)
            
            duration = time.time() - start_time
            
            success = response.status_code == 200
            response_data = response.json() if success else {}
            error = None if success else f"HTTP {response.status_code}"
            
            self.log_result("File Upload", success, duration, response_data, error)
            
            return response_data.get('raw_file_id') if success else None
            
        except Exception as e:
            self.log_result("File Upload", False, 0, error=str(e))
            return None
    
    def test_entries_list(self, period: str = "2025-09") -> int:
        """엔트리 목록 조회 테스트"""
        try:
            start_time = time.time()
            response = self.session.get(f"{self.base_url}/entries/list", 
                                      params={'period': period}, timeout=10)
            duration = time.time() - start_time
            
            success = response.status_code == 200
            data = response.json() if success else {}
            count = data.get('count', 0) if success else 0
            error = None if success else f"HTTP {response.status_code}"
            
            self.log_result("Entries List", success, duration, 
                          {"count": count, "items_preview": data.get('items', [])[:2]}, error)
            
            return count if success else 0
            
        except Exception as e:
            self.log_result("Entries List", False, 0, error=str(e))
            return 0
    
    def test_tax_estimate(self, period: str = "2025-09") -> bool:
        """세액 추정 테스트"""
        try:
            start_time = time.time()
            response = self.session.get(f"{self.base_url}/tax/estimate", 
                                      params={'period': period}, timeout=10)
            duration = time.time() - start_time
            
            success = response.status_code == 200
            data = response.json() if success else {}
            error = None if success else f"HTTP {response.status_code}"
            
            # 세액 계산 결과 검증
            if success:
                required_fields = ['sales_vat', 'purchase_vat', 'non_deductible_vat', 'estimated_due_vat']
                for field in required_fields:
                    if field not in data:
                        success = False
                        error = f"Missing required field: {field}"
                        break
            
            self.log_result("Tax Estimate", success, duration, data, error)
            return success
            
        except Exception as e:
            self.log_result("Tax Estimate", False, 0, error=str(e))
            return False
    
    def test_checklist_generation(self, period: str = "2025-09", tax_type: str = "VAT") -> bool:
        """체크리스트 생성 테스트"""
        try:
            start_time = time.time()
            response = self.session.post(f"{self.base_url}/prep/refresh", 
                                       params={'period': period, 'taxType': tax_type}, 
                                       timeout=15)
            duration = time.time() - start_time
            
            success = response.status_code == 200
            data = response.json() if success else {}
            error = None if success else f"HTTP {response.status_code}"
            
            # 체크리스트 결과 검증
            if success:
                generated = data.get('generated', 0)
                signals = data.get('signals', [])
                if generated == 0 and not signals:
                    self.log(f"Warning: 체크리스트 항목이 생성되지 않았습니다", "WARN")
            
            self.log_result("Checklist Generation", success, duration, data, error)
            return success
            
        except Exception as e:
            self.log_result("Checklist Generation", False, 0, error=str(e))
            return False
    
    def run_e2e_workflow(self, period: str = "2025-09") -> bool:
        """전체 E2E 워크플로우 실행"""
        self.log("🚀 YouArePlan EasyTax v8 E2E 테스트 시작")
        self.start_time = time.time()
        
        # 1. 서버 상태 확인
        if not self.test_server_health():
            self.log("서버가 응답하지 않습니다. 테스트를 중단합니다.", "ERROR")
            return False
        
        # 2. API 상태 확인
        self.test_api_status()
        
        # 3. 테스트 CSV 파일 생성
        csv_file = self.create_test_csv()
        
        try:
            # 4. 파일 업로드
            file_id = self.test_file_upload(csv_file, period)
            if not file_id:
                self.log("파일 업로드 실패. 워크플로우를 계속 진행합니다.", "WARN")
            
            # 잠시 대기 (분류 처리 시간)
            time.sleep(2)
            
            # 5. 엔트리 목록 조회
            entry_count = self.test_entries_list(period)
            self.log(f"총 {entry_count}개의 엔트리가 처리되었습니다")
            
            # 6. 세액 계산
            tax_success = self.test_tax_estimate(period)
            
            # 7. 체크리스트 생성
            checklist_success = self.test_checklist_generation(period)
            
            return all([
                entry_count > 0,
                tax_success,
                checklist_success
            ])
            
        finally:
            # 테스트 파일 정리
            try:
                os.unlink(csv_file)
                self.log(f"테스트 파일 삭제: {csv_file}")
            except:
                pass
    
    def run_load_test(self, requests_count: int = 10) -> Dict[str, Any]:
        """부하 테스트"""
        self.log(f"⚡ 부하 테스트 시작 ({requests_count}회 요청)")
        
        start_time = time.time()
        success_count = 0
        response_times = []
        
        for i in range(requests_count):
            try:
                req_start = time.time()
                response = self.session.get(f"{self.base_url}/health", timeout=5)
                req_duration = time.time() - req_start
                
                response_times.append(req_duration)
                if response.status_code == 200:
                    success_count += 1
                    
                if self.verbose and (i + 1) % 10 == 0:
                    self.log(f"진행률: {i + 1}/{requests_count}")
                    
            except Exception as e:
                self.log(f"요청 {i + 1} 실패: {e}", "ERROR")
        
        total_duration = time.time() - start_time
        success_rate = (success_count / requests_count) * 100 if requests_count > 0 else 0
        avg_response_time = sum(response_times) / len(response_times) if response_times else 0
        
        results = {
            "total_requests": requests_count,
            "successful_requests": success_count,
            "success_rate_percent": round(success_rate, 2),
            "total_duration_seconds": round(total_duration, 2),
            "average_response_time_ms": round(avg_response_time * 1000, 2),
            "requests_per_second": round(requests_count / total_duration, 2) if total_duration > 0 else 0
        }
        
        self.log_result("Load Test", success_rate >= 95, total_duration, results)
        
        self.log(f"📊 부하 테스트 결과:")
        self.log(f"   총 요청: {requests_count}회")
        self.log(f"   성공: {success_count}회 ({success_rate:.1f}%)")
        self.log(f"   평균 응답시간: {avg_response_time * 1000:.2f}ms")
        self.log(f"   초당 요청수: {results['requests_per_second']:.2f} RPS")
        
        return results
    
    def generate_report(self, format: str = "markdown") -> str:
        """테스트 결과 리포트 생성"""
        total_tests = len(self.test_results)
        passed_tests = sum(1 for r in self.test_results if r['success'])
        success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
        
        total_duration = time.time() - self.start_time if self.start_time else 0
        
        if format == "json":
            report = {
                "timestamp": datetime.now().isoformat(),
                "summary": {
                    "total_tests": total_tests,
                    "passed_tests": passed_tests,
                    "failed_tests": total_tests - passed_tests,
                    "success_rate_percent": round(success_rate, 2),
                    "total_duration_seconds": round(total_duration, 2)
                },
                "test_results": self.test_results
            }
            return json.dumps(report, indent=2, ensure_ascii=False)
        
        # Markdown 리포트
        report = f"""# YouArePlan EasyTax v8 E2E 테스트 리포트

**테스트 실행 시간**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
**테스트 대상**: {self.base_url}

## 📊 테스트 결과 요약

- **총 테스트**: {total_tests}개
- **성공**: {passed_tests}개  
- **실패**: {total_tests - passed_tests}개
- **성공률**: {success_rate:.1f}%
- **총 소요시간**: {total_duration:.2f}초

## 📋 상세 결과

| 테스트명 | 상태 | 소요시간 | 비고 |
|---------|------|----------|------|"""

        for result in self.test_results:
            status = "✅" if result['success'] else "❌"
            note = result.get('error', 'OK') if not result['success'] else 'OK'
            report += f"\n| {result['test_name']} | {status} | {result['duration_ms']}ms | {note} |"
        
        # 실패한 테스트 상세
        failed_tests = [r for r in self.test_results if not r['success']]
        if failed_tests:
            report += "\n\n## ❌ 실패한 테스트 상세\n"
            for result in failed_tests:
                report += f"\n### {result['test_name']}\n"
                report += f"- **오류**: {result.get('error', 'Unknown error')}\n"
                report += f"- **시간**: {result['timestamp']}\n"
        
        # 권장사항
        report += f"\n\n## 🎯 권장사항\n"
        
        if success_rate == 100:
            report += "- ✅ 모든 테스트가 성공했습니다. 시스템이 정상 작동 중입니다.\n"
        elif success_rate >= 90:
            report += "- ⚠️ 대부분의 테스트가 성공했지만, 실패한 테스트를 확인하세요.\n"
        else:
            report += "- 🚨 여러 테스트가 실패했습니다. 시스템 상태를 점검하세요.\n"
        
        return report

def main():
    """메인 함수"""
    parser = argparse.ArgumentParser(description='YouArePlan EasyTax v8 E2E 테스트')
    parser.add_argument('--host', default='localhost', help='API 서버 호스트')
    parser.add_argument('--port', type=int, default=8081, help='API 서버 포트')
    parser.add_argument('--period', default='2025-09', help='테스트 기간')
    parser.add_argument('--verbose', '-v', action='store_true', help='상세 로그 출력')
    parser.add_argument('--load-test', type=int, help='부하 테스트 요청 수')
    parser.add_argument('--report-format', choices=['markdown', 'json'], 
                       default='markdown', help='리포트 형식')
    parser.add_argument('--output', help='리포트 파일 경로')
    
    args = parser.parse_args()
    
    # 테스터 인스턴스 생성
    tester = YouArePlanE2ETester(args.host, args.port, args.verbose)
    
    print(f"🧪 YouArePlan EasyTax v8 E2E 테스트")
    print(f"🎯 대상 서버: {tester.base_url}")
    print("=" * 60)
    
    success = False
    
    try:
        if args.load_test:
            # 부하 테스트만 실행
            tester.run_load_test(args.load_test)
            success = True
        else:
            # 전체 E2E 워크플로우 실행
            success = tester.run_e2e_workflow(args.period)
        
        # 리포트 생성
        report = tester.generate_report(args.report_format)
        
        if args.output:
            with open(args.output, 'w', encoding='utf-8') as f:
                f.write(report)
            print(f"\n📄 리포트 저장: {args.output}")
        else:
            print(f"\n📄 테스트 리포트:")
            print(report)
        
        # 최종 결과
        passed = sum(1 for r in tester.test_results if r['success'])
        total = len(tester.test_results)
        
        if success and passed == total:
            print(f"\n🎉 모든 테스트 성공! ({passed}/{total})")
            sys.exit(0)
        else:
            print(f"\n⚠️ 일부 테스트 실패 ({passed}/{total})")
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\n\n⚠️ 사용자에 의해 중단되었습니다")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ 예상치 못한 오류 발생: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()