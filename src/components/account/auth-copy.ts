import type { Locale } from "@/i18n/config";

export const authUi: Record<Locale, { forgotPassword: string; showPassword: string; hidePassword: string }> = {
  en: { forgotPassword: "Forgot password?", showPassword: "Show password", hidePassword: "Hide password" },
  es: { forgotPassword: "¿Olvidaste tu contraseña?", showPassword: "Mostrar contraseña", hidePassword: "Ocultar contraseña" },
  ar: { forgotPassword: "نسيت كلمة المرور؟", showPassword: "إظهار كلمة المرور", hidePassword: "إخفاء كلمة المرور" },
  fr: { forgotPassword: "Mot de passe oublié ?", showPassword: "Afficher le mot de passe", hidePassword: "Masquer le mot de passe" },
  de: { forgotPassword: "Passwort vergessen?", showPassword: "Passwort anzeigen", hidePassword: "Passwort ausblenden" },
  nl: { forgotPassword: "Wachtwoord vergeten?", showPassword: "Wachtwoord tonen", hidePassword: "Wachtwoord verbergen" },
  pt: { forgotPassword: "Esqueceste a palavra-passe?", showPassword: "Mostrar palavra-passe", hidePassword: "Ocultar palavra-passe" },
  it: { forgotPassword: "Password dimenticata?", showPassword: "Mostra password", hidePassword: "Nascondi password" },
  tr: { forgotPassword: "Şifreni mi unuttun?", showPassword: "Şifreyi göster", hidePassword: "Şifreyi gizle" },
  ru: { forgotPassword: "Забыли пароль?", showPassword: "Показать пароль", hidePassword: "Скрыть пароль" },
};
