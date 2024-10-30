import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SetStateActionType } from "@/types/constant";
import { Menu } from "lucide-react";

interface NavBarProps {
  setIsSideMenuOpen?: SetStateActionType<boolean>;
}

export const NavBar = (props: NavBarProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const { setIsSideMenuOpen } = props;

  return (
    <div className="z-50 w-screen bg-background/70 h-16 flex justify-center px-6 fixed backdrop-blur-md">
      <div className="w-full max-w-[1344px] flex items-center">
        {setIsSideMenuOpen && (
          <Button
            variant="clean"
            size="no-space"
            onClick={() => setIsSideMenuOpen((prev) => !prev)}
            className="block lg:hidden mr-2"
          >
            <Menu />
          </Button>
        )}
        <Link to={setIsSideMenuOpen ? "/dashboard" : "/"}>
          <h3 className="font-bold text-xl">Archery Tracker</h3>
        </Link>
        <div className="gap-6 ml-16 hidden md:flex">
          <Link to="/dashboard">
            <p className="text-foreground/80 text-sm">Dashbaord</p>
          </Link>
          <Link to="/trainingSession">
            <p className="text-foreground/80 text-sm">Start Training</p>
          </Link>
        </div>
        <div className="ml-auto">
          {user && user.id ? (
            <div className="flex gap-2 items-center">
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <div className="flex gap-1.5 items-center">
                    <div className="rounded-full border bg-slate-700 aspect-square w-10 h-10 flex justify-center items-center">
                      <p>{user?.name?.[0].toUpperCase() || "A"}</p>
                    </div>
                    <p>{user.name || "A"}</p>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Link to="/login">
              <Button>Login</Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
