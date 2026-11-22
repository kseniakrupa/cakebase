"""Загрузка, нормализация и кэширование кондитерских новостей из RSS."""

from __future__ import annotations

import hashlib
import html
import json
import logging
import re
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from typing import Any

import feedparser
import requests

from .config import (
    CACHE_FILE,
    CACHE_TTL_SECONDS,
    CONFECTIONERY_KEYWORDS,
    MAX_AGE_DAYS,
    MAX_ITEMS,
    REQUEST_TIMEOUT_SECONDS,
    SAVORY_KEYWORDS,
    SOFT_KEYWORDS,
    SOURCES,
    SWEET_CONTEXT_KEYWORDS,
    USER_AGENT,
)

logger = logging.getLogger("cakebase.news")

_lock = threading.Lock()
_memory_cache: dict[str, Any] | None = None
_TAG_RE = re.compile(r"<[^>]+>")
_SPACE_RE = re.compile(r"\s+")
_IMG_RE = re.compile(r"<img[^>]+src=[\"']([^\"']+)[\"']", re.IGNORECASE)

KEYWORDS = tuple(keyword.lower() for keyword in CONFECTIONERY_KEYWORDS)
SOFT = tuple(keyword.lower() for keyword in SOFT_KEYWORDS)
SWEET = tuple(keyword.lower() for keyword in SWEET_CONTEXT_KEYWORDS)
SAVORY = tuple(keyword.lower() for keyword in SAVORY_KEYWORDS)
WORD_RE = re.compile(r"[a-zа-яё]+", re.IGNORECASE)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _strip_html(value: str | None) -> str:
    if not value:
        return ""
    text = html.unescape(_TAG_RE.sub(" ", value))
    return _SPACE_RE.sub(" ", text).strip()


def _truncate(value: str, limit: int = 320) -> str:
    if len(value) <= limit:
        return value
    cut = value[:limit].rsplit(" ", 1)[0]
    return f"{cut}…"


def _parse_date(entry: dict[str, Any]) -> datetime | None:
    for key in ("published_parsed", "updated_parsed", "created_parsed"):
        parsed = entry.get(key)
        if parsed:
            try:
                return datetime(*parsed[:6], tzinfo=timezone.utc)
            except (TypeError, ValueError):
                pass
    for key in ("published", "updated", "pubDate"):
        raw = entry.get(key)
        if not raw:
            continue
        try:
            date = parsedate_to_datetime(raw)
            if date.tzinfo is None:
                date = date.replace(tzinfo=timezone.utc)
            return date.astimezone(timezone.utc)
        except (TypeError, ValueError, OverflowError):
            continue
    return None


def _extract_image(entry: dict[str, Any], summary_html: str) -> str | None:
    candidates: list[str] = []
    for key in ("media_content", "media_thumbnail"):
        for media in entry.get(key) or []:
            url = media.get("url")
            if url:
                candidates.append(url)
    for enclosure in entry.get("enclosures") or []:
        if str(enclosure.get("type", "")).startswith("image") and enclosure.get("href"):
            candidates.append(enclosure["href"])
    if entry.get("image") and isinstance(entry["image"], dict):
        if entry["image"].get("href"):
            candidates.append(entry["image"]["href"])
    candidates.extend(_IMG_RE.findall(summary_html or ""))
    candidates.extend(_IMG_RE.findall(entry.get("content", [{}])[0].get("value", "") if entry.get("content") else ""))
    for url in candidates:
        if url.startswith("//"):
            url = f"https:{url}"
        if url.startswith("http"):
            return url
    return None


def _entry_text(entry: dict[str, Any]) -> str:
    summary = entry.get("summary") or entry.get("description") or ""
    if not summary and entry.get("content"):
        summary = entry["content"][0].get("value", "")
    return _strip_html(summary)


def _token_matches(token: str, keyword: str) -> bool:
    """Сравнивает слово с ключевым stem'ом без ложных срабатываний по подстроке."""
    if token == keyword:
        if keyword == "печень":
            return False  # «печень» — это субпродукт, а не печенье
        return True
    if keyword.isascii():
        if token == f"{keyword}s":
            return True
        if keyword.endswith("y") and token == f"{keyword[:-1]}ies":
            return True
        if len(keyword) >= 5 and token.startswith(keyword):
            return len(token) - len(keyword) <= 2
        return False
    if not token.startswith(keyword):
        return False
    if keyword == "торт" and token.startswith("тортил"):
        return False
    if keyword == "печень" and token.startswith(("печенье", "печенья", "печенью", "печеньи", "печенек", "печеньк")):
        return True
    if keyword == "печень":
        return False
    return len(token) - len(keyword) <= 8


def _matches_any(words: list[str], keywords: tuple[str, ...]) -> bool:
    return any(_token_matches(word, keyword) for word in words for keyword in keywords)


def _matches_confectionery(title: str, summary: str, tags: list[str]) -> bool:
    """Кондитерская новость определяется по заголовку, а не по случайным словам в тексте."""
    title_words = WORD_RE.findall(title.lower())
    if not title_words:
        return False
    if _matches_any(title_words, SAVORY):
        return False
    if _matches_any(title_words, KEYWORDS):
        return True
    if _matches_any(title_words, SOFT):
        return _matches_any(title_words, SWEET)
    return False


def _normalize_link(link: str) -> str:
    cleaned = link.split("?")[0].split("#")[0].rstrip("/")
    return cleaned.lower()


def _make_item(source: dict[str, Any], entry: dict[str, Any]) -> dict[str, Any] | None:
    title = _strip_html(entry.get("title", ""))
    link = entry.get("link") or ""
    if not title or not link.startswith("http"):
        return None
    summary_html = entry.get("summary") or entry.get("description") or ""
    if not summary_html and entry.get("content"):
        summary_html = entry["content"][0].get("value", "")
    summary = _entry_text(entry)
    tags = [tag.get("term", "") for tag in entry.get("tags", []) if tag.get("term")]
    if not _matches_confectionery(title, summary, tags):
        return None
    published = _parse_date(entry)
    item_id = hashlib.sha1(_normalize_link(link).encode("utf-8")).hexdigest()[:16]
    return {
        "id": item_id,
        "title": title,
        "link": link,
        "description": _truncate(summary or title),
        "date": published.isoformat() if published else None,
        "dateLabel": published.strftime("%d.%m.%Y") if published else None,
        "source": source["name"],
        "sourceId": source["id"],
        "sourceUrl": source["homepage"],
        "language": source["language"],
        "image": _extract_image(entry, summary_html),
        "tags": tags[:6],
        "isConfectionery": True,
        "cached": False,
    }


def _fetch_source(source: dict[str, Any]) -> dict[str, Any]:
    """Загружает один RSS-источник. Никогда не выбрасывает исключение наружу."""
    started = _now()
    try:
        response = requests.get(
            source["url"],
            timeout=REQUEST_TIMEOUT_SECONDS,
            headers={"User-Agent": USER_AGENT, "Accept": "application/rss+xml, application/xml, text/xml, */*"},
        )
        response.raise_for_status()
        parsed = feedparser.parse(response.content)
        if parsed.bozo and not parsed.entries:
            raise ValueError(f"Некорректный RSS: {parsed.bozo_exception}")
        cutoff = _now() - timedelta(days=MAX_AGE_DAYS)
        items = []
        for entry in parsed.entries:
            item = _make_item(source, entry)
            if not item:
                continue
            if item["date"]:
                published = datetime.fromisoformat(item["date"])
                if published < cutoff:
                    continue
            items.append(item)
        return {
            "source": source,
            "items": items,
            "status": "ok",
            "error": None,
            "elapsed": round((_now() - started).total_seconds(), 2),
        }
    except Exception as exc:  # noqa: BLE001 — источник не должен ронять сервер
        logger.warning("Источник %s недоступен: %s", source["id"], exc)
        return {
            "source": source,
            "items": [],
            "status": "error",
            "error": str(exc)[:240],
            "elapsed": round((_now() - started).total_seconds(), 2),
        }


def _load_disk_cache() -> dict[str, Any] | None:
    try:
        if CACHE_FILE.exists():
            with CACHE_FILE.open("r", encoding="utf-8") as handle:
                data = json.load(handle)
            if isinstance(data, dict) and isinstance(data.get("items"), list):
                return data
    except (OSError, ValueError) as exc:
        logger.warning("Не удалось прочитать кэш новостей: %s", exc)
    return None


def _save_disk_cache(payload: dict[str, Any]) -> None:
    try:
        CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
        with CACHE_FILE.open("w", encoding="utf-8") as handle:
            json.dump(payload, handle, ensure_ascii=False)
    except OSError as exc:
        logger.warning("Не удалось сохранить кэш новостей: %s", exc)


def _dedupe(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen_links: set[str] = set()
    seen_titles: set[str] = set()
    result = []
    for item in items:
        link_key = _normalize_link(item["link"])
        title_key = _SPACE_RE.sub(" ", item["title"].lower()).strip()
        if link_key in seen_links or title_key in seen_titles:
            continue
        seen_links.add(link_key)
        seen_titles.add(title_key)
        result.append(item)
    return result


def _sort_items(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return sorted(
        items,
        key=lambda item: item.get("date") or "1970-01-01T00:00:00+00:00",
        reverse=True,
    )


def _build_sources_status(report: dict[str, dict[str, Any]], cached_sources: dict[str, dict[str, Any]] | None = None) -> list[dict[str, Any]]:
    statuses = []
    for source in SOURCES:
        raw = report.get(source["id"], {})
        status = raw.get("status", "unknown")
        count = len(raw.get("items", []))
        cached_meta = (cached_sources or {}).get(source["id"], {})
        if status == "error" and cached_meta.get("count"):
            status = "cached"
            count = cached_meta["count"]
        statuses.append(
            {
                "id": source["id"],
                "name": source["name"],
                "homepage": source["homepage"],
                "language": source["language"],
                "status": status,
                "count": count,
                "error": raw.get("error"),
            }
        )
    return statuses


def _public_payload(
    items: list[dict[str, Any]],
    fetched_at: str,
    mode: str,
    stale: bool,
    statuses: list[dict[str, Any]],
    errors: list[str],
) -> dict[str, Any]:
    return {
        "items": items[:MAX_ITEMS],
        "total": min(len(items), MAX_ITEMS),
        "fetchedAt": fetched_at,
        "mode": mode,
        "stale": stale,
        "cached": mode != "live",
        "ttlSeconds": CACHE_TTL_SECONDS,
        "sources": statuses,
        "errors": errors,
        "attribution": "Материалы принадлежат источникам; ссылки ведут на оригинальные публикации.",
    }


def _merge_failed_sources_from_cache(
    fresh: list[dict[str, Any]],
    cached_items: list[dict[str, Any]],
    failed_source_ids: set[str],
) -> list[dict[str, Any]]:
    if not failed_source_ids:
        return fresh
    restored = []
    for item in cached_items:
        if item.get("sourceId") in failed_source_ids:
            copy = dict(item)
            copy["cached"] = True
            restored.append(copy)
    return fresh + restored


def _collect(sources: list[dict[str, Any]]) -> dict[str, Any]:
    report: dict[str, dict[str, Any]] = {}
    with ThreadPoolExecutor(max_workers=min(5, len(sources))) as executor:
        futures = {executor.submit(_fetch_source, source): source for source in sources}
        for future in as_completed(futures):
            source = futures[future]
            try:
                report[source["id"]] = future.result()
            except Exception as exc:  # pragma: no cover — защита на всякий случай
                report[source["id"]] = {
                    "source": source,
                    "items": [],
                    "status": "error",
                    "error": str(exc)[:240],
                }
    return report


def get_news(force_refresh: bool = False) -> dict[str, Any]:
    """Возвращает нормализованную ленту. Использует память, диск и живые RSS."""
    global _memory_cache

    now = _now()
    with _lock:
        cache = _memory_cache
        if cache is None:
            cache = _load_disk_cache()
            _memory_cache = cache

        if cache and not force_refresh:
            fetched_at = cache.get("fetchedAt")
            if fetched_at:
                try:
                    age = (now - datetime.fromisoformat(fetched_at)).total_seconds()
                    if 0 <= age < CACHE_TTL_SECONDS:
                        cached_items = [dict(item, cached=True) for item in cache.get("items", [])]
                        return _public_payload(
                            cached_items,
                            fetched_at,
                            "cache",
                            False,
                            cache.get("sources", _build_sources_status({})),
                            [],
                        )
                except ValueError:
                    pass

        report = _collect(SOURCES)
        errors = [
            f"{entry['source']['name']}: {entry['error']}"
            for entry in report.values()
            if entry.get("status") == "error"
        ]
        fresh_items = _dedupe([item for entry in report.values() for item in entry.get("items", [])])
        fetched_at = now.isoformat()

        cached_items = cache.get("items", []) if cache else []
        failed_ids = {source_id for source_id, entry in report.items() if entry.get("status") == "error"}
        merged = _merge_failed_sources_from_cache(fresh_items, cached_items, failed_ids)
        merged = _sort_items(_dedupe(merged))
        statuses = _build_sources_status(
            report,
            {status["id"]: status for status in (cache.get("sources", []) if cache else [])},
        )

        if merged:
            mode = "live" if fresh_items else "cache"
            stale = bool(failed_ids) or not fresh_items
            payload = _public_payload(merged, fetched_at, mode, stale, statuses, errors)
            _memory_cache = payload
            _save_disk_cache(payload)
            return payload

        if cache and cache.get("items"):
            cached_copy = [dict(item, cached=True) for item in cache["items"]]
            return _public_payload(
                _sort_items(cached_copy),
                cache.get("fetchedAt", fetched_at),
                "cache",
                True,
                statuses,
                errors,
            )

        return _public_payload([], fetched_at, "unavailable", True, statuses, errors or ["Источники недоступны"])


def get_sources_info() -> list[dict[str, Any]]:
    return [
        {
            "id": source["id"],
            "name": source["name"],
            "url": source["url"],
            "homepage": source["homepage"],
            "language": source["language"],
        }
        for source in SOURCES
    ]
