FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --production

COPY . .

# Hugging Face Spaces 固定端口 7860
EXPOSE 7860
ENV PORT=7860

CMD ["node", "cube.js"]