#!/bin/bash

# 1. 환경 변수 설정
BLUE_BACKEND_PORT=8080
GREEN_BACKEND_PORT=8081
BLUE_FRONTEND_PORT=3000
GREEN_FRONTEND_PORT=3001

# 2. 현재 실행 중인 환경 확인 (Nginx 설정 기준)
if [ ! -f /etc/nginx/conf.d/service_url.inc ]; then
    CURRENT_PORT="none"
else
    # 백엔드 포트 변수명($service_backend_url)을 기준으로 포트만 추출
    CURRENT_PORT=$(grep 'service_backend_url' /etc/nginx/conf.d/service_url.inc | grep -oP '127.0.0.1:\K[0-9]+')
fi

if [ "$CURRENT_PORT" == "$BLUE_BACKEND_PORT" ]; then
    TARGET_COLOR="green"
    TARGET_BACKEND_PORT=$GREEN_BACKEND_PORT
    TARGET_FRONTEND_PORT=$GREEN_FRONTEND_PORT
    BEFORE_COLOR="blue"
else
    TARGET_COLOR="blue"
    TARGET_BACKEND_PORT=$BLUE_BACKEND_PORT
    TARGET_FRONTEND_PORT=$BLUE_FRONTEND_PORT
    BEFORE_COLOR="green"
fi

echo ">>> 현재 서비스 포트: $CURRENT_PORT ($BEFORE_COLOR)"
echo ">>> 새로운 배포 타겟: $TARGET_BACKEND_PORT ($TARGET_COLOR)"

# 3. 새로운 환경 컨테이너 실행
# --build 옵션을 포함하여 최신 코드를 반영합니다.
export TARGET_BACKEND_PORT=$TARGET_BACKEND_PORT
export TARGET_FRONTEND_PORT=$TARGET_FRONTEND_PORT

echo ">>> $TARGET_COLOR 환경 컨테이너 빌드 및 실행 중..."

# 3-1. 모든 최신 이미지 가져오기
docker-compose -f docker-compose.yml -f docker-compose.prod.yml pull

# 3-2. AI 서버 업데이트 (이미지가 변경된 경우에만 재시작됨)
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d ai-server

# 3-3. 블루/그린 타겟 앱 실행
docker-compose -p mutr-$TARGET_COLOR -f docker-compose.yml -f docker-compose.prod.yml up -d --no-deps backend frontend

# 4. 헬스 체크 (Health Check)
# Spring Boot Actuator의 /actuator/health를 사용합니다.
echo ">>> 신규 서버($TARGET_COLOR) 상태 확인 중..."
for i in {1..15}; do
    sleep 10
    RESPONSE=$(curl -s http://127.0.0.1:$TARGET_BACKEND_PORT/actuator/health)
    STATUS=$(echo $RESPONSE | grep -oP '"status":"\K[^"]+')

    if [ "$STATUS" == "UP" ]; then
        echo ">>> 신규 서버가 정상적으로 실행되었습니다. (상태: $STATUS)"
        break
    fi

    if [ $i -eq 15 ]; then
        echo ">>> 배포 실패: 신규 서버가 150초 이내에 응답하지 않습니다."
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml stop backend frontend # 실패 시 신규 컨테이너 중지
        exit 1
    fi
    echo ">>> 아직 서버가 준비되지 않았습니다. 대기 중... ($i/15)"
done

# 5. Nginx 스위칭
echo ">>> Nginx 설정을 $TARGET_COLOR 환경으로 전환합니다."

# 두 개의 변수를 한 파일에 기록합니다.
cat <<EOF | sudo tee /etc/nginx/conf.d/service_url.inc
set \$service_frontend_url http://127.0.0.1:$TARGET_FRONTEND_PORT;
set \$service_backend_url http://127.0.0.1:$TARGET_BACKEND_PORT;
EOF

# Nginx 설정을 적용합니다.
sudo systemctl reload nginx
echo ">>> Nginx 스위칭 완료!"

# 6. 이전 컨테이너 정리
# 잠시 대기 후 이전 컨테이너를 종료합니다. 
# docker-compose는 같은 서비스명을 공유하므로, 이전 포트로 떠 있는 컨테이너를 특정하여 지워야 합니다.
echo ">>> 10초 후 이전 버전($BEFORE_COLOR) 컨테이너를 정리합니다."
sleep 10
# 특정 프로젝트의 특정 서비스만 중지하고 삭제
docker-compose -p mutr-$BEFORE_COLOR stop backend frontend
docker-compose -p mutr-$BEFORE_COLOR rm -f backend frontend
# 서비스 중이지 않은 포트의 기존 컨테이너를 찾아서 삭제합니다.
# 이 단계는 수동으로 검증될 때까지 주석 처리해두고 사용합니다.
# docker ps -a | grep "backend" | grep "8080" | awk '{print $1}' | xargs -r docker rm -f