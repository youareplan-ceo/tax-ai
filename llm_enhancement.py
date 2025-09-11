#!/usr/bin/env python3
"""
YouArePlan EasyTax v8 - LLM 고도화 스크립트
OpenAI API 키 검증, 분류 정확도 테스트, 비용 모니터링 통합
"""

import os, json, time, asyncio
import requests
from datetime import datetime
from typing import Dict, List, Any
from dataclasses import dataclass
import statistics

@dataclass
class TestCase:
    """AI 분류 테스트 케이스"""
    vendor: str
    amount: float
    memo: str
    expected_account: str
    expected_tax: str
    description: str

@dataclass
class ClassificationResult:
    """분류 결과"""
    account_code: str
    tax_type: str
    confidence: float
    reasoning: str
    response_time_ms: float
    cost_usd: float
    tokens_used: int

class LLMEnhancer:
    def __init__(self, base_url: str = "http://localhost:8081"):
        self.base_url = base_url
        self.results = []
        self.total_cost = 0.0
        
        # 한국 세무 기준 테스트 케이스
        self.test_cases = [
            TestCase("스타벅스 코리아", 15000, "팀 회의용 커피", "복리후생비", "불공제", "커피 - 복리후생비/불공제"),
            TestCase("네이버 클라우드", 45000, "서버 호스팅 비용", "통신비", "과세", "클라우드 서비스 - 통신비/과세"),
            TestCase("오피스디포", 8500, "A4 용지 구매", "소모품비", "과세", "사무용품 - 소모품비/과세"),
            TestCase("현대카드", 150000, "고객 접대 식사", "접대비", "불공제", "접대비 - 불공제"),
            TestCase("롯데마트", 25000, "사무실 청소용품", "소모품비", "과세", "청소용품 - 소모품비/과세"),
            TestCase("KT", 89000, "사무실 인터넷", "통신비", "과세", "통신 서비스 - 통신비/과세"),
            TestCase("교보문고", 35000, "업무 관련 도서", "도서인쇄비", "과세", "도서 구매 - 도서인쇄비/과세"),
            TestCase("신한은행", 3000, "계좌이체 수수료", "지급수수료", "과세", "은행 수수료 - 지급수수료/과세"),
            TestCase("LG전자", 1200000, "사무실 에어컨", "비품", "과세", "사무용 비품 - 비품/과세"),
            TestCase("국세청", 50000, "부가세 납부", "조세공과", "불공제", "세금 납부 - 조세공과/불공제")
        ]
    
    def check_api_status(self) -> Dict[str, Any]:
        """API 상태 확인"""
        try:
            response = requests.get(f"{self.base_url}/api/status", timeout=10)
            return response.json()
        except Exception as e:
            return {"error": str(e), "available": False}
    
    def classify_single_entry(self, test_case: TestCase) -> ClassificationResult:
        """단일 거래내역 분류 테스트"""
        payload = {
            "text_context": f"거래처: {test_case.vendor}, 금액: {test_case.amount:,.0f}원, 메모: {test_case.memo}",
            "use_llm": True,
            "need_reasoning": True
        }
        
        start_time = time.time()
        try:
            response = requests.post(f"{self.base_url}/ai/classify-entry", json=payload, timeout=30)
            response_time_ms = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                result_data = data.get("data", {})
                tokens = data.get("tokens", {})
                
                # 비용 추정 (GPT-4o-mini 기준)
                cost_per_1k_input = 0.00015  # $0.15/1M tokens
                cost_per_1k_output = 0.0006  # $0.60/1M tokens
                input_tokens = tokens.get("input", 150)
                output_tokens = tokens.get("output", 50)
                cost_usd = (input_tokens * cost_per_1k_input / 1000) + (output_tokens * cost_per_1k_output / 1000)
                
                return ClassificationResult(
                    account_code=result_data.get("account_code", "미분류"),
                    tax_type=result_data.get("tax_type", "과세"),
                    confidence=result_data.get("confidence", 0.0),
                    reasoning=result_data.get("reason", ""),
                    response_time_ms=response_time_ms,
                    cost_usd=cost_usd,
                    tokens_used=input_tokens + output_tokens
                )
            else:
                return ClassificationResult("오류", "과세", 0.0, f"HTTP {response.status_code}", response_time_ms, 0.0, 0)
                
        except Exception as e:
            response_time_ms = (time.time() - start_time) * 1000
            return ClassificationResult("오류", "과세", 0.0, str(e), response_time_ms, 0.0, 0)
    
    def run_accuracy_test(self) -> Dict[str, Any]:
        """분류 정확도 테스트 실행"""
        print("🧪 AI 분류 정확도 테스트 시작...")
        
        results = []
        total_cost = 0.0
        response_times = []
        
        for i, test_case in enumerate(self.test_cases, 1):
            print(f"  {i}/{len(self.test_cases)}: {test_case.description}")
            
            result = self.classify_single_entry(test_case)
            results.append({
                "test_case": test_case.description,
                "input": {
                    "vendor": test_case.vendor,
                    "amount": test_case.amount,
                    "memo": test_case.memo
                },
                "expected": {
                    "account_code": test_case.expected_account,
                    "tax_type": test_case.expected_tax
                },
                "actual": {
                    "account_code": result.account_code,
                    "tax_type": result.tax_type,
                    "confidence": result.confidence,
                    "reasoning": result.reasoning
                },
                "performance": {
                    "response_time_ms": result.response_time_ms,
                    "cost_usd": result.cost_usd,
                    "tokens_used": result.tokens_used
                },
                "accuracy": {
                    "account_match": result.account_code == test_case.expected_account,
                    "tax_match": result.tax_type == test_case.expected_tax,
                    "both_match": (result.account_code == test_case.expected_account) and (result.tax_type == test_case.expected_tax)
                }
            })
            
            total_cost += result.cost_usd
            response_times.append(result.response_time_ms)
            
            # API 요청 간격 조절
            time.sleep(0.5)
        
        # 통계 계산
        account_accuracy = sum(1 for r in results if r["accuracy"]["account_match"]) / len(results)
        tax_accuracy = sum(1 for r in results if r["accuracy"]["tax_match"]) / len(results)
        overall_accuracy = sum(1 for r in results if r["accuracy"]["both_match"]) / len(results)
        
        avg_response_time = statistics.mean(response_times)
        median_response_time = statistics.median(response_times)
        
        summary = {
            "test_summary": {
                "total_tests": len(results),
                "account_accuracy": round(account_accuracy * 100, 1),
                "tax_accuracy": round(tax_accuracy * 100, 1),
                "overall_accuracy": round(overall_accuracy * 100, 1),
                "avg_response_time_ms": round(avg_response_time, 2),
                "median_response_time_ms": round(median_response_time, 2),
                "total_cost_usd": round(total_cost, 6),
                "estimated_monthly_cost_usd": round(total_cost * 30 * 100, 2)  # 월 3000건 기준
            },
            "detailed_results": results,
            "test_timestamp": datetime.now().isoformat()
        }
        
        print(f"✅ 테스트 완료 - 전체 정확도: {overall_accuracy*100:.1f}%")
        return summary
    
    def run_performance_benchmark(self) -> Dict[str, Any]:
        """성능 벤치마크 실행"""
        print("🚀 성능 벤치마크 시작...")
        
        # 동시 요청 테스트
        concurrent_requests = [5, 10, 20]
        benchmark_results = {}
        
        for concurrent in concurrent_requests:
            print(f"  동시 요청 {concurrent}개 테스트...")
            
            # 간단한 테스트 케이스로 동시 요청
            test_case = self.test_cases[0]
            payload = {
                "text_context": f"거래처: {test_case.vendor}, 금액: {test_case.amount}원, 메모: {test_case.memo}",
                "use_llm": True,
                "need_reasoning": False  # 성능 테스트에서는 reasoning 생략
            }
            
            start_time = time.time()
            success_count = 0
            response_times = []
            
            # 동기적으로 순차 요청 (간단한 성능 테스트)
            for _ in range(concurrent):
                req_start = time.time()
                try:
                    response = requests.post(f"{self.base_url}/ai/classify-entry", json=payload, timeout=10)
                    req_time = (time.time() - req_start) * 1000
                    if response.status_code == 200:
                        success_count += 1
                        response_times.append(req_time)
                except Exception:
                    pass
                time.sleep(0.1)  # 요청 간격
            
            total_time = (time.time() - start_time) * 1000
            
            benchmark_results[f"concurrent_{concurrent}"] = {
                "requests": concurrent,
                "successful": success_count,
                "success_rate": round((success_count / concurrent) * 100, 1),
                "total_time_ms": round(total_time, 2),
                "avg_response_time_ms": round(statistics.mean(response_times) if response_times else 0, 2),
                "requests_per_second": round(success_count / (total_time / 1000), 2) if total_time > 0 else 0
            }
        
        print("✅ 성능 벤치마크 완료")
        return benchmark_results
    
    def run_cost_monitoring(self) -> Dict[str, Any]:
        """비용 모니터링 시뮬레이션"""
        print("💰 비용 모니터링 시뮬레이션...")
        
        # 다양한 사용량 시나리오
        scenarios = [
            {"name": "소규모 (월 100건)", "requests_per_month": 100},
            {"name": "중간 규모 (월 1,000건)", "requests_per_month": 1000},
            {"name": "대규모 (월 10,000건)", "requests_per_month": 10000},
            {"name": "엔터프라이즈 (월 100,000건)", "requests_per_month": 100000}
        ]
        
        # 평균 토큰 사용량 (실제 API 응답 기반)
        avg_input_tokens = 180
        avg_output_tokens = 60
        cost_per_1k_input = 0.00015  # GPT-4o-mini
        cost_per_1k_output = 0.0006
        
        cost_projections = []
        
        for scenario in scenarios:
            monthly_requests = scenario["requests_per_month"]
            
            # 월간 비용 계산
            monthly_input_cost = (monthly_requests * avg_input_tokens * cost_per_1k_input) / 1000
            monthly_output_cost = (monthly_requests * avg_output_tokens * cost_per_1k_output) / 1000
            monthly_total = monthly_input_cost + monthly_output_cost
            
            cost_projections.append({
                "scenario": scenario["name"],
                "monthly_requests": monthly_requests,
                "monthly_cost_usd": round(monthly_total, 2),
                "yearly_cost_usd": round(monthly_total * 12, 2),
                "cost_per_request_usd": round(monthly_total / monthly_requests, 6),
                "tokens_per_month": monthly_requests * (avg_input_tokens + avg_output_tokens)
            })
        
        monitoring_config = {
            "cost_alerts": {
                "daily_limit_usd": 10.0,
                "monthly_limit_usd": 200.0,
                "alert_threshold_percent": 80
            },
            "optimization_tips": [
                "use_llm=False로 규칙 기반 분류 우선 사용",
                "need_reasoning=False로 간단한 분류에서 토큰 절약",
                "배치 처리로 API 호출 횟수 최적화",
                "캐싱으로 중복 분류 요청 방지"
            ]
        }
        
        print("✅ 비용 모니터링 설정 완료")
        return {
            "cost_projections": cost_projections,
            "monitoring_config": monitoring_config,
            "model_pricing": {
                "gpt_4o_mini": {
                    "input_per_1m_tokens": 0.15,
                    "output_per_1m_tokens": 0.60
                }
            }
        }
    
    def generate_llm_report(self) -> Dict[str, Any]:
        """LLM 고도화 종합 리포트 생성"""
        print("📊 LLM 고도화 종합 리포트 생성 중...")
        
        # API 상태 확인
        api_status = self.check_api_status()
        
        # 정확도 테스트 실행
        accuracy_results = self.run_accuracy_test()
        
        # 성능 벤치마크 실행
        performance_results = self.run_performance_benchmark()
        
        # 비용 모니터링 설정
        cost_monitoring = self.run_cost_monitoring()
        
        # 종합 리포트
        report = {
            "llm_enhancement_report": {
                "timestamp": datetime.now().isoformat(),
                "version": "v8",
                "api_status": api_status,
                "accuracy_analysis": accuracy_results,
                "performance_benchmark": performance_results,
                "cost_monitoring": cost_monitoring,
                "recommendations": [
                    "현재 API 키가 데모 모드로 설정되어 있음 - 실제 운영 시 정품 키 필요",
                    f"분류 정확도 {accuracy_results['test_summary']['overall_accuracy']}% - 추가 학습 데이터로 개선 가능",
                    f"평균 응답시간 {accuracy_results['test_summary']['avg_response_time_ms']}ms - 실시간 분류에 적합",
                    "비용 최적화를 위해 규칙 기반 분류와 AI 분류의 하이브리드 접근 권장"
                ],
                "next_steps": [
                    "실제 OpenAI API 키 설정",
                    "프로덕션 환경 성능 모니터링 구축",
                    "비용 알림 시스템 구현",
                    "분류 정확도 개선을 위한 파인튜닝 검토"
                ]
            }
        }
        
        return report

def main():
    """메인 실행 함수"""
    print("🚀 YouArePlan EasyTax v8 - LLM 고도화 시작")
    print("=" * 60)
    
    enhancer = LLMEnhancer()
    
    # 종합 리포트 생성
    report = enhancer.generate_llm_report()
    
    # 리포트 파일 저장
    reports_dir = "reports"
    os.makedirs(reports_dir, exist_ok=True)
    
    # JSON 리포트
    json_path = f"{reports_dir}/llm_enhancement_report.json"
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    
    # HTML 리포트 생성
    html_content = f"""
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>YouArePlan EasyTax v8 - LLM 고도화 리포트</title>
    <style>
        body {{ font-family: 'Noto Sans KR', sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }}
        .container {{ max-width: 1200px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 8px 30px rgba(0,0,0,0.2); overflow: hidden; }}
        .header {{ background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 2rem; text-align: center; }}
        .section {{ padding: 2rem; border-bottom: 1px solid #eee; }}
        .accuracy-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }}
        .stat-card {{ background: #f8f9fa; padding: 1rem; border-radius: 8px; text-align: center; }}
        .stat-number {{ font-size: 2rem; font-weight: bold; color: #667eea; }}
        .recommendations {{ background: #e3f2fd; padding: 1.5rem; border-radius: 8px; margin: 1rem 0; }}
        .performance-table {{ width: 100%; border-collapse: collapse; margin: 1rem 0; }}
        .performance-table th, .performance-table td {{ padding: 0.75rem; border: 1px solid #ddd; text-align: left; }}
        .performance-table th {{ background: #f8f9fa; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧠 LLM 고도화 리포트</h1>
            <p>YouArePlan EasyTax v8 - AI 성능 분석 및 최적화</p>
            <p>{report['llm_enhancement_report']['timestamp']}</p>
        </div>
        
        <div class="section">
            <h2>📊 분류 정확도 분석</h2>
            <div class="accuracy-grid">
                <div class="stat-card">
                    <div class="stat-number">{report['llm_enhancement_report']['accuracy_analysis']['test_summary']['overall_accuracy']}%</div>
                    <div>전체 정확도</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">{report['llm_enhancement_report']['accuracy_analysis']['test_summary']['account_accuracy']}%</div>
                    <div>계정과목 정확도</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">{report['llm_enhancement_report']['accuracy_analysis']['test_summary']['tax_accuracy']}%</div>
                    <div>세금유형 정확도</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">{report['llm_enhancement_report']['accuracy_analysis']['test_summary']['avg_response_time_ms']}ms</div>
                    <div>평균 응답시간</div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h2>🚀 성능 벤치마크</h2>
            <table class="performance-table">
                <thead>
                    <tr><th>동시 요청 수</th><th>성공률</th><th>평균 응답시간</th><th>초당 처리 요청</th></tr>
                </thead>
                <tbody>
    """
    
    for key, perf in report['llm_enhancement_report']['performance_benchmark'].items():
        html_content += f"""
                    <tr>
                        <td>{perf['requests']}개</td>
                        <td>{perf['success_rate']}%</td>
                        <td>{perf['avg_response_time_ms']}ms</td>
                        <td>{perf['requests_per_second']} req/s</td>
                    </tr>"""
    
    html_content += f"""
                </tbody>
            </table>
        </div>
        
        <div class="section">
            <h2>💰 비용 분석</h2>
            <table class="performance-table">
                <thead>
                    <tr><th>사용 규모</th><th>월간 요청</th><th>월간 비용</th><th>요청당 비용</th></tr>
                </thead>
                <tbody>
    """
    
    for proj in report['llm_enhancement_report']['cost_monitoring']['cost_projections']:
        html_content += f"""
                    <tr>
                        <td>{proj['scenario']}</td>
                        <td>{proj['monthly_requests']:,}건</td>
                        <td>${proj['monthly_cost_usd']}</td>
                        <td>${proj['cost_per_request_usd']}</td>
                    </tr>"""
    
    html_content += f"""
                </tbody>
            </table>
        </div>
        
        <div class="section">
            <h2>💡 권장사항</h2>
            <div class="recommendations">
                <ul>
    """
    
    for rec in report['llm_enhancement_report']['recommendations']:
        html_content += f"<li>{rec}</li>"
    
    html_content += """
                </ul>
            </div>
        </div>
        
        <div class="section" style="border-bottom: none;">
            <h2>📋 다음 단계</h2>
            <ol>
    """
    
    for step in report['llm_enhancement_report']['next_steps']:
        html_content += f"<li>{step}</li>"
    
    html_content += """
            </ol>
        </div>
    </div>
</body>
</html>
    """
    
    html_path = f"{reports_dir}/llm_enhancement_report.html"
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    print(f"✅ LLM 고도화 완료!")
    print(f"📄 JSON 리포트: {json_path}")
    print(f"📄 HTML 리포트: {html_path}")
    print("=" * 60)
    
    # 결과 요약 출력
    summary = report['llm_enhancement_report']['accuracy_analysis']['test_summary']
    print(f"🎯 분류 정확도: {summary['overall_accuracy']}%")
    print(f"⚡ 평균 응답시간: {summary['avg_response_time_ms']}ms")
    print(f"💰 예상 월간 비용: ${summary['estimated_monthly_cost_usd']}")

if __name__ == "__main__":
    main()