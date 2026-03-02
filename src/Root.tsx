import { Outlet } from "react-router";
import { TitleManager } from "./TitleManager";

export function Root() {
  return (
    <>
      <TitleManager />
      <Outlet />
    </>
  );
}
