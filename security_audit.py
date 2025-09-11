#!/usr/bin/env python3
"""
YouArePlan EasyTax v8 - 보안 감사 및 품질 검증 도구
상용 서비스 배포를 위한 종합적인 보안 취약점 스캔 및 코드 품질 검증
"""

import os, sys, json, re, hashlib
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timezone
import subprocess
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SecurityIssue:
    """보안 이슈 데이터 구조"""
    def __init__(self, severity: str, category: str, file_path: str, line_number: int, 
                 description: str, recommendation: str, code_snippet: Optional[str] = None):
        self.severity = severity  # HIGH, MEDIUM, LOW, INFO
        self.category = category  # SECRET, INJECTION, XSS, CORS, AUTH, etc.
        self.file_path = file_path
        self.line_number = line_number
        self.description = description
        self.recommendation = recommendation
        self.code_snippet = code_snippet
        self.timestamp = datetime.now(timezone.utc).isoformat()

class SecurityAuditor:
    """포괄적인 보안 감사 도구"""
    
    def __init__(self, project_path: str = "."):
        self.project_path = Path(project_path).resolve()
        self.issues: List[SecurityIssue] = []
        
        # 민감한 정보 패턴 정의
        self.secret_patterns = {
            "API_KEY": r'(?i)(api[_-]?key|apikey)\s*[=:]\s*["\']?([a-zA-Z0-9_-]{16,})["\']?',
            "PASSWORD": r'(?i)(password|pwd|pass)\s*[=:]\s*["\']([^"\'\s]{6,})["\']',
            "TOKEN": r'(?i)(token|jwt|bearer)\s*[=:]\s*["\']?([a-zA-Z0-9._-]{20,})["\']?',
            "SECRET_KEY": r'(?i)(secret[_-]?key|secretkey)\s*[=:]\s*["\']([^"\'\s]{16,})["\']',
            "DATABASE_URL": r'(?i)(database[_-]?url|db[_-]?url)\s*[=:]\s*["\']?(postgresql|mysql|mongodb)://[^"\'\s]+["\']?',
            "SSH_KEY": r'-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----',
            "AWS_KEY": r'(?i)(aws[_-]?access[_-]?key|aws[_-]?secret)',
        }
        
        # SQL 인젝션 패턴
        self.injection_patterns = {
            "SQL_INJECTION": r'(?i)(select|insert|update|delete|drop|create|alter)\s+.*(from|into|set|where).*\+.*["\']',
            "COMMAND_INJECTION": r'(?i)(exec|system|popen|subprocess\.call|os\.system)\s*\(',
            "XSS_RISK": r'(?i)(\.innerHTML|\.outerHTML|document\.write|eval\s*\()',
        }
        
        # 위험한 설정 패턴
        self.config_patterns = {
            "DEBUG_ENABLED": r'(?i)debug\s*[=:]\s*true',
            "CORS_WILDCARD": r'(?i)(allow[_-]?origin|cors[_-]?origin)\s*[=:]\s*["\']?\*["\']?',
            "WEAK_CIPHER": r'(?i)(des|md5|sha1|rc4)',
            "HTTP_ONLY": r'(?i)https?\s*[=:]\s*["\']?false["\']?',
        }
        
        # 제외할 파일/디렉토리
        self.excluded_patterns = {
            ".git", ".venv", "__pycache__", ".pytest_cache", 
            "node_modules", "dist", "build", ".env.example",
            "*.pyc", "*.log", "*.tmp"
        }
        
    def _should_scan_file(self, file_path: Path) -> bool:
        """파일이 스캔 대상인지 확인"""
        if file_path.is_dir():
            return False
            
        # 제외 패턴 체크
        for pattern in self.excluded_patterns:
            if pattern in str(file_path):
                return False
                
        # 스캔할 확장자만 포함
        scan_extensions = {'.py', '.js', '.json', '.yaml', '.yml', '.env', '.txt', '.md', '.html', '.css'}
        return file_path.suffix.lower() in scan_extensions or file_path.name.startswith('.env')
    
    def _read_file_safe(self, file_path: Path) -> Optional[str]:
        """파일을 안전하게 읽기"""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                return f.read()
        except Exception as e:
            logger.warning(f"파일 읽기 실패 {file_path}: {e}")
            return None
    
    def scan_secrets(self) -> int:
        """민감한 정보 스캔"""
        issues_found = 0
        logger.info("🔍 민감한 정보 스캔 시작...")
        
        for file_path in self.project_path.rglob('*'):
            if not self._should_scan_file(file_path):
                continue
                
            content = self._read_file_safe(file_path)
            if not content:
                continue
                
            lines = content.split('\n')
            
            for pattern_name, pattern in self.secret_patterns.items():
                for line_num, line in enumerate(lines, 1):
                    if re.search(pattern, line):
                        # .env.example이나 테스트 파일은 경고 수준 낮춤
                        severity = "LOW" if ("example" in str(file_path) or "test" in str(file_path)) else "HIGH"
                        
                        # 실제 키 값인지 확인 (placeholder가 아닌)
                        if any(placeholder in line.lower() for placeholder in 
                               ["your-", "placeholder", "example", "test-", "demo-", "sk-proj-demo"]):
                            severity = "INFO"
                        
                        issue = SecurityIssue(
                            severity=severity,
                            category="SECRET",
                            file_path=str(file_path.relative_to(self.project_path)),
                            line_number=line_num,
                            description=f"{pattern_name} 감지: 민감한 정보가 하드코딩되어 있습니다",
                            recommendation="환경 변수나 보안 저장소를 사용하여 민감한 정보를 관리하세요",
                            code_snippet=line.strip()
                        )
                        self.issues.append(issue)
                        issues_found += 1
        
        logger.info(f"✅ 민감한 정보 스캔 완료: {issues_found}개 이슈 발견")
        return issues_found
    
    def scan_injection_risks(self) -> int:
        """인젝션 공격 위험 스캔"""
        issues_found = 0
        logger.info("🔍 인젝션 공격 위험 스캔 시작...")
        
        for file_path in self.project_path.rglob('*.py'):
            if not self._should_scan_file(file_path):
                continue
                
            content = self._read_file_safe(file_path)
            if not content:
                continue
                
            lines = content.split('\n')
            
            for pattern_name, pattern in self.injection_patterns.items():
                for line_num, line in enumerate(lines, 1):
                    if re.search(pattern, line) and "#" not in line:  # 주석 제외
                        severity = "HIGH" if "SQL_INJECTION" in pattern_name else "MEDIUM"
                        
                        issue = SecurityIssue(
                            severity=severity,
                            category="INJECTION", 
                            file_path=str(file_path.relative_to(self.project_path)),
                            line_number=line_num,
                            description=f"{pattern_name} 위험: 인젝션 공격에 취약할 수 있습니다",
                            recommendation="매개변수화된 쿼리나 안전한 API를 사용하세요",
                            code_snippet=line.strip()
                        )
                        self.issues.append(issue)
                        issues_found += 1
        
        logger.info(f"✅ 인젝션 위험 스캔 완료: {issues_found}개 이슈 발견")
        return issues_found
    
    def scan_config_issues(self) -> int:
        """설정 보안 이슈 스캔"""
        issues_found = 0
        logger.info("🔍 보안 설정 이슈 스캔 시작...")
        
        for file_path in self.project_path.rglob('*'):
            if not self._should_scan_file(file_path):
                continue
                
            content = self._read_file_safe(file_path)
            if not content:
                continue
                
            lines = content.split('\n')
            
            for pattern_name, pattern in self.config_patterns.items():
                for line_num, line in enumerate(lines, 1):
                    if re.search(pattern, line) and not line.strip().startswith('#'):
                        severity = "HIGH" if pattern_name in ["DEBUG_ENABLED", "CORS_WILDCARD"] else "MEDIUM"
                        
                        issue = SecurityIssue(
                            severity=severity,
                            category="CONFIG",
                            file_path=str(file_path.relative_to(self.project_path)),
                            line_number=line_num,
                            description=f"{pattern_name}: 보안에 취약한 설정이 감지되었습니다",
                            recommendation=self._get_config_recommendation(pattern_name),
                            code_snippet=line.strip()
                        )
                        self.issues.append(issue)
                        issues_found += 1
        
        logger.info(f"✅ 설정 이슈 스캔 완료: {issues_found}개 이슈 발견")
        return issues_found
    
    def _get_config_recommendation(self, pattern_name: str) -> str:
        """설정 패턴별 권장사항 반환"""
        recommendations = {
            "DEBUG_ENABLED": "프로덕션에서는 DEBUG를 False로 설정하세요",
            "CORS_WILDCARD": "CORS에서 와일드카드(*) 대신 특정 도메인을 명시하세요", 
            "WEAK_CIPHER": "더 강력한 암호화 알고리즘(AES, SHA-256)을 사용하세요",
            "HTTP_ONLY": "HTTPS를 사용하여 통신을 암호화하세요"
        }
        return recommendations.get(pattern_name, "보안 모범사례를 따라 설정을 수정하세요")
    
    def check_file_permissions(self) -> int:
        """파일 권한 검사"""
        issues_found = 0
        logger.info("🔍 파일 권한 검사 시작...")
        
        try:
            for file_path in self.project_path.rglob('*'):
                if file_path.is_file() and self._should_scan_file(file_path):
                    stat = file_path.stat()
                    mode = oct(stat.st_mode)[-3:]
                    
                    # 민감한 파일들의 과도한 권한 체크
                    if file_path.name.startswith('.env') and mode != '600':
                        issue = SecurityIssue(
                            severity="MEDIUM",
                            category="PERMISSIONS",
                            file_path=str(file_path.relative_to(self.project_path)),
                            line_number=0,
                            description=f"환경 파일 권한이 과도합니다 (현재: {mode})",
                            recommendation="chmod 600으로 환경 파일의 권한을 제한하세요"
                        )
                        self.issues.append(issue)
                        issues_found += 1
                        
        except Exception as e:
            logger.warning(f"파일 권한 검사 중 오류: {e}")
        
        logger.info(f"✅ 파일 권한 검사 완료: {issues_found}개 이슈 발견")
        return issues_found
    
    def check_dependencies(self) -> int:
        """의존성 보안 취약점 검사"""
        issues_found = 0
        logger.info("🔍 의존성 보안 취약점 검사 시작...")
        
        requirements_file = self.project_path / "requirements.txt"
        if requirements_file.exists():
            try:
                # pip-audit 도구가 있다면 사용 (없어도 계속 진행)
                result = subprocess.run(
                    ["pip", "list", "--format=json"], 
                    capture_output=True, text=True, timeout=30
                )
                
                if result.returncode == 0:
                    packages = json.loads(result.stdout)
                    outdated_packages = []
                    
                    # 주요 보안 패키지들의 최소 권장 버전
                    security_packages = {
                        "requests": "2.28.0",
                        "urllib3": "1.26.12", 
                        "cryptography": "3.4.8",
                        "pyjwt": "2.4.0"
                    }
                    
                    for pkg in packages:
                        pkg_name = pkg["name"].lower()
                        if pkg_name in security_packages:
                            recommended = security_packages[pkg_name]
                            current = pkg["version"]
                            
                            # 간단한 버전 비교 (실제로는 더 정교한 비교 필요)
                            if current < recommended:
                                issue = SecurityIssue(
                                    severity="MEDIUM",
                                    category="DEPENDENCY",
                                    file_path="requirements.txt",
                                    line_number=0,
                                    description=f"{pkg_name} {current}은 보안 취약점이 있을 수 있습니다",
                                    recommendation=f"{pkg_name}>={recommended}로 업그레이드하세요"
                                )
                                self.issues.append(issue)
                                issues_found += 1
                                
            except Exception as e:
                logger.warning(f"의존성 검사 중 오류: {e}")
        
        logger.info(f"✅ 의존성 검사 완료: {issues_found}개 이슈 발견")
        return issues_found
    
    def analyze_api_security(self) -> int:
        """API 보안 분석"""
        issues_found = 0
        logger.info("🔍 API 보안 분석 시작...")
        
        # FastAPI 라우터 파일들 검사
        for router_file in self.project_path.rglob("api/routers/*.py"):
            content = self._read_file_safe(router_file)
            if not content:
                continue
                
            lines = content.split('\n')
            
            for line_num, line in enumerate(lines, 1):
                # 인증이 없는 민감한 엔드포인트 체크
                if re.search(r'@router\.(post|put|delete)', line) and line_num + 5 < len(lines):
                    function_lines = lines[line_num:line_num + 5]
                    function_content = '\n'.join(function_lines)
                    
                    # 인증 확인
                    if ("Depends" not in function_content and 
                        "Authorization" not in function_content and
                        "upload" in function_content.lower()):
                        
                        issue = SecurityIssue(
                            severity="HIGH",
                            category="AUTH",
                            file_path=str(router_file.relative_to(self.project_path)),
                            line_number=line_num,
                            description="인증이 없는 민감한 API 엔드포인트가 발견되었습니다",
                            recommendation="API 엔드포인트에 적절한 인증/인가를 추가하세요",
                            code_snippet=line.strip()
                        )
                        self.issues.append(issue)
                        issues_found += 1
        
        logger.info(f"✅ API 보안 분석 완료: {issues_found}개 이슈 발견")
        return issues_found
    
    def generate_security_report(self) -> Dict[str, Any]:
        """보안 감사 종합 리포트 생성"""
        
        # 심각도별 분류
        severity_counts = {"HIGH": 0, "MEDIUM": 0, "LOW": 0, "INFO": 0}
        category_counts = {}
        
        for issue in self.issues:
            severity_counts[issue.severity] += 1
            category_counts[issue.category] = category_counts.get(issue.category, 0) + 1
        
        # 보안 점수 계산 (100점 만점)
        security_score = max(0, 100 - (
            severity_counts["HIGH"] * 10 +
            severity_counts["MEDIUM"] * 5 +
            severity_counts["LOW"] * 2 +
            severity_counts["INFO"] * 0.5
        ))
        
        # 등급 결정
        if security_score >= 90:
            grade = "A (우수)"
        elif security_score >= 80:
            grade = "B (양호)"
        elif security_score >= 70:
            grade = "C (보통)"
        elif security_score >= 60:
            grade = "D (주의)"
        else:
            grade = "F (위험)"
        
        report = {
            "scan_timestamp": datetime.now(timezone.utc).isoformat(),
            "project_path": str(self.project_path),
            "summary": {
                "total_issues": len(self.issues),
                "severity_breakdown": severity_counts,
                "category_breakdown": category_counts,
                "security_score": round(security_score, 1),
                "security_grade": grade
            },
            "issues": [
                {
                    "severity": issue.severity,
                    "category": issue.category,
                    "file_path": issue.file_path,
                    "line_number": issue.line_number,
                    "description": issue.description,
                    "recommendation": issue.recommendation,
                    "code_snippet": issue.code_snippet,
                    "timestamp": issue.timestamp
                }
                for issue in sorted(self.issues, key=lambda x: (
                    {"HIGH": 0, "MEDIUM": 1, "LOW": 2, "INFO": 3}[x.severity], 
                    x.file_path, 
                    x.line_number
                ))
            ],
            "recommendations": self._generate_recommendations(severity_counts, category_counts)
        }
        
        return report
    
    def _generate_recommendations(self, severity_counts: Dict, category_counts: Dict) -> List[str]:
        """종합 권장사항 생성"""
        recommendations = []
        
        if severity_counts["HIGH"] > 0:
            recommendations.append("🚨 HIGH 위험도 이슈를 즉시 해결하세요")
            
        if category_counts.get("SECRET", 0) > 0:
            recommendations.append("🔐 민감한 정보를 환경 변수나 보안 저장소로 이동하세요")
            
        if category_counts.get("INJECTION", 0) > 0:
            recommendations.append("💉 SQL 인젝션 방지를 위해 매개변수화된 쿼리를 사용하세요")
            
        if category_counts.get("CONFIG", 0) > 0:
            recommendations.append("⚙️ 프로덕션 환경에서 보안 설정을 강화하세요")
            
        if category_counts.get("AUTH", 0) > 0:
            recommendations.append("🔒 모든 민감한 API에 적절한 인증을 추가하세요")
        
        recommendations.extend([
            "📚 보안 코딩 가이드라인을 팀원들과 공유하세요",
            "🔄 정기적인 보안 감사를 수행하세요",
            "🛡️ 프로덕션 배포 전 보안 검토를 의무화하세요"
        ])
        
        return recommendations
    
    def run_full_audit(self) -> Dict[str, Any]:
        """전체 보안 감사 실행"""
        logger.info("🛡️ YouArePlan EasyTax v8 보안 감사 시작")
        logger.info("=" * 60)
        
        # 각 검사 항목 실행
        self.scan_secrets()
        self.scan_injection_risks()
        self.scan_config_issues()
        self.check_file_permissions()
        self.check_dependencies()
        self.analyze_api_security()
        
        # 리포트 생성
        report = self.generate_security_report()
        
        logger.info("=" * 60)
        logger.info(f"🏆 보안 감사 완료: {report['summary']['security_grade']}")
        logger.info(f"📊 총 {report['summary']['total_issues']}개 이슈 발견")
        logger.info(f"⚠️ 위험도 분포: HIGH:{report['summary']['severity_breakdown']['HIGH']}, "
                   f"MEDIUM:{report['summary']['severity_breakdown']['MEDIUM']}, "
                   f"LOW:{report['summary']['severity_breakdown']['LOW']}")
        
        return report
    
    def save_report(self, report: Dict[str, Any], output_file: str = None) -> str:
        """보안 감사 리포트 저장"""
        if not output_file:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_file = f"reports/security_audit_{timestamp}.json"
        
        output_path = Path(output_file)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        return str(output_path)

def main():
    """메인 실행 함수"""
    import argparse
    parser = argparse.ArgumentParser(description="YouArePlan EasyTax v8 보안 감사 도구")
    parser.add_argument("--path", default=".", help="검사할 프로젝트 경로")
    parser.add_argument("--output", help="리포트 출력 파일")
    parser.add_argument("--format", choices=["json", "summary"], default="summary", help="출력 형식")
    args = parser.parse_args()
    
    # 출력 디렉토리 생성
    os.makedirs("reports", exist_ok=True)
    
    auditor = SecurityAuditor(project_path=args.path)
    report = auditor.run_full_audit()
    
    # 리포트 저장
    report_path = auditor.save_report(report, args.output)
    
    if args.format == "json":
        print(json.dumps(report, indent=2, ensure_ascii=False))
    else:
        # 요약 출력
        summary = report["summary"]
        print(f"\n🛡️ YouArePlan EasyTax v8 보안 감사 결과")
        print("=" * 60)
        print(f"📊 보안 점수: {summary['security_score']}/100 ({summary['security_grade']})")
        print(f"📈 총 이슈: {summary['total_issues']}개")
        print(f"⚠️  HIGH: {summary['severity_breakdown']['HIGH']}개")
        print(f"⚠️  MEDIUM: {summary['severity_breakdown']['MEDIUM']}개") 
        print(f"⚠️  LOW: {summary['severity_breakdown']['LOW']}개")
        print(f"ℹ️  INFO: {summary['severity_breakdown']['INFO']}개")
        print()
        print("📋 주요 권장사항:")
        for i, rec in enumerate(report["recommendations"][:5], 1):
            print(f"  {i}. {rec}")
        print()
        print(f"📄 상세 리포트: {report_path}")
    
    # 종료 코드 (HIGH 이슈가 있으면 1, 없으면 0)
    return 1 if report["summary"]["severity_breakdown"]["HIGH"] > 0 else 0

if __name__ == "__main__":
    sys.exit(main())