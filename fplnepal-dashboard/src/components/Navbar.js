import { FaBars } from "react-icons/fa";
import { useNavigate } from "react-router-dom"; // Import navigation hook

const Navbar = ({ toggleSidebar, showMenu = true }) => {
  const navigate = useNavigate();

  return (
    <header className="bg-purple-950 text-white shadow-md p-4 flex justify-between items-center">
      {/* Only show hamburger if showMenu is true */}
      {showMenu && (
        <button onClick={toggleSidebar} className="text-white text-xl md:hidden">
          <FaBars />
        </button>
      )}

      <h1
        onClick={() => navigate("/")}
        className="text-lg font-bold text-center flex-grow cursor-pointer hover:text-purple-300 transition"
      >
        FPL Nepal Webapp
      </h1>
    </header>
  );
};

export default Navbar;
