/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_SUI_NETWORK: 'mainnet' | 'testnet' | 'devnet';
  readonly VITE_JOB_BOARD_PACKAGE_ID: string;
  readonly VITE_JOB_BOARD_OBJECT_ID: string;
  readonly VITE_USER_REGISTRY_ID: string;
  readonly VITE_EMPLOYER_REGISTRY_ID: string;
  
  // zkLogin OAuth Configuration
  readonly VITE_GOOGLE_CLIENT_ID: string;
  readonly VITE_REDIRECT_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
