import { NavBar } from "@/components/header/NavBar";
import { Button } from "./ui/button";
import { Link, useLocation } from "react-router-dom";

export const PageLayout = (props: { children?: React.ReactElement }) => {
  const { children } = props;
  const location = useLocation();

  const sideBarMenus = ["Dashboard", "Sessions", "Profile"];

  return (
    <>
      <NavBar />
      <div className="flex max-w-[1200px] mx-auto pt-10 gap-8 px-8">
        <div className="flex flex-col gap-2 w-[240px]">
          <Link to="/trainingSession">
            <Button className="w-full">Start Training</Button>
          </Link>
          {sideBarMenus.map((menu) => {
            const path = `/${menu.toLowerCase()}`;
            return (
              <Link to={path} key={menu}>
                <Button
                  variant="ghost"
                  className="w-full"
                  data-state={location.pathname === path ? "selected" : ""}
                >
                  <p className="text-start w-full">{menu}</p>
                </Button>
              </Link>
            );
          })}
        </div>
        <div className="w-full min-h-[calc(100vh-130px)]">{children}</div>
      </div>
    </>
  );
};
