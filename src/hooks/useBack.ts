import { useNavigate } from "react-router";

export function useBackOrFallback(previousPath: string) {
  const navigate = useNavigate();

  const goBack = () => {
    if (document.referrer) {
      const referrerPath = new URL(document.referrer).pathname;
      if (referrerPath === previousPath) {
        navigate(-1);
        return;
      }
    }
    navigate(previousPath);
  };

  return goBack;
}

export function useBackIfInternal(fallbackPath: string) {
  const navigate = useNavigate();

  const goBack = () => {
    const referrer = document.referrer;
    if (referrer) {
      const referrerUrl = new URL(referrer);
      const isSameHost = referrerUrl.host === window.location.host;
      const isSelf = referrerUrl.href === window.location.href;

      if (isSameHost && !isSelf) {
        navigate(-1);
        return;
      }
    }

    navigate(fallbackPath);
  };

  return goBack;
}
