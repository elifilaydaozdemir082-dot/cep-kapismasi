import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function DeprecatedModeRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Safe automatic redirect to main menu
    router.replace('/');
  }, []);

  return null;
}
