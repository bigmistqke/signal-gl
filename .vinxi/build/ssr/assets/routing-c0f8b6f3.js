import { createContext, useContext, createMemo } from "solid-js";
const trimPathRegex = /^\/+|(\/)\/+$/g;
function normalizePath(path, omitSlash = false) {
  const s = path.replace(trimPathRegex, "$1");
  return s ? omitSlash || /^[?#]/.test(s) ? s : "/" + s : "";
}
function invariant(value, message) {
  if (value == null) {
    throw new Error(message);
  }
  return value;
}
const RouterContextObj = createContext();
const RouteContextObj = createContext();
const useRouter = () => invariant(useContext(RouterContextObj), "Make sure your app is wrapped in a <Router />");
const useRoute = () => useContext(RouteContextObj) || useRouter().base;
const useResolvedPath = (path) => {
  const route = useRoute();
  return createMemo(() => route.resolvePath(path()));
};
const useHref = (to) => {
  const router = useRouter();
  return createMemo(() => {
    const to_ = to();
    return to_ !== void 0 ? router.renderPath(to_) : to_;
  });
};
const useLocation = () => useRouter().location;
const useParams = () => useRoute().params;
export {
  useHref as a,
  useLocation as b,
  useParams as c,
  normalizePath as n,
  useResolvedPath as u
};
