import { useState } from 'react';

const FALLBACK = '/images/fallback.svg';

export default function SmartImage({
  src,
  alt = '',
  className = '',
  wrapperClassName = '',
  loading = 'lazy',
  fetchPriority,
  ...rest
}) {
  const [failed, setFailed] = useState(!src);
  const [loaded, setLoaded] = useState(false);

  return (
    <span className={`smart-image ${wrapperClassName}${loaded ? ' is-loaded' : ''}${failed ? ' is-failed' : ''}`}>
      {!failed && (
        <img
          src={src}
          alt={alt}
          className={className}
          loading={loading}
          decoding="async"
          fetchPriority={fetchPriority}
          onError={() => setFailed(true)}
          onLoad={() => setLoaded(true)}
          {...rest}
        />
      )}
      {failed && <img src={FALLBACK} alt="" aria-hidden="true" className={`${className} smart-image__fallback`} />}
    </span>
  );
}
