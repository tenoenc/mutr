# --- Stage 1: 빌드 도구 설치 및 컴파일 ---
FROM python:3.10-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y build-essential cmake python3-dev
COPY ai-server/requirements.txt .
RUN pip wheel --no-cache-dir --wheel-dir /app/wheels -r requirements.txt

# --- Stage 2: 최종 실행 이미지 ---
FROM python:3.10-slim
WORKDIR /app

# 컴파일된 패키지만 가져오기
COPY --from=builder /app/wheels /app/wheels
RUN pip install --no-cache-dir /app/wheels/* && rm -rf /app/wheels

# gRPC 도구 및 필수 라이브러리
RUN pip install grpcio-tools

# 소스 코드 및 Proto 파일 복사 (모델 파일은 .dockerignore에 의해 제외됨)
COPY proto/mutr_analysis.proto ./proto/
COPY ai-server/ .

# gRPC 코드 생성
RUN python -m grpc_tools.protoc -I./proto --python_out=. --grpc_python_out=. ./proto/mutr_analysis.proto

EXPOSE 50051
CMD ["python", "main.py"]