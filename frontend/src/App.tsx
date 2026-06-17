import Navbar from "./components/navbar/navbar";
import AppRoutes from "./routes/AppRoutes";
import { getThemeByLocationAndTime } from "./components/utils/theme";

function App() {
  const user = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  const theme =
    getThemeByLocationAndTime(
      user?.state || ""
    );
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
      <Navbar />
      <AppRoutes />
    </div>
  );
}

export default App;