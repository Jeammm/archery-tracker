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
      <div className="flex flex-col h-screen items-center">
        <div className="flex flex-1 overflow-hidden max-w-[1200px] w-full">
          <aside className="w-60 flex-shrink-0 overflow-y-auto p-4 pt-24">
            <Link to="/trainingSession">
              <Button className="w-full mb-4">Start Training</Button>
            </Link>
            {sideBarMenus.map((menu) => {
              const path = `/${menu.toLowerCase()}`;
              return (
                <Link to={path} key={menu}>
                  <Button
                    variant="ghost"
                    className="w-full mb-2"
                    data-state={location.pathname === path ? "selected" : ""}
                  >
                    <p className="text-start w-full">{menu}</p>
                  </Button>
                </Link>
              );
            })}
          </aside>
          <main className="overflow-y-auto p-4 pt-24 no-scrollbar flex-1">
            {children}
          </main>
        </div>
      </div>
    </>
  );
};
