// Global type declarations for SABC Eval360

// Declare axios as a global variable
declare const axios: {
  defaults: {
    baseURL: string;
    headers: Record<string, any>;
  };
};

// Extend Window interface to include our global variables
interface Window {
  axios?: typeof axios;
}
