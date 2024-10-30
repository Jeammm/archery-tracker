import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const NavBar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="z-50 w-screen bg-background/70 h-16 flex justify-center px-8 fixed backdrop-blur-md">
      <div className="w-full max-w-[1344px] flex items-center">
        <Link to="/">
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
