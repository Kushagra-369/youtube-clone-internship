import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import Navbar from "./components/navbar/navbar";
import AppRoutes from "./routes/AppRoutes";
import { getThemeByLocationAndTime } from "./components/utils/theme";
import { validateUser } from "./services/user.service";

function App() {
  const location = useLocation();

  const user = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  useEffect(() => {
    const checkUser = async () => {
      const localUser = JSON.parse(
        localStorage.getItem("user") || "null"
      );

      if (!localUser?.email) return;

      try {
        await validateUser(localUser.email);
      } catch (error) {
        console.log("User deleted from DB");

        localStorage.removeItem("user");
        window.location.reload();
      }
    };

    checkUser();
  }, []);

  const theme = getThemeByLocationAndTime(
    user?.state || ""
  );

  const hideNavbar = location.pathname.startsWith("/friends");

  console.log(user);
  console.log(theme);

  return (
    <div
      className={
        theme === "light"
          ? "bg-white text-black min-h-screen"
          : "bg-[#0f0f0f] text-white min-h-screen"
      }
    >
      {!hideNavbar && <Navbar />}
      <AppRoutes />
    </div>
  );
}

export default App;