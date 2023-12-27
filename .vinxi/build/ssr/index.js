import { ssr, ssrHydrationKey } from "solid-js/web";
import { c as useParams } from "./assets/routing-c0f8b6f3.js";
import "solid-js";
const _tmpl$ = ["<div", ">User</div>"];
function UserPage() {
  useParams();
  return ssr(_tmpl$, ssrHydrationKey());
}
export {
  UserPage as default
};
