/**
 * Profile photo. Hidden unless this resume's Photo option is on.
 * `photo.src` is a data URL used by the PDF renderer. The browser uses the account URL.
 */
export function Photo({ photo, show, className }) {
  if (!show || !photo?.id) return null;
  const src = typeof photo.src === 'string' && photo.src.startsWith('data:image/')
    ? photo.src
    : `/api/photos/${encodeURIComponent(photo.id)}`;
  return <img className={className} src={src} alt="" />;
}
