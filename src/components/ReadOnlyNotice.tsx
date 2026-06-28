export const READ_ONLY_PUBLIC_COPY =
  'Dashboard, incidents, and public status stay readable without an admin key.';

interface ReadOnlyNoticeProps {
  lockedFeature: string;
}

export function ReadOnlyNotice({ lockedFeature }: ReadOnlyNoticeProps) {
  return (
    <div className="read-only-notice">
      <p>{READ_ONLY_PUBLIC_COPY}</p>
      <p>
        Connect your admin key in Settings to unlock {lockedFeature}.
      </p>
    </div>
  );
}
