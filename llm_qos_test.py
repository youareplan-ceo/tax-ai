#!/usr/bin/env python3
"""
YouArePlan EasyTax v8 - LLM QoS 메트릭 테스트 (20건 샘플)
실제 API 키 등록 없이 데모 모드로 QoS 메트릭 수집
"""

import json
import time
import requests
from datetime import datetime
from typing import Dict, List, Any

class LLMQoSTester:
    def __init__(self, base_url: str = "http://localhost:8081"):
        self.base_url = base_url
        self.test_samples = [
            {"vendor": "스타벅스 코리아", "amount": 15000, "memo": "팀 회의용 커피", "category": "복리후생"},
            {"vendor": "네이버 클라우드", "amount": 45000, "memo": "서버 호스팅 비용", "category": "통신비"},
            {"vendor": "오피스디포", "amount": 8500, "memo": "A4 용지 구매", "category": "소모품비"},
            {"vendor": "현대카드", "amount": 150000, "memo": "고객 접대 식사", "category": "접대비"},
            {"vendor": "롯데마트", "amount": 25000, "memo": "사무실 청소용품", "category": "소모품비"},
            {"vendor": "KT", "amount": 89000, "memo": "사무실 인터넷", "category": "통신비"},
            {"vendor": "교보문고", "amount": 35000, "memo": "업무 관련 도서", "category": "도서인쇄비"},
            {"vendor": "신한은행", "amount": 3000, "memo": "계좌이체 수수료", "category": "지급수수료"},
            {"vendor": "LG전자", "amount": 1200000, "memo": "사무실 에어컨", "category": "비품"},
            {"vendor": "국세청", "amount": 50000, "memo": "부가세 납부", "category": "조세공과"},
            {"vendor": "맥도날드", "amount": 12000, "memo": "점심 식사", "category": "복리후생"},
            {"vendor": "GS25", "amount": 5500, "memo": "사무용 문구류", "category": "소모품비"},
            {"vendor": "택시", "amount": 18000, "memo": "고객 미팅 이동", "category": "여비교통비"},
            {"vendor": "CGV", "amount": 32000, "memo": "팀 단합 영화관람", "category": "복리후생"},
            {"vendor": "쿠팡", "amount": 67000, "memo": "사무실 간식", "category": "복리후생"},
            {"vendor": "카카오페이", "amount": 2200, "memo": "송금 수수료", "category": "지급수수료"},
            {"vendor": "삼성전자", "amount": 890000, "memo": "업무용 모니터", "category": "비품"},
            {"vendor": "네이버페이", "amount": 4500, "memo": "결제 수수료", "category": "지급수수료"},
            {"vendor": "이마트", "amount": 45000, "memo": "사무실 생수", "category": "복리후생"},
            {"vendor": "우리은행", "amount": 1500, "memo": "계좌 관리비", "category": "지급수수료"}
        ]
    
    def test_single_classification(self, sample: Dict) -> Dict[str, Any]:
        """단일 분류 테스트 실행"""
        payload = {
            "text_context": f"거래처: {sample['vendor']}, 금액: {sample['amount']:,}원, 메모: {sample['memo']}",
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
                
                # 비용 추정 (데모 모드 기준)
                cost_usd = 0.000157  # GPT-4o-mini 평균 비용
                
                return {
                    "success": True,
                    "input": sample,
                    "output": {
                        "account_code": result_data.get("account_code", "미분류"),
                        "tax_type": result_data.get("tax_type", "과세"),
                        "confidence": result_data.get("confidence", 0.0),
                        "reasoning": result_data.get("reason", ""),
                        "demo_mode": result_data.get("demo_mode", True)
                    },
                    "performance": {
                        "response_time_ms": response_time_ms,
                        "cost_usd": cost_usd,
                        "status_code": response.status_code
                    }
                }
            else:
                return {
                    "success": False,
                    "input": sample,
                    "error": f"HTTP {response.status_code}",
                    "performance": {
                        "response_time_ms": (time.time() - start_time) * 1000,
                        "cost_usd": 0.0,
                        "status_code": response.status_code
                    }
                }
                
        except Exception as e:
            return {
                "success": False,
                "input": sample,
                "error": str(e),
                "performance": {
                    "response_time_ms": (time.time() - start_time) * 1000,
                    "cost_usd": 0.0,
                    "status_code": 0
                }
            }
    
    def run_qos_test(self) -> Dict[str, Any]:
        """20건 LLM QoS 테스트 실행"""
        print("🧠 LLM QoS 메트릭 테스트 시작 (20건 샘플)")
        print("=" * 60)
        
        results = []
        total_cost = 0.0
        response_times = []
        success_count = 0
        
        for i, sample in enumerate(self.test_samples, 1):
            print(f"  {i:2d}/20: {sample['vendor']} ({sample['amount']:,}원)")
            
            result = self.test_single_classification(sample)
            results.append(result)
            
            if result["success"]:
                success_count += 1
                response_times.append(result["performance"]["response_time_ms"])
                total_cost += result["performance"]["cost_usd"]
            
            # API 요청 간격 조절
            time.sleep(0.2)
        
        # 통계 계산
        success_rate = (success_count / len(results)) * 100
        avg_response_time = sum(response_times) / len(response_times) if response_times else 0
        min_response_time = min(response_times) if response_times else 0
        max_response_time = max(response_times) if response_times else 0
        
        # QoS 메트릭 생성
        qos_metrics = {
            "test_info": {
                "timestamp": datetime.now().isoformat(),
                "total_samples": len(self.test_samples),
                "test_duration_seconds": len(self.test_samples) * 0.2 + sum(response_times) / 1000,
                "api_endpoint": f"{self.base_url}/ai/classify-entry"
            },
            "performance_metrics": {
                "success_rate_percent": round(success_rate, 1),
                "successful_requests": success_count,
                "failed_requests": len(results) - success_count,
                "avg_response_time_ms": round(avg_response_time, 2),
                "min_response_time_ms": round(min_response_time, 2),
                "max_response_time_ms": round(max_response_time, 2),
                "total_cost_usd": round(total_cost, 6),
                "cost_per_request_usd": round(total_cost / len(results), 6)
            },
            "cost_analysis": {
                "demo_mode": True,
                "estimated_monthly_cost_1000_requests": round(total_cost * 50, 2),
                "estimated_yearly_cost_12000_requests": round(total_cost * 600, 2),
                "cost_efficiency_rating": "매우 경제적" if total_cost < 0.01 else "경제적"
            },
            "quality_metrics": {
                "reliability_score": round(success_rate, 1),
                "performance_grade": "A" if avg_response_time < 100 else "B" if avg_response_time < 500 else "C",
                "consistency_score": round(100 - (max_response_time - min_response_time) / avg_response_time * 10, 1) if avg_response_time > 0 else 0
            },
            "detailed_results": results
        }
        
        print(f"\n✅ LLM QoS 테스트 완료!")
        print(f"🎯 성공률: {success_rate:.1f}%")
        print(f"⚡ 평균 응답시간: {avg_response_time:.2f}ms")
        print(f"💰 총 비용: ${total_cost:.6f}")
        
        return qos_metrics

def main():
    """메인 실행 함수"""
    print("🧠 YouArePlan EasyTax v8 - LLM QoS 메트릭 테스트")
    print("=" * 60)
    
    tester = LLMQoSTester()
    
    # QoS 테스트 실행
    qos_metrics = tester.run_qos_test()
    
    # 결과 저장
    output_path = "reports/llm_qos_metrics.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(qos_metrics, f, ensure_ascii=False, indent=2)
    
    print(f"\n📄 QoS 메트릭 저장: {output_path}")
    print("=" * 60)
    
    # 요약 출력
    perf = qos_metrics["performance_metrics"]
    print(f"📊 최종 QoS 요약:")
    print(f"  • 성공률: {perf['success_rate_percent']}%")
    print(f"  • 평균 응답시간: {perf['avg_response_time_ms']}ms")
    print(f"  • 총 비용: ${perf['total_cost_usd']}")
    print(f"  • 요청당 비용: ${perf['cost_per_request_usd']}")
    print(f"  • 성능 등급: {qos_metrics['quality_metrics']['performance_grade']}")

if __name__ == "__main__":
    main()