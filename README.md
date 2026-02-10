# MUTR

![Java](https://img.shields.io/badge/Java-21-ED8B00?style=flat-square)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.5.9-6DB33F?style=flat-square)
![Python](https://img.shields.io/badge/Python-3.10-3776AB?style=flat-square)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square)
![Three.js](https://img.shields.io/badge/Three.js-R3F-000000?style=flat-square)
![GCP](https://img.shields.io/badge/GCP-Compute-4285F4?style=flat-square)

**MUTR**은 텍스트 데이터의 의미적 변이(Mutation)와 계보(Lineage)를 **3D 공간** 에 시각화하는 AI 기반 인터랙티브 아카이브입니다.

본 프로젝트는 선형적인 타임라인에 갇혀 있던 기존의 텍스트 기록 방식을 탈피하여, 정보가 전파되며 파생되는 '디지털 나비효과'를 입체적으로 추적합니다. 사용자가 생성한 노드는 AI 엔진을 통해 맥락과 감정을 분석받아 **시각적 속성이 결정**되며, **사용자의 시선 방향과 확률적 편향 알고리즘**에 따라 3D 좌표계 상의 고유한 위치에 배치되어 군집을 형성합니다. 이를 위해 Java 21의 가상 스레드와 gRPC 통신 기반의 고성능 백엔드 아키텍처를 구축하여, 대규모 데이터의 실시간 분석과 렌더링 환경에서도 안정적인 동시성을 보장합니다.

**Live Demo:** [https://mutr.cloud](https://mutr.cloud)

## Key Features

* **맥락 기반 AI 분석 파이프라인**: Spring Boot와 Python AI 서버 간에 **gRPC** 를 적용하여 대량의 텍스트 데이터를 고속으로 처리합니다. 단순 키워드 매칭이 아닌, **임베딩 모델(KR-SBERT)** 을 통해 부모 노드와 자식 노드 간의 의미적 유사도(Mutation Score)를 정밀하게 측정하고, **LLM(Llama-3.2)** 을 활용하여 데이터의 계보를 잇는 맥락을 생성합니다.

* **시선 유도형 좌표 매핑**: 3D 공간의 노드 배치를 클라이언트가 아닌 서버 도메인 로직에서 직접 제어합니다. **'사용자가 바라보는 시선 방향'** 과 **'부모 노드의 위치'** 를 기준으로, 고정된 반경 내에서 노드가 생성될 좌표를 계산합니다. 이때 **확률적 편향** 알고리즘을 적용하여, 시야각 내에서 노드가 자연스럽게 확산되면서도 군집의 형태를 유지하도록 구현했습니다.

* **Redis 기반 동시성 제어**: 비동기 환경에서 부모 노드의 분석이 끝나기 전에 자식 노드가 생성될 경우 발생하는 **경쟁 상태(Race Condition)** 를 해결했습니다. **Redis** 를 활용한 대기열 시스템을 구축하여, 분석 중인 부모를 둔 자식 노드 요청을 잠시 대기(Hold)시키고, 부모의 분석 완료 이벤트가 발행되면 즉시 자식들을 깨워(Release) 데이터의 인과 관계와 무결성을 보장합니다.

* **이벤트 구동형 실시간 동기화**: 데이터 생성부터 AI 분석, 최종 저장까지의 전 과정을 **이벤트 기반 아키텍처** 로 처리합니다. 트랜잭션 커밋 후(`AFTER_COMMIT`) 분석이 완료된 데이터는 **STOMP 프로토콜** 을 통해 구독 중인 모든 클라이언트에게 실시간으로 푸시(Push) 되어, 별도의 새로고침 없이도 확장되는 모습을 시각화합니다.

## System Architecture

본 시스템은 **이벤트 구동형** 설계를 기반으로 하며, 데이터의 정합성과 실시간성을 동시에 확보하기 위해 하이브리드 통신 프로토콜을 채택했습니다. 물리적으로는 단일 인스턴스에 배포되지만, 논리적으로는 모듈 간 결합도를 제어하여 향후 MSA 전환이 용이한 구조를 갖추고 있습니다.

<img width="3032" height="1940" alt="image" src="https://github.com/user-attachments/assets/efc84d3b-4a94-4661-a185-0f5e361dc158" />

### Server Design: Modular Monolith & DDD

복잡한 도메인 로직을 체계적으로 관리하기 위해 **Modular Monolith** 아키텍처를 적용했습니다. `mutr-core`, `mutr-node`, `mutr-ai` 등 기능 단위로 모듈을 격리하여 의존성 방향을 강제했으며, 각 모듈 내부는 **Vertical Slice Architecture**를 지향하여 관련 로직의 응집도를 극대화했습니다.

* **Rich Domain Model**: `Node` 엔티티가 좌표 계산, 상태 검증 등의 비즈니스 로직을 직접 수행하도록 설계하여, 데이터와 로직이 분리되는 빈약한 도메인 모델(Anemic Domain Model)을 지양했습니다.
* **Immutable Value Objects**: `Coordinate`, `MutationInfo`와 같은 핵심 개념을 불변 객체(VO)로 정의하여, 사이드 이펙트 없는 안전한 도메인 연산을 보장합니다.
* **Domain Services**: 엔티티 간의 상호작용이나 복잡한 알고리즘(구면 좌표계 매핑 등)은 별도의 도메인 서비스로 분리하여 역할과 책임을 명확히 했습니다.

### Communication Strategy

서비스의 요구사항에 맞춰 최적의 통신 프로토콜을 이원화하여 적용했습니다.

* **Internal(gRPC)**: Spring Boot와 Python AI 서버 간의 통신에는 **gRPC** 를 사용했습니다. 바이너리 직렬화(Protobuf)를 통해 JSON 대비 페이로드 크기를 획기적으로 줄이고, HTTP/2 기반의 멀티플렉싱으로 대량의 분석 요청을 지연 없이 처리합니다.
* **External(WebSocket)**: 클라이언트와의 데이터 동기화에는 **STOMP** 프로토콜을 사용합니다. 분석이 완료되는 즉시 서버가 클라이언트로 메시지를 발행(Publish)하는 구조로 설계하여, 불필요한 폴링 부하를 제거하고 실시간성을 확보했습니다.

### Concurrency & Consistency

비동기 분산 환경에서 부모 노드의 분석이 완료되기 전 자식 노드가 생성될 때 발생하는 데이터 경합(Race Condition)을 제어하기 위해 **Redis 기반의 분산 코디네이터**를 구현했습니다.

1. **Analysis Queuing:** 분석 중인 부모 노드를 참조하는 자식 노드 생성 요청은 즉시 DB에 반영되지 않고 Redis 대기열(Waiting Queue)에 격리됩니다.
2. **Event Broadcasting:** 부모 노드의 분석 완료 이벤트(`NodeAnalyzedEvent`)가 시스템 내부에 발행됩니다.
3. **Atomic Release:** 코디네이터가 이벤트를 감지하여 대기 중이던 자식 노드들을 원자적으로 해제하고 분석 파이프라인에 재투입합니다.

### Infrastructure & Deployment

제한된 리소스 환경(GCP e2-standard-2)에서 최대의 가용성을 확보하기 위한 배포 전략입니다.

* **Blue/Green Deployment**: Docker Compose와 Nginx의 동적 설정을 활용한 무중단 배포를 구현했습니다. 배포 스크립트가 유휴 포트(Blue/Green)를 감지하여 컨테이너를 스위칭하고, 헬스 체크 통과 시에만 트래픽을 전환합니다.
* **SSL Offloading**: SSL 종료 및 인증서 갱신(Certbot)은 Host OS의 Nginx가 전담하도록 구성하여, 애플리케이션 컨테이너의 경량화를 유지하고 배포 시 인증서 관련 다운타임을 방지했습니다.

## Engineering Challenges & Solutions

### 1. 비동기 재귀 분석에서의 경쟁 상태(Race Condition) 제어

**Challenge: The "Orphaned Child" Problem**

사용자가 노드를 생성하면 AI가 부모 노드의 맥락을 분석하여 새로운 주제를 도출합니다. 그러나 **부모 노드의 분석이 완료되지 않은(Pending) 시점** 에 자식 노드가 연속으로 생성될 경우, 참조할 `Parent Topic`이 부재하여 데이터 계보(Lineage)가 끊기는 치명적인 경쟁 상태가 발생했습니다.

**Solution: Redis 기반의 상태 의존적 코디네이터 (State-Dependent Coordinator)**

단순한 DB Lock은 전체 시스템의 처리량을 저하시키므로, **Redis** 를 활용한 비동기 코디네이터 패턴을 설계하여 논블로킹 방식으로 문제를 해결했습니다.

1. **Atomic State Check & Queueing:** 자식 노드 생성 요청 시, Redis에서 부모 노드의 분석 상태를 먼저 조회합니다. 분석 진행 중(`WAITING`)이라면 자식 노드를 DB에 즉시 저장하지 않고 **Redis List 대기열에 격리(Hold)** 합니다.
2. **Event-Driven Release:** 부모 노드의 분석이 완료되면 `NodeAnalyzedEvent`가 발행됩니다. 코디네이터는 이를 감지하여 대기열에 묶여있던 자식 노드들을 **원자적으로 해제(Release)** 하고, 완성된 부모 데이터를 주입하여 분석 파이프라인으로 다시 흘려보냅니다.
3. **Result:** 이를 통해 사용자 경험을 저해하지 않으면서도, 복잡한 인과 관계를 가진 데이터의 **순차적 무결성** 을 보장했습니다.

### 2. 재귀 CTE를 활용한 문맥 윈도우(Context Window) 최적화

**Challenge: Topic Stagnation (주제 고착화)**

초기에는 '최근 500자'와 '직전 부모의 요약'을 단순 결합하여 AI에 전달했습니다. 그러나 최근 500자 텍스트 내에 직전 부모의 요약 내용이 중복 포함되는 경우가 빈번하여, AI가 새로운 주제로의 변이(Mutation)를 포착하지 못하고 기존 주제를 답습하는 **Echo Chamber(반향실) 현상** 이 발생했습니다.

**Solution: Dynamic Context Extraction via Recursive CTE**

중복을 제거하고 순수한 '변화량'만을 추출하기 위해 **재귀적 공통 테이블 식(Recursive CTE)** 을 도입했습니다.

1. **Lineage Traversal:** 단일 쿼리로 노드의 부모 계보를 역순으로 순회하며 텍스트 길이를 동적으로 합산합니다.
2. **Adaptive Cut-off:** 정확히 500자 문맥이 채워지는 시점의 조상 노드(Ancestor)를 식별하고, **"해당 조상의 요약본(Baseline) + 이후 파생된 원본 텍스트(Changes)"** 만을 결합하여 프롬프트를 재구성했습니다.
3. **Result:** AI에게 중복 없는 고밀도의 문맥을 제공함으로써, 주제 분석의 정확도를 높이고 흐름의 **미세한 변이(Mutation)** 를 예민하게 포착하도록 개선했습니다.

### 3. 이기종 시스템 간 초고속 통신 파이프라인 (Why gRPC?)

**Challenge: Serialization Overhead in Polyglot Environment**

Java(Spring Boot) 기반의 웹 서버와 Python 기반의 AI 엔진을 분리하여 운영하는 **Polyglot 아키텍처** 입니다. 두 서버 간에 거대한 텍스트와 빈번하게 대량의 텍스트 컨텍스트를 교환해야 하는데, 기존 REST API(JSON) 방식은 직렬화/역직렬화 과정에서 CPU 부하가 높고 불필요한 텍스트 오버헤드로 인해 향후 실시간 확장 시 심각한 병목이 될 것으로 예상되었습니다.

**Solution: gRPC & Protobuf Interface**

Spring Boot와 Python Engine 사이의 통신 프로토콜을 **gRPC** 로 구축하여 I/O 효율을 극대화했습니다.

1. **Binary Serialization:** Protocol Buffers를 사용하여 데이터를 바이너리로 압축 전송함으로써, JSON 대비 페이로드 크기를 획기적으로 줄이고 파싱 비용을 최소화했습니다.
2. **Strict Type Safety:** `proto` 파일을 통해 Java와 Python 간의 인터페이스를 엄격하게 정의하여, 런타임에 발생할 수 있는 데이터 타입 불일치 오류를 컴파일 시점에 차단했습니다.

## Technical Stack

### Backend Core & Framework

* **Java 21 (LTS):** 기존 스레드 모델의 블로킹 비용을 제거하기 위해 **Virtual Threads** 를 적용, 제한된 리소스 내에서 I/O 처리량(Throughput)을 극대화했습니다.
* **Spring Boot 3.5.9:** 모듈 간 결합도를 제어하기 위해 **Modular Monolith** 구조로 설계되었습니다.
* **Spring Security & OAuth2:** JWT 기반의 무상태(Stateless) 인증과 소셜 로그인을 지원합니다. 또한, **UUID 기반의 Guest Token 필터**를 구현하여 비회원에게도 제한된 `ROLE_GUEST` 권한을 부여함으로써, 로그인 절차 없이 즉시 서비스를 체험할 수 있는 환경을 제공합니다.
* **Spring Events:** 트랜잭션과 외부 로직(AI, Socket)을 분리하기 위해 `TransactionalEventListener`를 적극 활용했습니다.
* **Spring WebSocket (STOMP):** 실시간 확장을 위해 Pub/Sub 모델 기반의 양방향 통신을 구축했습니다.

### Database & Persistence Strategy

* **PostgreSQL 16**
  * **Native SQL (Recursive CTE):** 계층형 데이터(Tree Structure)인 노드의 계보(Lineage)를 애플리케이션 메모리가 아닌 DB 레벨에서 한 번에 조회하기 위해 **재귀적 공통 테이블 식(`WITH RECURSIVE`)** 을 사용했습니다. 이를 통해 N+1 문제를 원천 차단하고 AI 문맥 추출 속도를 획기적으로 개선했습니다.
  * **JSONB Type:** 정형화된 관계형 데이터와 달리, 가변적인 AI 분석 결과(벡터 값, 감정 스코어 등)를 유연하게 저장하기 위해 `JSONB` 컬럼을 활용했습니다.

* **Redis 7**
  * **Distributed Lock & Queue:** Redisson 기반의 분산 락을 통해 Race Condition을 제어하고, 미완료된 부모 노드를 참조하는 요청을 임시 격리하는 **상태 의존적 작업 대기열**로 활용했습니다.

### AI Interface & Communication

* **gRPC & Protobuf:** Spring Boot(Java)와 AI Engine(Python) 간의 대용량 텍스트 및 벡터 데이터 전송 시, JSON 직렬화 오버헤드를 줄이고 통신 속도를 보장하기 위해 도입했습니다.
* **Python 3.10 & PyTorch:** AI 모델 서빙을 위한 런타임입니다.

### Infrastructure & DevOps

* **GCP Compute Engine (e2-standard-2):** 2 vCPU 환경에서 JVM과 AI 모델을 동시에 구동하는 고밀도 구성을 최적화했습니다.
* **Nginx (Host Level):** 컨테이너 내부가 아닌 호스트 레벨에서 **SSL Offloading** 을 수행하여 백엔드 부하를 줄이고, 인증서 관리의 영속성을 확보했습니다.
* **Docker Compose:** 서비스 오케스트레이션 및 **Blue/Green 무중단 배포** 를 위한 컨테이너 관리를 담당합니다.
* **GitHub Actions:** 코드 푸시부터 도커 빌드, 배포 스크립트 실행까지의 전 과정을 자동화했습니다.

## Deployment Strategy

GitHub Actions와 Google Artifact Registry를 연계한 자동화 파이프라인을 구축했습니다. 모노레포 구조의 빌드 비효율을 해결하기 위해 **변경 감지 기반의 선택적 빌드** 를 수행하며, 운영 환경에서는 **Nginx 동적 라우팅** 을 통해 리소스 제한을 극복한 **무중단 배포** 를 실현했습니다.

<img width="5084" height="1088" alt="image" src="https://github.com/user-attachments/assets/4e9f67e4-acd6-46a1-8ba9-c24761d59f00" />

### 1. Smart Monorepo CI (Build Optimization)

단일 레포지토리 내에서 백엔드, 프론트엔드, AI 모듈을 통합 관리함에 따라 발생하는 빌드 병목을 해결했습니다.

* **Selective Build Execution:** `dorny/paths-filter`를 도입하여 커밋된 코드가 변경된 모듈을 감지하고, **영향받는 서비스만 선별적으로 빌드** 하여 CI 시간을 획기적으로 단축했습니다.
* **Quality Gate:** 백엔드 변경 시 `./gradlew test`를 파이프라인의 필수 단계로 배치하여, 테스트를 통과하지 못한 코드는 빌드 및 배포 프로세스로 진입할 수 없도록 차단했습니다.
* **Artifact Management:** 빌드된 이미지는 버전 태그와 함께 Google Artifact Registry에 저장되어, 배포 시점의 일관성을 보장합니다.

### 2. Single-Instance Blue/Green Deployment (CD)

로드밸런서 없이 단일 인스턴스(e2-standard-2) 환경에서 **Zero-Downtime** 을 구현하기 위해 독자적인 배포 전략을 수립했습니다.

* **Atomic Nginx Switching:** 심볼릭 링크 교체 방식 대신, Nginx가 참조하는 변수 파일(`.inc`)의 포트 정보를 덮어쓰고 `reload` 하는 방식을 적용했습니다. 이는 메모리 상에서 즉시 처리되므로 **트래픽 유실 없는 원자적 전환** 을 보장합니다.
* **Deep Health Check & Self-Healing:** 배포 스크립트가 신규 컨테이너의 `/actuator/health` 엔드포인트를 150초간 폴링합니다. `UP` 상태를 응답하지 않을 경우 배포를 즉시 중단하고 **자동 롤백** 하여 서비스 장애를 원천 차단합니다.
* **Resource Draining:** 트래픽 전환이 완료되면 일정 시간 대기 후 구 버전 컨테이너를 종료 및 삭제하여, 제한된 서버 리소스를 효율적으로 회수합니다.

### 3. Ops & Observability

* **Secure Deployment:** `scp-action`과 SSH를 통해 설정 파일 전송과 배포 명령을 암호화된 채널로 수행하며, 모든 민감 정보는 GitHub Secrets로 관리됩니다.
* **Feedback Loop:** 배포 성공/실패 여부와 커밋 메타데이터를 **Discord Webhook** 으로 실시간 전송하여, 개발 팀이 운영 상황을 즉각 인지할 수 있는 모니터링 체계를 구축했습니다.

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
docker-compose up -d --build
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