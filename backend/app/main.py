"""CakeBase API — новостной модуль курсового проекта."""

from __future__ import annotations

import logging

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from .config import CACHE_TTL_SECONDS
from .news import get_news, get_sources_info

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

app = FastAPI(
    title="CakeBase API",
    description="Новостной модуль базы знаний о кондитерских изделиях (торты).",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ],
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict[str, object]:
    return {"status": "ok", "service": "cakebase-api", "cacheTtlSeconds": CACHE_TTL_SECONDS}


@app.get("/api/news")
def news(
    refresh: bool = Query(False, description="Принудительно обновить ленту, минуя кэш"),
) -> dict[str, object]:
    return get_news(force_refresh=refresh)


@app.get("/api/news/sources")
def news_sources() -> dict[str, object]:
    return {"sources": get_sources_info()}
