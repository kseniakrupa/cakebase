import { Play, ExternalLink, Clock3 } from 'lucide-react';
import SmartImage from '../common/SmartImage';

export default function VideoCard({ video, variant = 'default' }) {
  return (
    <article className={`video-card video-card--${variant}`} id={video.id}>
      <a
        className="video-card__media"
        href={video.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Смотреть видео «${video.title}» на YouTube`}
      >
        <SmartImage src={video.thumbnail} alt="" />
        <span className="video-card__shade" />
        <span className="video-card__play" aria-hidden="true">
          <Play size={20} fill="currentColor" />
        </span>
        <span className="video-card__duration">
          <Clock3 size={12} aria-hidden="true" />
          {video.duration}
        </span>
        {video.isDemo && <span className="video-card__demo">демонстрационное</span>}
      </a>
      <div className="video-card__body">
        <p className="video-card__category">{video.category}</p>
        <h3 className="video-card__title">
          <a href={video.url} target="_blank" rel="noopener noreferrer">
            {video.title}
          </a>
        </h3>
        <p className="video-card__description">{video.description}</p>
        <div className="video-card__footer">
          <span className="video-card__channel">{video.channel}</span>
          <a href={video.url} target="_blank" rel="noopener noreferrer" className="text-link">
            YouTube <ExternalLink size={14} aria-hidden="true" />
          </a>
        </div>
      </div>
    </article>
  );
}
