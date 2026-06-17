import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { createUser, getUserByEmail } from "../../services/user.service";
import { getThemeByLocationAndTime } from "../utils/theme";

const Navbar = () => {
    const [user, setUser] = useState<any>(
        JSON.parse(localStorage.getItem("user") || "null")
    );
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const handleGoogleSuccess = async (
        credentialResponse: any
    ) => {
        try {
            const decoded: any = jwtDecode(
                credentialResponse.credential
            );

            let state = "";

            await new Promise<void>((resolve) => {
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        try {
                            const { latitude, longitude } =
                                position.coords;

                            const response = await fetch(
                                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                            );

                            const data =
                                await response.json();

                            state =
                                data.address.state ||
                                "Unknown";

                            console.log(
                                "User State:",
                                state
                            );
                        } catch (error) {
                            console.error(error);
                            state = "Unknown";
                        }

                        resolve();
                    },
                    () => {
                        state = "Unknown";
                        resolve();
                    }
                );
            });

            try {
                await createUser(
                    decoded.name,
                    decoded.email,
                    state
                );
            } catch (error) {
                console.log(
                    "User already exists"
                );
            }

            const userResponse =
                await getUserByEmail(
                    decoded.email
                );

            const mongoUser =
                userResponse.data;

            const userData = {
                _id: mongoUser._id,
                name: mongoUser.name,
                email: mongoUser.email,
                plan: mongoUser.plan,
                watchPlan: mongoUser.watchPlan,
                state: mongoUser.state,
                picture: decoded.picture,
            };
            
            localStorage.setItem(
                "user",
                JSON.stringify(userData)
            );

            setUser(userData);

            console.log(
                "Logged In User:",
                userData
            );
        } catch (error) {
            console.error(
                "Google Login Error:",
                error
            );
        }
    };

    const theme =
        getThemeByLocationAndTime(
            user?.state || ""
        );

    const isLight = theme === "light";

    // Theme-based classes
    const bgColor = isLight ? "bg-white" : "bg-[#0f0f0f]";
    const textColor = isLight ? "text-black" : "text-white";
    const borderColor = isLight ? "border-gray-300" : "border-[#303030]";
    const inputBg = isLight ? "bg-white" : "bg-transparent";
    const inputText = isLight ? "text-black" : "text-white";
    const inputPlaceholder = isLight ? "placeholder:text-gray-400" : "placeholder:text-[#aaaaaa]";
    const inputFocus = isLight ? "focus:border-black" : "focus:border-blue-500";
    const searchBtnBg = isLight ? "bg-gray-100" : "bg-transparent";
    const searchBtnHover = isLight ? "hover:bg-gray-200" : "hover:bg-[#272727]";
    const searchBtnText = isLight ? "text-gray-600" : "text-[#aaaaaa]";
    const logoText = isLight ? "text-black" : "text-white";
    const watchPlansBtn = isLight ? "text-yellow-600 hover:bg-gray-200" : "text-yellow-400 hover:bg-[#272727]";
    const premiumBtn = isLight ? "text-blue-600 hover:bg-gray-200" : "text-[#3ea6ff] hover:bg-[#272727]";
    const downloadsBtn = isLight ? "text-black hover:bg-gray-200" : "text-white hover:bg-[#272727]";
    const dropdownBg = isLight ? "bg-white" : "bg-[#0f0f0f]";
    const dropdownBorder = isLight ? "border-gray-200" : "border-[#3a3a3a]";
    const dropdownText = isLight ? "text-black" : "text-white";
    const dropdownMuted = isLight ? "text-gray-600" : "text-[#aaaaaa]";
    const dropdownHover = isLight ? "hover:bg-gray-100" : "hover:bg-[#3a3a3a]";
    const dropdownDivider = isLight ? "border-gray-200" : "border-[#3a3a3a]";
    const avatarRing = isLight ? "hover:ring-2 hover:ring-black" : "hover:ring-2 hover:ring-[#3ea6ff]";
    const iconColor = isLight ? "text-gray-600" : "text-[#aaaaaa]";

    const handleLogout = () => {
        localStorage.removeItem("user");
        setUser(null);
        setShowDropdown(false);
        navigate("/");
    };

    const handleViewChannel = () => {
        setShowDropdown(false);
        navigate("/channel");
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 ${bgColor} ${textColor} border-b ${borderColor}`}
        >
            <div className="flex items-center justify-between px-4 py-2">
                <Link to="/" className="flex items-center gap-1">
                    <svg className="w-8 h-8 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.376.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.376-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" />
                        <path d="M9.545 15.568L9.545 8.432L15.818 12L9.545 15.568z" fill="#0f0f0f" />
                    </svg>
                    <span className={`text-xl font-semibold ${logoText}`}>
                        YouTube
                    </span>
                </Link>

                <div className="flex-1 max-w-2xl mx-4">
                    <div className="flex">
                        <input
                            type="text"
                            placeholder="Search"
                            className={`w-full px-4 py-2 ${inputBg} border ${borderColor} rounded-l-full ${inputText} ${inputPlaceholder} focus:outline-none ${inputFocus}`}
                        />
                        <button className={`px-6 ${searchBtnBg} border ${borderColor} border-l-0 rounded-r-full ${searchBtnHover} transition`}>
                            <svg className={`w-5 h-5 ${searchBtnText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Link to="/watch-plans">
                        <button
                            className={`px-4 py-1.5 text-sm font-medium rounded-full transition ${watchPlansBtn}`}
                        >
                            Watch Plans
                        </button>
                    </Link>

                    <Link to="/premium">
                        <button
                            className={`px-4 py-1.5 text-sm font-medium rounded-full transition ${premiumBtn}`}
                        >
                            Premium
                        </button>
                    </Link>
                    <Link
                        to="/downloads"
                        className={`px-4 py-1.5 text-sm font-medium rounded-full transition ${downloadsBtn}`}
                    >
                        Downloads
                    </Link>
                    {user ? (
                        <div className="relative" ref={dropdownRef}>
                            <img
                                src={user.picture}
                                alt={user.name}
                                className={`w-10 h-10 rounded-full cursor-pointer ${avatarRing} transition-all ${isLight ? 'border-2 border-gray-200' : ''}`}
                                onClick={() => setShowDropdown(!showDropdown)}
                            />

                            {/* Dropdown Menu */}
                            {showDropdown && (
                                <div className={`absolute right-0 mt-2 w-72 ${dropdownBg} rounded-lg shadow-lg border ${dropdownBorder} overflow-hidden z-50`}>
                                    {/* User Info Section */}
                                    <div className={`px-4 py-3 border-b ${dropdownDivider}`}>
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={user.picture}
                                                alt={user.name}
                                                className={`w-12 h-12 rounded-full ${isLight ? 'border-2 border-gray-200' : ''}`}
                                            />
                                            <div>
                                                <p className={`${dropdownText} font-medium text-sm`}>{user.name}</p>
                                                <p className={`${dropdownMuted} text-xs`}>{user.email}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Menu Items */}
                                    <div className="py-2">
                                        <button
                                            onClick={handleViewChannel}
                                            className={`w-full px-4 py-2 text-left ${dropdownText} text-sm ${dropdownHover} transition-colors flex items-center gap-3`}
                                        >
                                            <svg className={`w-5 h-5 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            View your channel
                                        </button>

                                        <div className={`border-t ${dropdownDivider} my-1`}></div>

                                        <button
                                            onClick={handleLogout}
                                            className={`w-full px-4 py-2 text-left ${dropdownText} text-sm ${dropdownHover} transition-colors flex items-center gap-3`}
                                        >
                                            <svg className={`w-5 h-5 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className={isLight ? 'google-btn-light' : ''}>
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={() => console.log("Login Failed")}
                            />
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;