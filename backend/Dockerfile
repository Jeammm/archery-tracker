FROM jjanzic/docker-python3-opencv:latest

ENV PYTHONUNBUFFERED 1
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONPATH /app

WORKDIR /app
COPY requirements.txt /app/requirements.txt

RUN pip install -r requirements.txt

RUN pip install gunicorn

COPY . /app