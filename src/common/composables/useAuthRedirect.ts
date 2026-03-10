import { getGithubAuthUrl } from '@common/api';

export function useAuthRedirect() {
  const redirectToGithubLogin = () => {
    window.location.href = getGithubAuthUrl();
  };

  return {
    redirectToGithubLogin,
  };
}
