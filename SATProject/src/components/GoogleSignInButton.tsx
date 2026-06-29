import { useEffect, useRef, useState } from 'react';
import { Alert, Button, message, Spin } from 'antd';
import type { AuthResponse } from '../types/auth';
import { authService } from '../services/authService';
import { storeAuthSession } from '../utils/authStorage';

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleButtonOptions {
  type: 'standard';
  theme: 'outline';
  size: 'large';
  text: 'continue_with';
  shape: 'rectangular';
  logo_alignment: 'left';
  locale: 'en';
  width: number;
}

interface GoogleIdentityApi {
  accounts: {
    id: {
      initialize: (options: { client_id: string; callback: (response: GoogleCredentialResponse) => void }) => void;
      renderButton: (element: HTMLElement, options: GoogleButtonOptions) => void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentityApi;
  }
}

let googleScriptPromise: Promise<void> | null = null;

function loadGoogleIdentityScript() {
  if (window.google) {
    return Promise.resolve();
  }
  if (googleScriptPromise) {
    return googleScriptPromise;
  }

  googleScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-google-identity]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Google sign-in could not load.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client?hl=en';
    script.async = true;
    script.defer = true;
    script.dataset.googleIdentity = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Google sign-in could not load.'));
    document.head.appendChild(script);
  });

  return googleScriptPromise;
}

interface GoogleSignInButtonProps {
  onSuccess: (data: AuthResponse) => void;
}

export default function GoogleSignInButton({ onSuccess }: GoogleSignInButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const successRef = useRef(onSuccess);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    successRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    let active = true;

    const initializeGoogle = async () => {
      try {
        const configResponse = await authService.getGoogleConfig();
        if (!active) return;

        if (configResponse.code !== 200 || !configResponse.data.configured) {
          setConfigured(false);
          setLoading(false);
          return;
        }

        await loadGoogleIdentityScript();
        if (!active || !window.google || !buttonRef.current) return;

        window.google.accounts.id.initialize({
          client_id: configResponse.data.clientId,
          callback: async ({ credential }) => {
            setError(null);
            setLoading(true);
            try {
              const response = await authService.loginWithGoogle(credential);
              if (response.code !== 200) {
                throw new Error(response.message || 'Google sign-in failed.');
              }
              storeAuthSession(response.data);
              message.success('Signed in with Google.');
              successRef.current(response.data);
            } catch (requestError) {
              const requestMessage = typeof requestError === 'string'
                ? requestError
                : requestError instanceof Error
                  ? requestError.message
                  : 'Google sign-in failed. Please try again.';
              setError(requestMessage);
            } finally {
              setLoading(false);
            }
          },
        });

        buttonRef.current.replaceChildren();
        window.google.accounts.id.renderButton(buttonRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          locale: 'en',
          width: Math.min(buttonRef.current.clientWidth || 400, 400),
        });
        setLoading(false);
      } catch {
        if (active) {
          setError('Google sign-in could not load. Please use email login for now.');
          setLoading(false);
        }
      }
    };

    initializeGoogle();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-3">
      <div className="relative flex min-h-11 w-full items-center justify-center">
        <div ref={buttonRef} className={loading || !configured ? 'invisible w-full' : 'flex w-full justify-center'} />
        {loading && <Spin size="small" className="absolute" />}
        {!loading && !configured && (
          <Button block disabled size="large" className="h-11 rounded-xl">
            Continue with Google
          </Button>
        )}
      </div>
      {!configured && <p className="text-center text-xs text-stone-500">Google sign-in is awaiting administrator setup.</p>}
      {error && <Alert type="error" showIcon message={error} />}
    </div>
  );
}
