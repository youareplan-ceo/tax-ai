# YouArePlan EasyTax v8.0.0 - Production Docker Image
FROM python:3.13-slim

# 메타데이터
LABEL maintainer="YouArePlan Consulting <contact@youareplan.co.kr>"
LABEL version="8.0.0"
LABEL description="YouArePlan EasyTax v8 - AI 세무 코파일럿"

# 작업 디렉토리 설정
WORKDIR /app

# 시스템 패키지 업데이트 및 필수 도구 설치
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Python 의존성 파일 복사 및 설치
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# 애플리케이션 코드 복사
COPY . .

# 데이터베이스 및 로그 디렉토리 생성
RUN mkdir -p logs reports && \
    chmod 755 logs reports

# 포트 노출 (Render 환경변수 사용)
EXPOSE $PORT

# 헬스체크 설정  
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8081}/health || exit 1

# 프로덕션 환경변수 설정
ENV ENVIRONMENT=production
ENV LOG_LEVEL=INFO
ENV PYTHONPATH=/app

# 엔트리포인트 실행 (Render $PORT 환경변수 사용)
CMD uvicorn api.main:app --host 0.0.0.0 --port ${PORT:-8081} --workers 2 --http h11
