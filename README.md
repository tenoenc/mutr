# mutr

## 왜 GCP를 선택했나

원래는 다음과 같은 이점이 있어 오라클 클라우드를 사용하려 했으나...

- **ARM 인스턴스**: 'Ampere A1 Compute' 인스턴스를 선택하면 4 OCPU, 24GB RAM이라는 파격적인 성능을 무료로 제공한다. Java 기반 백엔드와 AI 모델을 동시에 돌리기에 이만한 무료 서버가 없다.
- 고정 IP 제공: 서버를 재시작해도 바뀌지 않는 고정 공인 IP를 제공한다.
- 넉넉한 대역폭: 월 10TB의 아웃바운드 트래픽을 제공하여 운영에 여유가 있다.

지속적으로 트랜잭션 관련 오류 때문에 가입이 되질 않아, 상대적으로 가입 절차가 매우 간편하며, 90일 동안 제공되는 300달러 크레딧을 통해 MUTR을 충분히 쾌적하게 돌릴 수 있는 GCP를 선택하게 되었습니다.

## 클라우드 환경 구성

### 1. 계정 생성

1. **GCP 콘솔 접속**: [Google Cloud 콘솔](https://console.cloud.google.com/)에 접속하여 로그인합니다.
2. **무료 평가판 신청**: 상단의 **[무료로 시작하기]** 버튼을 누릅니다.
3. **정보 입력**: 국가(대한민국)를 선택하고 약관에 동의합니다.
4. **결제 수단 등록**: 해외 결제 가능한 카드를 등록합니다. 90일 종료 전까지는 절대 자동 결제되지 않으니 안심해도 됩니다.

### 2. 서버(VM 인스턴스) 만들기

가입이 완료되면 우리 서비스들이 돌아갈 가상 컴퓨터를 생성해야 합니다.

1. **메뉴 이동**: 왼쪽 메뉴에서 **[Compute Engine] -> [VM 인스턴스]**를 선택합니다.
2. **인스턴스 만들기**:
* **이름**: `mutr-server` 등 자유롭게 지정합니다.
* **리전**: `asia-northeast3 (서울)`을 선택하여 가장 빠른 속도를 확보합니다.
* **머신 구성**: 우리 프로젝트는 AI 서버와 Java 백엔드가 함께 돌아가야 하므로 **`e2-medium` (2 vCPU, 4GB RAM)** 이상을 추천합니다. 크레딧이 넉넉하므로 원활한 구동을 위해 `e2-standard-2` (2 vCPU, 8GB RAM)도 좋은 선택입니다.
* **부팅 디스크**: OS는 `Ubuntu 22.04 LTS` 또는 `24.04 LTS`를 선택하고, 용량은 30~50GB 정도로 넉넉히 잡습니다.
* **방화벽**: `HTTP 트래픽 허용` 및 `HTTPS 트래픽 허용`에 체크합니다.

### 3. 네트워크 방화벽 열기 (포트 개방)

우리가 설정한 서비스들이 외부와 통신할 수 있도록 통로를 열어줘야 합니다.

1. **메뉴 이동**: **[VPC 네트워크] -> [방화벽]**을 선택합니다.
2. **방화벽 규칙 만들기**:
* **이름**: `mutr-ports`
* **대상 태그**: `http-server` (또는 인스턴스에 지정한 태그)
* **소스 IPv4 범위**: `0.0.0.0/0` (모든 접속 허용)
* **프로토콜 및 포트**:
  * **TCP**: `8080` (백엔드), `50051` (gRPC), `3000` (프론트/Nginx 포트에 맞춤)을 입력합니다.

### 4. 서버 접속 및 도커 설치

인스턴스가 생성되면 **SSH** 버튼을 눌러 브라우저 터미널로 서버에 접속합니다. 이후 아래 명령어를 순서대로 입력하여 도커를 설치합니다.

```bash
# 1. 패키지 업데이트 및 도커 설치
sudo apt-get update
sudo apt-get install -y docker.io docker-compose

# 2. 현재 사용자를 도커 그룹에 추가 (sudo 없이 사용하기 위함)
sudo usermod -aG docker $USER
# (입력 후 로그아웃했다가 다시 SSH 접속해야 적용됩니다)

```

### 5. 외부 고정 IP 예약

GCP 인스턴스는 기본적으로 '임시 IP'를 사용하므로 서버를 재시작하면 주소가 바뀔 수 있습니다. 이를 방지하기 위해 고정 IP로 전환해야 합니다.

1. **[VPC 네트워크] -> [IP 주소]**로 이동합니다.
2. 현재 사용 중인 인스턴스의 '외부 IP'를 찾아 [고정 IP 주소로 승격]을 클릭하여 이름을 지정하고 저장합니다.

### 6. 프로젝트 배포 준비

이제 서버 환경은 준비되었습니다. 다음 단계는 로컬에 있는 소스 코드와 Docker 환경을 서버로 옮기는 것입니다.

서버에서 `git clone`으로 프로젝트를 내려받고, 필요한 파일들을 준비합니다.
* `.env`: 배포 환경에 맞게 환경변수를 설정합니다.
* `llama-3.2-Korean-Bllossom-3B-gguf-Q4_K_M.gguf`: LLM 모델은 용량이 크기 때문에 파일 전송 클라이언트로 서버에 업로드합니다.

GCP에서 지원하는 '파일 업로드'는 너무 느려서 별도의 로컬 파일 전송 클라이언트를 사용해야 합니다. GCP 서버는 일반적인 비밀번호 방식이 아닌 SSH 키 방식을 사용하므로, 다음 순서대로 설정하면 바로 접속할 수 있습니다.

**1. SSH 키 쌍(Key Pair) 준비하기**

이미 로컬 PC에서 서버 접속용 키를 생성해두었다면 그 파일을 사용하면 되고, 없다면 새로 만들어야 합니다.

```bash
ssh-keygen -t rsa -f <.ssh_경로>/gcp_key" -C <GCP_구글_계정_이메일>
```

**2. GCP 콘솔에 공인키(`pub`) 등록하기**

클라이언트가 서버에 대조해볼 '자물쇠'를 서버에 미리 달아주는 과정입니다.

1. 로컬의 `gcp_key.pub` 파일을 메모장으로 열어 내용을 전체 복사합니다.
2. **[Compute Engine] -> [메타데이터]** 메뉴로 이동합니다.
3. 상단의 **[SSH 키]** 탭을 클릭하고 **[수정] -> [항목 추가]**를 누릅니다.
4. 복사한 내용을 붙여넣고 **[저장]**합니다.

**3. 파일 전송 클라이언트 설정 (FileZilla 기준)**

이제 클라이언트를 켜서 접속 정보를 입력합니다.

- **프로토콜**: `SFTP - SSH File Trnasfer Protocol`
- **호스트**: 예약한 고정 외부 IP 주소
- **로그온 유형**: 키 파일
- **사용자**: SSH 키 생성 시 입력했던 이메일의 앞부분 (GCP 메타데이터에 표시된 사용자 이름)
- **키 파일**: 아깐 만든 `gcp_key` (확장자 없는 파일)를 생성합니다.

**4. 파일 전송 (`llama-3.2-Korean-Bllossom-3B-gguf-Q4_K_M.gguf`)**

접속에 성공하면 `ai-server/models` 경로에 파일을 전송합니다. 파일을 올린 후 SSH 터미널에서 아래 명령어를 실행해 도커 컨테이너가 파일을 읽을 수 있게 권한을 열어주어야 합니다.

```bash
sudo chmod -R 644 ~/mutr/ai-server/models/*.gguf
```

**5. SSH 접속 및 컨테이너 실행**

앞서 설정한 SSH 키와 사용자 ID를 그대로 사용하여 터미널에서 서버에 직접 접속할 수 있습니다.

```bash
ssh -i <비밀키_경로> <사용자이름>@<고정_외부_IP>
```

마지막으로 운영용 .env 파일을 작성하고, 이미지 빌드 후 컨테이너를 띄웁니다.

```bash
docker-compose up --build
```

## DNS 등록 및 HTTPS 적용하기

### 1. GCP Cloud DNS에서 영역(Zone) 생성

가비아에서 사용 가능한 도메인을 확인했으면, GCP에 도메인을 관리할 공간을 만들어야 합니다.

1. **[Cloud DNS]** 메뉴로 이동합니다.
2. 상단의 **[존 만들기]**를 클릭합니다.
3. 다음 정보를 입력합니다.
   - 존 이름: `mutr-zone`
   - DNS 이름: `mutr.cloud`
   - 공개 범위: 공개 (Public)
4. **[만들기]**를 누릅니다.

존이 생성되면 여러 개의 레코드가 자동으로 나타납니다.

1. 유형이 NS로 된 레코드를 찾습니다.
2. 데이터 항목에 4개의 주소가 있습니다. 이 4개의 주소를 메모자 등에 복사합니다.

### 2. 가비아에서 네임서버 변경

이제 가비아에게 "이 도메인의 관리는 구글에게 맡기겠다"고 선언하는 단계입니다.

1. 가비아 네임서버 선택에서 [타사 네임서버] 탭을 클릭하고, 아까 복사한 구글 네임서버 4개를 순서대로 입력합니다.
2. **[적용]**을 누르고 소유자 인증을 완료합니다.

### 3. GCP에서 도메인과 서버 IP 연결 (A 레코드)

네임서버 주인은 바뀌었지만, 아직 도메인이 어느 IP로 가야할 지는 모르는 상태입니다.

1. 다시 GCP Cloud DNS의 `mutr-zone`으로 돌아와, **[표준 추가]**를 누릅니다.
2. A 레코드를 설정합니다.
    - DNS 이름: 비워둡니다. `mutr.cloud` 자체를 의미합니다.
    - IPv4 주소: GCP 고정 외부 IP 주소를 입력합니다.

네임서버 변경은 전 세계 통신사에 퍼지는 데 시간이 걸립니다. (보통 10분~1시간, 최대 24시간) 기다리면, `http://mutr.cloud`를 통해 서버 IP에 접근할 수 있습니다.

### 4. SSL 인증서 발급

인증서를 처음 받을 때는 임시 Nginx를 띄워 Let's Encypt가 80번 포트를 통해 SSL 인증서를 발급할 수 있도록 합니다.

```nginx
server {
    listen 80;
    server_name mutr.cloud;

    # Certbot 인증을 위한 경로
    location /.well-known/acme-challenge/ {
        root /var/lib/letsencrypt;
    }

    # ...
}
```

컨테이너를 띄우고, 다음 명령어를 실행하면 SSL 인증서가 발급됩니다.

```bash
docker run -it --rm --name certbot \
  -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
  -v "$(pwd)/certbot/www:/var/lib/letsencrypt" \
  certbot/certbot certonly --webroot \
  -w /var/lib/letsencrypt \
  -d mutr.cloud \
  --email <이메일_계정> --agree-tos --no-eff-email
```

### 5. SSL 설정

HTTP로 들어오면 HTTPS로 자동 이동(Redirect)시키고, SSL 인증서를 인식하도록 설정합니다.

```nginx
server {
    listen 80;
    server_name ${DOMAIN_NAME};

    # Certbot 인증을 위한 경로 (중요!)
    location /.well-known/acme-challenge/ {
        root /var/lib/letsencrypt;
    }

    # 모든 HTTP 요청을 HTTPS로 리다이렉트
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name ${DOMAIN_NAME};

    # SSL 인증서 경로 (Certbot이 발급 후 이 위치에 저장합니다)
    ssl_certificate /etc/letsencrypt/live/${DOMAIN_NAME}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN_NAME}/privkey.pem;

    # 보안 설정 (권장)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # 프론트엔드 정적 파일 서빙
    location / {
        root   /usr/share/nginx/html;
        index  index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    # API 프록시 (기존 설정과 동일하게 유지)
    location /api/ {
        proxy_pass http://backend:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # ... 웹소켓 및 소셜 로그인 설정도 동일하게 복사 ...
}
```

이제 `https://mutr.cloud`를 통해 안전하게 서버에 접속할 수 있습니다.


---

## 부모 노드의 주제(Topic)가 생성되지 않은 시점에 자식 노드가 생성되는 '경합 상태' 문제

### 기존 흐름

`NodeService`에서 노드를 생성하고 `NodeCreateEvent`를 발행하면, `NodeAnalysisListener`가 `@Async`를 통해 이를 비동기적으로 가로채 AI 서버로 gRPC 요청을 보냅니다.

### 문제 원인

부모 노드의 분석(요약 및 토픽 확정)이 완료되기 전에 자식 노드의 분석 요청이 AI 서버에 도착하면, `parent_topic`이 빈 상태로 전달되어 `mutation_score` 계산이 누락됩니다.

AI 서버는 전역 락(`llm_lock`)을 사용하여 요청을 순차적으로 처리하고 있습니다. 따라서 백엔드에서 무작위로 비동기 요청을 보내면, AI 서버의 큐에 먼저 들어간 자식 노드가 아직 분석되지 않은 부모 노드를 참조하게 되는 구조적 불일치가 발생합니다.

### 접근 방법: 의존성 체이닝

가장 효율적인 방식은 부모의 분석 완료가 자식의 분석 시작을 트리거 하는 구조입니다. 이는 불필요한 대기 시간이나 반복적인 DB 조회를 없애고, 데이터가 준비된 즉시 분석을 수행하게 합니다.

**핵심 메커니즘**
1. **즉시 실행**: 부모가 없는 루트 노드이거나, 부모의 토픽이 이미 확정된 경우 즉시 AI 서버로 요청을 보냅니다.
2. **대기열 등록**: 부모가 현재 분석 중이라면, 해당 부모 ID를 키로 하는 메모리 내 대기열(Wating Queue)에 자식 이벤트를 저장합니다.
3. **연쇄 해제**: 부모 노드의 분석이 완료되는 시점에 자신을 기다리던 자식 노드들의 이벤트를 꺼내어 AI 서버로 보냅니다.

```java
@Component
public class AnalysisCoordinator {
    // Key: 부모 노드 ID, Value: 부모의 분석 완료를 기다리는 자식 노드 이벤트들
    private final Map<Long, List<NodeCreateEvent>> waitingQueue = new ConcurrentHashMap<>();

    // 분석이 성공적으로 끝난 노드 ID를 추적
    private final Set<Long> completeNodes = Collections.newSetFromMap(new ConcurrentHashMap<>());

    // 자식을 대기열에 추가
    public void hold(Long parentId, NodeCreateEvent event) {
        waitingQueue.computeIfAbsent(parentId, k -> new CopyOnWriteArrayList<>()).add(event);
    }

    // 부모의 준비 상태 확인
    public boolean isReady(Long parentId) {
        if (parentId == null) return true;
        return completeNodes.contains(parentId);
    }

    // 분석 완료 처리 및 대기 중인 자식 목록 반환
    public List<NodeCreateEvent> complete(Long nodeId) {
        completeNodes.add(nodeId);
        return waitingQueue.remove(nodeId);
    }
}
```

```java
@Component
@RequiredArgsConstructor
public class NodeAnalysisListener {
    private final AiAnalysisService aiAnalysisService;
    private final NodeRepository nodeRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final AnalysisCoordinator coordinator;

    @Async
    @EventListener
    @Transactional
    public void handleNodeCreated(NodeCreateEvent event) {
        // 부모가 준비되었는지 확인 후 처리 혹은 대기
        if (coordinator.isReady(event.parentId())) {
            processAnalysis(event);
        } else {
            coordinator.hold(event.parentId(), event);
        }
    }

    private void processAnalysis(NodeCreateEvent event) {
        // 1. 최신 부모 토픽 조회 (부모가 막 분석을 끝냈으므로 DB에서 가져옴)
        String latestParentTopic = "";
        if (event.parentId() != null) {
            latestParentTopic = nodeRepository.findById(event.parentId())
                    .map(Node::getTopic).orElse("");
        }

        // 2. AI 분석 수행 (부모 토픽 전달 보장)
        AnalysisResult result = aiAnalysisService.analyze(
                event.content(), latestParentTopic, event.baselineTopic(), event.fullContext()
        );

        Emotion validatedEmotion = Emotion.from(result.emotion());

        // 3. 노드 정체성 확정 및 저장
        Node node = nodeRepository.findById(event.nodeId()).orElseThrow();
        node.defineIdentity(
                result.topic(),
                MutationInfo.mutate(result.mutationScore()),
                validatedEmotion,
                result.confidence()
        );
        nodeRepository.save(node);

        // 4. 실시간 알림 전송
        messagingTemplate.convertAndSend("/topic/galaxy/public", NodeResponse.from(node));

        // 5. 자신을 기다리는 자식들이 있다면 연쇄 실행
        List<NodeCreateEvent> waitingChildren = coordinator.complete(node.getId());
        if (waitingChildren != null) {
            waitingChildren.forEach(this::processAnalysis);
        }
    }
}
```