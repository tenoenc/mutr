# 1단계: 빌드 환경
FROM node:20-alpine AS build
WORKDIR /app

# 컨텍스트 내부의 파일을 복사 (상위 경로 불필요)
COPY package*.json ./
RUN npm install

# 전체 소스 코드 복사 및 정적 파일 빌드
COPY . ./
RUN npm run build

# 2단계: 실행 환경
FROM nginx:alpine

# 빌드 결과물 복사
COPY --from=build /app/dist /usr/share/nginx/html

# 컨텍스트 내부로 옮긴 nginx.conf 복사
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]