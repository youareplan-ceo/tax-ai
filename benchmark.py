#!/usr/bin/env python3
"""
YouArePlan EasyTax v8 - 성능 벤치마크 도구

API 응답 시간, 처리량, 메모리 사용량 등을 측정하는 전문 벤치마크 도구

사용법:
    python benchmark.py
    python benchmark.py --duration 300 --concurrent 10
    python benchmark.py --endpoint /tax/estimate --method GET
"""

import requests
import time
import json
import argparse
import threading
import statistics
from datetime import datetime
from typing import Dict, List, Any
import psutil
import os

class YouArePlanBenchmark:
    """YouArePlan EasyTax 성능 벤치마크"""
    
    def __init__(self, host: str = "localhost", port: int = 8081):
        self.base_url = f"http://{host}:{port}"
        self.results = []
        self.start_time = None
        self.end_time = None
        
    def measure_response_time(self, endpoint: str, method: str = "GET", 
                            data: Dict = None, params: Dict = None) -> Dict[str, Any]:
        """단일 요청 응답 시간 측정"""
        start_time = time.perf_counter()
        
        try:
            if method.upper() == "GET":
                response = requests.get(f"{self.base_url}{endpoint}", 
                                      params=params, timeout=30)
            elif method.upper() == "POST":
                response = requests.post(f"{self.base_url}{endpoint}", 
                                       json=data, params=params, timeout=30)
            else:
                raise ValueError(f"지원하지 않는 HTTP 메소드: {method}")
            
            end_time = time.perf_counter()
            response_time = (end_time - start_time) * 1000  # ms
            
            return {
                "success": True,
                "status_code": response.status_code,
                "response_time_ms": response_time,
                "content_length": len(response.content),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            end_time = time.perf_counter()
            response_time = (end_time - start_time) * 1000
            
            return {
                "success": False,
                "error": str(e),
                "response_time_ms": response_time,
                "timestamp": datetime.now().isoformat()
            }
    
    def run_load_test(self, endpoint: str, duration_seconds: int = 60, 
                     concurrent_users: int = 5, method: str = "GET") -> Dict[str, Any]:
        """부하 테스트 실행"""
        print(f"🚀 부하 테스트 시작")
        print(f"📍 엔드포인트: {endpoint}")
        print(f"⏱️  지속시간: {duration_seconds}초")
        print(f"👥 동시 사용자: {concurrent_users}명")
        print("=" * 50)
        
        self.start_time = time.time()
        results = []
        
        def worker():
            """워커 스레드 함수"""
            while time.time() - self.start_time < duration_seconds:
                result = self.measure_response_time(endpoint, method, 
                                                  params={"period": "2025-09"})
                results.append(result)
                time.sleep(0.1)  # 요청 간격
        
        # 스레드 시작
        threads = []
        for _ in range(concurrent_users):
            thread = threading.Thread(target=worker)
            thread.daemon = True
            thread.start()
            threads.append(thread)
        
        # 진행률 표시
        start = time.time()
        while time.time() - start < duration_seconds:
            elapsed = time.time() - start
            progress = (elapsed / duration_seconds) * 100
            print(f"\r진행률: {progress:.1f}% ({len(results)}개 요청 완료)", end="")
            time.sleep(1)
        
        # 모든 스레드 완료 대기
        for thread in threads:
            thread.join(timeout=5)
        
        self.end_time = time.time()
        print(f"\n\n✅ 테스트 완료: {len(results)}개 요청 처리")
        
        return self.analyze_results(results)
    
    def analyze_results(self, results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """결과 분석"""
        if not results:
            return {"error": "분석할 결과가 없습니다"}
        
        # 성공한 요청들만 필터링
        successful = [r for r in results if r.get("success", False)]
        failed = [r for r in results if not r.get("success", True)]
        
        if not successful:
            return {"error": "성공한 요청이 없습니다"}
        
        # 응답 시간 통계
        response_times = [r["response_time_ms"] for r in successful]
        
        total_duration = self.end_time - self.start_time if self.start_time and self.end_time else 0
        throughput = len(successful) / total_duration if total_duration > 0 else 0
        
        # HTTP 상태 코드 분석
        status_codes = {}
        for result in results:
            code = result.get("status_code", "error")
            status_codes[code] = status_codes.get(code, 0) + 1
        
        analysis = {
            "summary": {
                "total_requests": len(results),
                "successful_requests": len(successful),
                "failed_requests": len(failed),
                "success_rate_percent": round((len(successful) / len(results)) * 100, 2),
                "test_duration_seconds": round(total_duration, 2),
                "throughput_rps": round(throughput, 2)
            },
            "response_times": {
                "min_ms": round(min(response_times), 2),
                "max_ms": round(max(response_times), 2),
                "mean_ms": round(statistics.mean(response_times), 2),
                "median_ms": round(statistics.median(response_times), 2),
                "p95_ms": round(self.percentile(response_times, 95), 2),
                "p99_ms": round(self.percentile(response_times, 99), 2),
                "std_dev_ms": round(statistics.stdev(response_times) if len(response_times) > 1 else 0, 2)
            },
            "http_status_codes": status_codes,
            "errors": [r.get("error") for r in failed] if failed else []
        }
        
        return analysis
    
    def percentile(self, data: List[float], percentile: float) -> float:
        """백분위수 계산"""
        sorted_data = sorted(data)
        index = (percentile / 100.0) * (len(sorted_data) - 1)
        
        if index.is_integer():
            return sorted_data[int(index)]
        else:
            lower = sorted_data[int(index)]
            upper = sorted_data[int(index) + 1]
            return lower + (upper - lower) * (index - int(index))
    
    def benchmark_all_endpoints(self) -> Dict[str, Any]:
        """모든 주요 엔드포인트 벤치마크"""
        endpoints = [
            {"path": "/health", "method": "GET", "name": "Health Check"},
            {"path": "/api/status", "method": "GET", "name": "API Status"},
            {"path": "/entries/list", "method": "GET", "name": "Entries List"},
            {"path": "/tax/estimate", "method": "GET", "name": "Tax Estimate"},
            {"path": "/prep/refresh", "method": "POST", "name": "Checklist Generation"}
        ]
        
        print("🔍 전체 엔드포인트 성능 측정")
        print("=" * 50)
        
        benchmark_results = {}
        
        for endpoint in endpoints:
            print(f"\n📍 테스트 중: {endpoint['name']} ({endpoint['path']})")
            
            # 10회 요청으로 간단 테스트
            results = []
            for i in range(10):
                if endpoint["method"] == "GET":
                    result = self.measure_response_time(endpoint["path"], "GET", 
                                                      params={"period": "2025-09"})
                else:
                    result = self.measure_response_time(endpoint["path"], "POST", 
                                                      params={"period": "2025-09", "taxType": "VAT"})
                results.append(result)
                print(f"   {i+1}/10 완료", end="\r")
            
            # 간단한 통계 계산
            successful = [r for r in results if r.get("success", False)]
            if successful:
                response_times = [r["response_time_ms"] for r in successful]
                avg_time = statistics.mean(response_times)
                success_rate = len(successful) / len(results) * 100
                
                benchmark_results[endpoint["name"]] = {
                    "average_response_time_ms": round(avg_time, 2),
                    "success_rate_percent": round(success_rate, 2),
                    "min_ms": round(min(response_times), 2),
                    "max_ms": round(max(response_times), 2)
                }
                
                print(f"   ✅ 평균 응답시간: {avg_time:.2f}ms, 성공률: {success_rate:.1f}%")
            else:
                benchmark_results[endpoint["name"]] = {"error": "모든 요청 실패"}
                print(f"   ❌ 모든 요청 실패")
        
        return benchmark_results
    
    def get_system_info(self) -> Dict[str, Any]:
        """시스템 정보 수집"""
        try:
            return {
                "cpu_count": psutil.cpu_count(),
                "cpu_percent": psutil.cpu_percent(interval=1),
                "memory": {
                    "total_gb": round(psutil.virtual_memory().total / (1024**3), 2),
                    "used_gb": round(psutil.virtual_memory().used / (1024**3), 2),
                    "percent": psutil.virtual_memory().percent
                },
                "disk": {
                    "total_gb": round(psutil.disk_usage('/').total / (1024**3), 2),
                    "used_gb": round(psutil.disk_usage('/').used / (1024**3), 2),
                    "percent": round(psutil.disk_usage('/').used / psutil.disk_usage('/').total * 100, 1)
                }
            }
        except Exception as e:
            return {"error": f"시스템 정보 수집 실패: {e}"}
    
    def generate_report(self, analysis: Dict[str, Any], format: str = "markdown") -> str:
        """벤치마크 리포트 생성"""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        if format == "json":
            report_data = {
                "timestamp": timestamp,
                "target_url": self.base_url,
                "system_info": self.get_system_info(),
                "benchmark_results": analysis
            }
            return json.dumps(report_data, indent=2, ensure_ascii=False)
        
        # Markdown 리포트
        system_info = self.get_system_info()
        
        report = f"""# YouArePlan EasyTax v8 성능 벤치마크 리포트

**측정 시간**: {timestamp}
**대상 서버**: {self.base_url}

## 🖥️ 시스템 정보

- **CPU**: {system_info.get('cpu_count', 'N/A')}코어, 사용률 {system_info.get('cpu_percent', 'N/A')}%
- **메모리**: {system_info.get('memory', {}).get('used_gb', 'N/A')}GB / {system_info.get('memory', {}).get('total_gb', 'N/A')}GB ({system_info.get('memory', {}).get('percent', 'N/A')}%)
- **디스크**: {system_info.get('disk', {}).get('used_gb', 'N/A')}GB / {system_info.get('disk', {}).get('total_gb', 'N/A')}GB ({system_info.get('disk', {}).get('percent', 'N/A')}%)

## 📊 성능 측정 결과

### 전체 요약
- **총 요청**: {analysis.get('summary', {}).get('total_requests', 'N/A')}회
- **성공 요청**: {analysis.get('summary', {}).get('successful_requests', 'N/A')}회
- **성공률**: {analysis.get('summary', {}).get('success_rate_percent', 'N/A')}%
- **처리량**: {analysis.get('summary', {}).get('throughput_rps', 'N/A')} RPS
- **테스트 시간**: {analysis.get('summary', {}).get('test_duration_seconds', 'N/A')}초

### 응답 시간 분석
- **최소**: {analysis.get('response_times', {}).get('min_ms', 'N/A')}ms
- **최대**: {analysis.get('response_times', {}).get('max_ms', 'N/A')}ms
- **평균**: {analysis.get('response_times', {}).get('mean_ms', 'N/A')}ms
- **중간값**: {analysis.get('response_times', {}).get('median_ms', 'N/A')}ms
- **95백분위**: {analysis.get('response_times', {}).get('p95_ms', 'N/A')}ms
- **99백분위**: {analysis.get('response_times', {}).get('p99_ms', 'N/A')}ms
- **표준편차**: {analysis.get('response_times', {}).get('std_dev_ms', 'N/A')}ms

### HTTP 상태 코드
"""
        
        for code, count in analysis.get('http_status_codes', {}).items():
            report += f"- **{code}**: {count}회\n"
        
        # 성능 평가
        mean_time = analysis.get('response_times', {}).get('mean_ms', 0)
        success_rate = analysis.get('summary', {}).get('success_rate_percent', 0)
        
        report += f"\n## 🎯 성능 평가\n\n"
        
        if success_rate >= 99:
            report += "- ✅ **안정성**: 매우 우수 (99% 이상 성공률)\n"
        elif success_rate >= 95:
            report += "- ✅ **안정성**: 우수 (95% 이상 성공률)\n"
        else:
            report += "- ⚠️ **안정성**: 개선 필요 (95% 미만 성공률)\n"
        
        if mean_time < 50:
            report += "- 🚀 **응답 속도**: 매우 빠름 (50ms 미만)\n"
        elif mean_time < 100:
            report += "- ✅ **응답 속도**: 빠름 (100ms 미만)\n"
        elif mean_time < 500:
            report += "- ✅ **응답 속도**: 보통 (500ms 미만)\n"
        else:
            report += "- ⚠️ **응답 속도**: 느림 (500ms 이상) - 최적화 필요\n"
        
        throughput = analysis.get('summary', {}).get('throughput_rps', 0)
        if throughput > 100:
            report += "- 🚀 **처리량**: 매우 높음 (100+ RPS)\n"
        elif throughput > 50:
            report += "- ✅ **처리량**: 높음 (50+ RPS)\n"
        else:
            report += "- ⚠️ **처리량**: 보통 (50 RPS 미만)\n"
        
        return report

def main():
    """메인 함수"""
    parser = argparse.ArgumentParser(description='YouArePlan EasyTax v8 성능 벤치마크')
    parser.add_argument('--host', default='localhost', help='API 서버 호스트')
    parser.add_argument('--port', type=int, default=8081, help='API 서버 포트')
    parser.add_argument('--endpoint', default='/health', help='테스트할 엔드포인트')
    parser.add_argument('--method', default='GET', choices=['GET', 'POST'], help='HTTP 메소드')
    parser.add_argument('--duration', type=int, default=60, help='테스트 지속 시간(초)')
    parser.add_argument('--concurrent', type=int, default=5, help='동시 사용자 수')
    parser.add_argument('--all-endpoints', action='store_true', help='모든 엔드포인트 테스트')
    parser.add_argument('--format', choices=['markdown', 'json'], default='markdown', help='리포트 형식')
    parser.add_argument('--output', help='리포트 파일 경로')
    
    args = parser.parse_args()
    
    benchmark = YouArePlanBenchmark(args.host, args.port)
    
    print(f"⚡ YouArePlan EasyTax v8 성능 벤치마크")
    print(f"🎯 대상 서버: {benchmark.base_url}")
    print("=" * 60)
    
    try:
        if args.all_endpoints:
            # 모든 엔드포인트 벤치마크
            results = benchmark.benchmark_all_endpoints()
            report_data = {"endpoint_benchmarks": results}
            report = benchmark.generate_report(report_data, args.format)
        else:
            # 특정 엔드포인트 부하 테스트
            analysis = benchmark.run_load_test(
                args.endpoint, args.duration, args.concurrent, args.method
            )
            report = benchmark.generate_report(analysis, args.format)
        
        # 리포트 출력 또는 저장
        if args.output:
            with open(args.output, 'w', encoding='utf-8') as f:
                f.write(report)
            print(f"\n📄 리포트 저장: {args.output}")
        else:
            print(f"\n📄 벤치마크 리포트:")
            print(report)
        
        print(f"\n🎉 벤치마크 완료!")
        
    except KeyboardInterrupt:
        print("\n\n⚠️ 사용자에 의해 중단되었습니다")
    except Exception as e:
        print(f"\n❌ 오류 발생: {e}")

if __name__ == "__main__":
    main()