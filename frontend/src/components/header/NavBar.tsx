import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SetStateActionType } from "@/types/constant";
import { Menu, Moon, Sun } from "lucide-react";
import { Theme, useTheme } from "../theme-provider";

interface NavBarProps {
  setIsSideMenuOpen?: SetStateActionType<boolean>;
}

export const NavBar = (props: NavBarProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const { theme, setTheme } = useTheme();

  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";

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
        <div className="ml-auto flex gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger className="border rounded-sm aspect-square w-10 h-10 flex justify-center items-center">
              {theme === "system" ? (
                systemTheme === "light" ? (
                  <Sun />
                ) : (
                  <Moon />
                )
              ) : theme === "light" ? (
                <Sun />
              ) : theme === "dark" ? (
                <Moon />
              ) : (
                <Moon />
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuRadioGroup
                value={theme}
                onValueChange={(value) => setTheme(value as Theme)}
              >
                <DropdownMenuRadioItem value="light">
                  Light
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="system">
                  System
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          {user && user.id ? (
            <div className="flex gap-2 items-center">
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <div className="flex gap-1.5 items-center">
                    <div className="rounded-full border bg-primary aspect-square w-10 h-10 flex justify-center items-center">
                      <p className="text-primary-foreground">
                        {user?.name?.[0].toUpperCase() || "A"}
                      </p>
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
