# MUTR

![Java](https://img.shields.io/badge/Java-21-ED8B00?style=flat-square)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.5.9-6DB33F?style=flat-square)
![Python](https://img.shields.io/badge/Python-3.10-3776AB?style=flat-square)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square)
![Three.js](https://img.shields.io/badge/Three.js-R3F-000000?style=flat-square)
![GCP](https://img.shields.io/badge/GCP-Compute-4285F4?style=flat-square)

**MUTR**은 텍스트 데이터의 의미적 변이와 계보를 3D 공간에 시각화하는 AI 기반 인터랙티브 아카이브입니다. 기존의 선형적인 타임라인 방식에서 벗어나 정보가 전파되며 파생되는 디지털 나비효과를 입체적으로 추적합니다.

사용자가 생성한 노드는 AI 엔진의 맥락 및 감정 분석을 통해 고유한 시각적 속성을 부여받습니다. 분석된 데이터는 사용자의 시선 방향과 확률적 편향 알고리즘에 따라 3D 좌표계 상의 최적의 위치에 배치되어 유기적인 군집을 형성합니다. 이러한 대규모 데이터의 실시간 분석 환경에서도 안정적인 동시성을 보장하기 위해 Java 21의 가상 스레드를 활용한 Non-blocking I/O 처리와 gRPC 통신 기반 아키텍처를 구축했습니다.

**Live Demo:** [https://mutr.cloud](https://mutr.cloud)

## Key Features

* **Optimized AI Analysis Pipeline**: **gRPC와 Protobuf**를 적용하여 이기종 서버 간 통신 효율을 높이고, **SBERT 및 Llama 3.2** 모델을 연계해 정밀한 의미 유사도와 문맥을 도출합니다.
* **Gaze-Aware 3D Mapping**: 사용자의 실시간 **시선 방향과 확률적 편향 알고리즘**을 서버 도메인 로직에 적용하여, 3D 좌표계 상에서 데이터가 입체적인 군집을 형성하도록 제어합니다.
* **Atomic Lineage Coordinator**: **Redis 기반 대기열**을 구축하여 비동기 분석 환경의 경쟁 상태를 해결하고, 부모-자식 노드 간의 순차적 정합성과 데이터 계보의 무결성을 보장합니다.
* **Event-Driven Real-time Sync**: **트랜잭션 기반 이벤트 아키텍처**와 **STOMP 프로토콜**을 결합하여, 분석 완료 시점에 맞춰 별도의 새로고침 없는 실시간 3D 렌더링 동기화를 구현했습니다.


## System Architecture

데이터의 정합성과 실시간성을 확보하기 위해 **이벤트 구동형 설계**를 기반으로 시스템을 구축했습니다. 물리적으로는 단일 인스턴스에 배포되지만, 논리적으로 모듈 간 결합도를 엄격히 제어하여 향후 MSA 전환이 용이한 구조를 지향합니다.

<img width="3032" height="1940" alt="image" src="https://github.com/user-attachments/assets/2a3ab243-41c7-443f-8d1b-efc2fd4ccd1c" />

### 도메인 중심의 Modular Monolith 설계
복잡한 비즈니스 로직을 체계적으로 관리하기 위해 기능 단위로 모듈을 격리하고 응집도를 높였습니다.
* 엔티티가 좌표 계산과 상태 검증을 직접 수행하는 **Rich Domain Model**을 설계하여 데이터와 로직이 분리되는 것을 방지했습니다.
* 좌표나 변이 정보와 같은 핵심 개념을 **불변 객체**로 정의하여, 연산 과정에서의 사이드 이펙트를 차단하고 도메인의 무결성을 확보했습니다.
* 서비스 간의 복잡한 상호작용은 별도의 도메인 서비스로 분리하여 각 객체의 역할과 책임을 명확히 정의했습니다.

### 통신 프로토콜 이원화
서비스 요구사항에 맞춰 내부 엔진 통신과 클라이언트 동기화 전략을 최적화했습니다.
* **Internal (gRPC):** Spring Boot와 Python 서버 간에는 gRPC를 사용합니다. 바이너리 직렬화를 통해 데이터 크기를 줄이고, HTTP/2 기반의 멀티플렉싱으로 대량의 분석 요청을 지연 없이 처리합니다.
* **External (WebSocket):** 클라이언트와의 실시간 동기화에는 STOMP 프로토콜을 채택했습니다. 분석 완료 즉시 서버가 메시지를 발행하는 구조로 설계하여 불필요한 폴링 부하를 제거했습니다.

### Redis를 통한 비동기 동시성 제어
비동기 분산 환경에서 부모 노드의 분석 완료 전 자식 노드가 생성될 때 발생하는 데이터 경합을 제어합니다.
* 분석 중인 부모를 참조하는 자식 노드 요청은 즉시 DB에 반영하지 않고 **Redis 대기열**에 격리하여 데이터 인과 관계를 보호합니다.
* 부모 노드의 분석 완료 이벤트가 발행되면 코디네이터가 이를 감지하여, 대기 중이던 자식 노드들을 **분산 락**을 통해 원자적으로 해제하고 파이프라인에 재투입합니다.

### 리소스 최적화 및 안정적인 배포 전략
제한된 리소스 환경(GCP e2-standard-2)에서 최대의 가용성을 확보하기 위한 인프라를 구성했습니다.
* **무중단 배포:** Docker Compose와 Nginx를 연계한 Blue/Green 배포를 자동화하여, 헬스 체크 통과 시에만 트래픽을 전환하는 안정적인 운영 환경을 구축했습니다.
* **SSL Offloading:** 호스트 레벨의 Nginx에서 SSL 종료를 전담하게 하여 애플리케이션 컨테이너의 부하를 줄이고, 배포 시 인증서 관련 다운타임을 차단했습니다.

## Engineering Challenges

### 비동기 재귀 분석 환경에서의 데이터 경합 제어
부모 노드의 AI 분석이 완료되지 않은 시점에 자식 노드가 생성되면, 참조할 데이터가 부재하여 계보가 끊기는 경쟁 상태가 발생했습니다. 단순히 데이터베이스에 락을 거는 방식은 시스템 전체의 처리량을 저하시키는 병목이 될 것으로 판단했습니다.

* **해결책:** Redis 기반의 **상태 의존적 코디네이터**를 설계하여 문제를 해결했습니다. 분석 중인 부모를 둔 자식 노드 요청을 즉시 DB에 저장하지 않고 Redis 대기열에 격리했습니다. 이후 부모의 분석 완료 이벤트가 발행되면 코디네이터가 대기 중인 자식들을 감지하여 원자적으로 해제하고 분석 파이프라인에 재투입하는 구조를 구축했습니다.
* **결과:** 사용자 경험을 저해하지 않으면서도 복잡한 인과 관계를 가진 데이터의 순차적 무결성을 보장했습니다.

### 재귀 CTE를 통한 문맥 추출 최적화 및 주제 고착화 방지
초기에는 최근 텍스트와 직전 요약본을 단순 결합하여 AI에게 전달했으나, 중복된 문맥 정보로 인해 AI가 새로운 주제 변이를 포착하지 못하고 기존 주제를 답습하는 현상이 나타났습니다.

* **해결책:** PostgreSQL의 **재귀적 공통 테이블 식(Recursive CTE)** 을 도입하여 문맥 추출 로직을 재설계했습니다. 단일 쿼리로 노드의 계보를 역순 순회하며 텍스트 길이를 동적으로 합산하고, 정확히 500자 단위가 채워지는 시점의 조상 노드를 식별했습니다. 이를 통해 조상의 요약본과 이후 파생된 순수 변동분만을 결합하여 프롬프트를 재구성했습니다.
* **결과:** AI에게 중복 없는 고밀도 문맥을 제공함으로써 주제 분석의 정확도를 높이고 흐름의 미세한 변이를 정밀하게 포착하도록 개선했습니다.

### 이기종 시스템 간 저지연 데이터 통신 파이프라인 구축
Java 기반 웹 서버와 Python AI 엔진이 대규모 텍스트 데이터를 교환하는 환경에서, 기존 REST API 방식은 직렬화 과정의 높은 CPU 부하와 페이로드 크기 문제로 인해 성능 병목이 예상되었습니다.

* **해결책:** 두 서버 간 통신 프로토콜을 **gRPC**로 전환하여 I/O 효율을 개선했습니다. Protocol Buffers를 사용하여 데이터를 바이너리 형식으로 압축 전송함으로써 데이터 크기를 줄이고 파싱 비용을 최소화했습니다. 또한 인터페이스를 엄격하게 정의하여 런타임에 발생할 수 있는 데이터 타입 불일치 오류를 사전에 차단했습니다.
* **결과:** HTTP/2 멀티플렉싱을 통해 대량의 분석 요청을 지연 없이 처리하는 고성능 파이프라인을 실현했습니다.

### AI 서버 가용성 대응을 위한 자동 복구 서비스 구현
AI 서버의 일시적인 장애나 재시작 시 진행 중이던 분석 작업이 유실되어 데이터 상태가 불일치하는 결함을 보완해야 했습니다.

* **해결책:** gRPC 헬스체크 기반의 **복구 서비스**를 구현했습니다. 서버의 가용 상태를 실시간으로 감지하고, 서버가 정상화되는 즉시 데이터베이스에서 미완료 상태로 남은 노드들을 식별합니다. 해당 노드들은 코디네이터에 의해 분석 파이프라인으로 자동으로 재투입됩니다.
* **결과:** 장애 상황에서도 데이터 유실 없이 분석을 재개할 수 있는 시스템의 회복 탄력성을 확보했습니다.

## Technical Stack

### Backend Core & Framework
시스템의 안정성과 확장성을 위해 최신 Java 생태계의 기술을 적극적으로 채택했습니다.
* **Java 21 & Spring Boot 3.5.9**: 가상 스레드 기반의 전담 실행자(Executor)를 적용하여 동시 처리량을 확보하고, Modular Monolith 구조를 통해 모듈 격리를 구현했습니다.
* **Spring Security & OAuth2:** JWT 기반 인증과 더불어 UUID 기반의 **Guest Token** 필터를 직접 구현하여, 로그인 없이도 모든 기능을 즉시 체험할 수 있는 환경을 제공합니다.
* **Spring Events & STOMP:** 트랜잭션 커밋 시점과 외부 로직을 분리하기 위해 이벤트를 활용하며, 분석 완료 데이터는 **웹소켓**을 통해 클라이언트에 실시간으로 푸시됩니다.

### Database & Persistence Strategy
데이터의 특성에 맞춰 저장소의 기능을 최적화하여 사용했습니다.
* **PostgreSQL 17:** 계층형 데이터인 노드 계보를 효율적으로 조회하기 위해 **재귀적 공통 테이블 식(Recursive CTE)** 을 사용하며, 가변적인 AI 분석 결과는 **JSONB** 타입을 활용해 유연하게 저장합니다.
* **Redis 7:** Redisson 기반의 **분산 락**과 대기열을 구축하여, 비동기 환경에서 발생하는 데이터 경합을 제어하고 분석 파이프라인의 순차적 무결성을 보장하는 코디네이터로 활용합니다.

### AI Interface & Communication
이기종 시스템 간의 데이터 전송 효율과 분석 모델의 성능을 고려했습니다.
* **gRPC & Protobuf:** Java 웹 서버와 Python AI 엔진 간의 통신에 도입했습니다. 바이너리 직렬화를 통해 대량의 텍스트와 벡터 데이터 전송 시 발생하는 오버헤드를 최소화했습니다.
* **Python 3.10 & PyTorch:** AI 모델 서빙을 위한 런타임으로 사용하며, **Llama 3.2** 및 **KR-SBERT** 모델을 통해 텍스트의 맥락 분석과 변이 측정을 수행합니다.

### Infrastructure & DevOps
제한된 서버 리소스 내에서 서비스 가용성을 유지하기 위한 환경을 구축했습니다.
* **GCP & Nginx:** 호스트 레벨의 Nginx에서 **SSL Offloading**을 수행하여 백엔드 부하를 줄이고, Docker Compose를 연계하여 단일 인스턴스 내에서 **Blue/Green 무중단 배포**를 실현했습니다.
* **GitHub Actions:** 코드 변경 감지 기반의 **선택적 빌드** 파이프라인을 구축하여 CI 시간을 단축하고, 배포 전 과정을 자동화했습니다.

## Deployment Strategy

GitHub Actions와 Google Artifact Registry를 연계하여 빌드부터 배포까지 전 과정을 자동화했습니다. 모노레포 구조의 운영 효율을 높이고 제한된 리소스 환경에서 서비스 연속성을 보장하는 데 중점을 두었습니다.

<img width="5084" height="1088" alt="image" src="https://github.com/user-attachments/assets/904d1ca2-3323-4a5b-abd5-9852828b1d33" />

### 효율적인 빌드를 위한 선택적 CI 파이프라인
단일 저장소 내에서 여러 모듈을 관리함에 따라 발생하는 빌드 비효율을 해결하기 위해 변경 감지 기반의 파이프라인을 구축했습니다. `dorny/paths-filter`를 도입하여 커밋된 코드 중 실제로 수정된 모듈만 식별하고 필요한 서비스만 선별적으로 빌드함으로써 CI 소요 시간을 단축했습니다. 또한 빌드 전 단계에서 테스트 통과 여부를 검증하는 품질 게이트를 배치하여 안정성이 확보된 코드만 배포 프로세스에 진입하도록 강제했습니다.

### 단일 인스턴스 기반의 무중단 배포 전략
별도의 로드밸런서가 없는 제한된 서버 리소스 환경에서 서비스 중단 없는 배포를 위해 독자적인 Blue/Green 전략을 수립했습니다. Nginx가 참조하는 포트 설정 파일을 원자적으로 교체하고 리로드하는 방식을 적용하여 트래픽 유실 없는 서비스 전환을 실현했습니다. 배포 스크립트는 신규 컨테이너의 헬스체크를 일정 시간 폴링하며, 정상 응답이 없을 경우 즉시 배포를 중단하고 자동 롤백을 수행하여 시스템의 가용성을 보호합니다.

### 보안 강화 및 운영 가시성 확보
배포 과정의 모든 민감 정보는 GitHub Secrets를 통해 안전하게 관리하며, 모든 명령은 SSH 암호화 채널을 통해 수행됩니다. 배포 결과와 커밋 메타데이터는 Discord Webhook을 통해 실시간으로 공유됩니다. 이를 통해 개발자가 운영 상황을 즉각적으로 인지할 수 있는 피드백 루프를 구축하고 장애 발생 시 신속한 대응이 가능하도록 했습니다.

## Installation

1. 저장소를 복제합니다.
```bash
git clone https://github.com/tenoenc/mutr.git
cd mutr
```

2. 프로젝트 루트 경로에 `.env` 파일을 생성하고, 아래의 필수 환경 변수를 설정합니다.
```properties
# Database Configuration
DB_PORT=5432
DB_NAME=mutr
DB_USERNAME=postgres
DB_PASSWORD=your_password

# Redis Configuration
REDIS_PORT=6379

# Port Forwarding & Network
INTERNAL_BACKEND_PORT=8080
FRONTEND_HOST_PORT=3000
AI_SERVER_PORT=50051

# Domain & CORS
DOMAIN_NAME=localhost
FRONTEND_URL=http://${DOMAIN_NAME}:${FRONTEND_HOST_PORT}

# Deployment Target Ports (For Local)
TARGET_BACKEND_PORT=${INTERNAL_BACKEND_PORT}
TARGET_FRONTEND_PORT=${FRONTEND_HOST_PORT}

# OAuth2 Provider (Google & Kakao)
# 로컬 테스트 시 더미 값을 입력해도 서버 구동은 가능하나, 소셜 로그인은 제한됩니다.
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
KAKAO_CLIENT_ID=your_kakao_client_id
KAKAO_CLIENT_SECRET=your_kakao_client_secret

# Security (JWT)
JWT_SECRET=your_jwt_secret_key_must_be_long_enough
JWT_EXPIRATION=3600000
```

3. Docker Compose를 통해 서비스를 실행합니다.
```bash
docker-compose up -d
```

4. 정상 구동 여부를 확인합니다.
* Frontend: `http://localhost:3000`
* Backend: `http://localhost:8080`

## License

이 프로젝트는 **CC BY-NC-SA 4.0** (Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International) 라이선스 하에 배포됩니다.

다음 조건을 준수하는 한, 누구나 자유롭게 코드를 복제, 배포 및 수정할 수 있습니다.

* **저작자 표시 (Attribution):** 적절한 출처와 라이선스 링크를 표시하고, 변경 사항이 있는 경우 이를 명시해야 합니다.
* **비영리 (NonCommercial):** 이 프로젝트를 **상업적 목적(영리 추구)으로 절대 사용할 수 없습니다.**
* **동일조건 변경허락 (ShareAlike):** 이 프로젝트를 리믹스, 변형하거나 2차 저작물을 작성할 경우, 해당 결과물에도 원본과 **동일한 라이선스**를 적용해야 합니다.

자세한 내용은 [LICENSE](./LICENSE) 파일을 참고하시기 바랍니다.