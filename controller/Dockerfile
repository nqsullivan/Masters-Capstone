FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    python3-rpi.gpio \
    i2c-tools \
    libgpiod2 \
    python3-smbus \
    build-essential \
    python3-dev \
    libffi-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "main.py"]
