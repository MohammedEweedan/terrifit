const REF = "ryvn.ref";
const SOURCE = "terrifit.signup-source";
export function rememberAttribution() {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref");
  const source = params.get("source");
  try {
    if (ref && /^[a-z0-9]{4,16}$/i.test(ref)) sessionStorage.setItem(REF, ref.toUpperCase());
    if (source && /^[a-z0-9_-]{1,80}$/i.test(source)) sessionStorage.setItem(SOURCE, source);
  } catch { /* The form can still use its current URL. */ }
}
export function signupAttribution() {
  const params = new URLSearchParams(window.location.search);
  let ref=params.get("ref") || "";
  let source=params.get("source") || "";
  try { ref ||= sessionStorage.getItem(REF) || ""; source ||= sessionStorage.getItem(SOURCE) || ""; } catch { /* URL-only attribution. */ }
  return {referredByCode:/^[a-z0-9]{4,16}$/i.test(ref)?ref.toUpperCase():"",source:/^[a-z0-9_-]{1,80}$/i.test(source)?source:"terrifit_launch_landing"};
}
