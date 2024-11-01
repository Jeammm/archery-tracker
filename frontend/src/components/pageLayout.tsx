import { NavBar } from "@/components/header/NavBar";
import { Button } from "./ui/button";
import { Link, useLocation } from "react-router-dom";
import { Sheet, SheetContent } from "./ui/sheet";
import { useEffect, useState } from "react";
import { Icon } from "lucide-react";
import { targetArrow } from "@lucide/lab";

export const PageLayout = (props: { children?: React.ReactElement }) => {
  const { children } = props;
  const location = useLocation();

  const [isSideMenuOpen, setIsSideMenuOpen] = useState<boolean>(false);

  const sideBarMenus = ["Dashboard", "Sessions", "Profile"];

  useEffect(() => {
    setIsSideMenuOpen(false);
  }, [location]);

  const SideMenues = () => {
    return (
      <>
        <Link to="/trainingSession">
          <Button className="w-full mb-4 py-6 text-base">
            <div className="flex gap-2 items-center">
              <Icon iconNode={targetArrow} />
              <p>Start Training</p>
            </div>
          </Button>
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
      </>
    );
  };

  return (
    <>
      <NavBar setIsSideMenuOpen={setIsSideMenuOpen} />
      <div className="flex flex-col items-center">
        <div className="flex flex-1 overflow-hidden max-w-[1344px] w-full">
          <Sheet open={isSideMenuOpen} onOpenChange={setIsSideMenuOpen}>
            <SheetContent side="left" className="w-[300px]" disableDefaultClose>
              <div>
                <h3 className="font-bold text-xl mb-6">Archery Tracker</h3>
                <SideMenues />
              </div>
            </SheetContent>
          </Sheet>
          <aside className="relative w-60 flex-shrink-0 pt-24 hidden lg:block pl-4">
            <div className="w-full h-1" />
            <div className="fixed w-56">
              <SideMenues />
            </div>
          </aside>

          <main className="overflow-y-auto p-2.5 md:p-4 pt-20 md:pt-24 no-scrollbar flex-1 min-h-screen flex flex-col">
            {children}
          </main>
        </div>
      </div>
    </>
  );
};
