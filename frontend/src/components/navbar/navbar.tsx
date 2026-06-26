import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { createUser, getUserByEmail, sendEmailOTP, verifyEmailOTP, updatePhoneNumber, sendPhoneOTP, verifyPhoneOTP } from "../../services/user.service";
import { getThemeByLocationAndTime } from "../utils/theme";

const Navbar = () => {
    const [user, setUser] = useState<any>(
        JSON.parse(localStorage.getItem("user") || "null")
    );
    const [showDropdown, setShowDropdown] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const mobileMenuRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [showPhoneModal, setShowPhoneModal] = useState(false);
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [pendingUser, setPendingUser] = useState<any>(null);

    const handleGoogleSuccess = async (credentialResponse: any) => {
        try {
            const decoded: any = jwtDecode(credentialResponse.credential);

            let state = "";

            await new Promise<void>((resolve) => {
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        try {
                            const { latitude, longitude } = position.coords;
                            const response = await fetch(
                                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                            );
                            const data = await response.json();
                            state = data.address.state || "Unknown";
                            console.log("User State:", state);
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
                await createUser(decoded.name, decoded.email, state);
            } catch (error) {
                console.log("User already exists");
            }

            const userResponse = await getUserByEmail(decoded.email);
            const mongoUser = userResponse.data;

            const userData = {
                _id: mongoUser._id,
                name: mongoUser.name,
                email: mongoUser.email,
                plan: mongoUser.plan,
                watchPlan: mongoUser.watchPlan,
                state: mongoUser.state,
                phone: mongoUser.phone,
                picture: decoded.picture,
            };

            const southStates = ["Tamil Nadu", "Kerala", "Karnataka", "Andhra Pradesh", "Telangana"];
            if (southStates.includes(mongoUser.state)) {
                await sendEmailOTP(mongoUser.email);
                setPendingUser(userData);
                setShowOtpModal(true);
                return;
            }
            if (!southStates.includes(mongoUser.state)) {
                if (!mongoUser.phone) {
                    setPendingUser(userData);
                    setShowPhoneModal(true);
                    return;
                }
            }

            localStorage.setItem("user", JSON.stringify(userData));
            setUser(userData);
            console.log("Logged In User:", userData);
        } catch (error) {
            console.error("Google Login Error:", error);
        }
    };

    const handleSavePhone = async () => {
        await updatePhoneNumber(pendingUser._id, phone);
        const updatedUser = { ...pendingUser, phone };
        await sendPhoneOTP(phone);
        setPendingUser(updatedUser);
        setShowPhoneModal(false);
        setShowOtpModal(true);
    };

    const theme = getThemeByLocationAndTime(user?.state || "");
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
    const friendsbutton = isLight ? "text-green-300 hover:bg-blue-800 " : "text-green-300 hover:bg-blue-800"
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
    const mobileMenuBg = isLight ? "bg-white" : "bg-[#0f0f0f]";
    const mobileMenuItemHover = isLight ? "hover:bg-gray-100" : "hover:bg-[#272727]";

    const handleLogout = () => {
        localStorage.removeItem("user");
        setUser(null);
        setShowDropdown(false);
        setShowMobileMenu(false);
        navigate("/");
    };

    const handleVerifyOTP = async () => {
        try {
            const southStates = ["Tamil Nadu", "Kerala", "Karnataka", "Andhra Pradesh", "Telangana"];
            if (southStates.includes(pendingUser.state)) {
                await verifyEmailOTP(pendingUser.email, otp);
            } else {
                await verifyPhoneOTP(pendingUser.phone, otp);
            }
            localStorage.setItem("user", JSON.stringify(pendingUser));
            setUser(pendingUser);
            setShowOtpModal(false);
            alert("Login Successful");
        } catch {
            alert("Invalid OTP");
        }
    };

    const handleViewChannel = () => {
        setShowDropdown(false);
        setShowMobileMenu(false);
        navigate("/channel");
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
                setShowMobileMenu(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Close mobile menu when window resizes to desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setShowMobileMenu(false);
            }
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
        <>
            <nav
                className={`fixed top-0 left-0 right-0 z-50 ${bgColor} ${textColor} border-b ${borderColor}`}
            >
                <div className="flex items-center justify-between px-2 sm:px-4 py-2">
                    {/* Left Section - Hamburger + Logo */}
                    <div className="flex items-center gap-2 md:gap-4">
                        {/* Hamburger Menu Button - Mobile */}
                        <button
                            onClick={() => setShowMobileMenu(!showMobileMenu)}
                            className="md:hidden p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-[#272727] transition-colors"
                            aria-label="Toggle menu"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>

                        <Link to="/" className="flex items-center gap-1 shrink-0">
                            <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.376.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.376-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" />
                                <path d="M9.545 15.568L9.545 8.432L15.818 12L9.545 15.568z" fill="#0f0f0f" />
                            </svg>
                            <span className={`text-lg sm:text-xl font-semibold ${logoText} hidden xs:inline`}>
                                YouTube
                            </span>
                        </Link>
                    </div>

                    {/* Search Bar - Hidden on mobile, visible on md+ */}
                    <div className="hidden md:flex flex-1 max-w-2xl mx-4">
                        <div className="flex w-full">
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

                    {/* Right Section - Desktop Navigation */}
                    <div className="flex items-center gap-1 sm:gap-2">
                        <Link to="/friends" className="hidden sm:block">
                            <button
                                className={`px-2 sm:px-3 md:px-4 py-1 text-xs sm:text-sm font-medium rounded-full transition ${friendsbutton}`}
                            >
                                Friends
                            </button>
                        </Link>


                        {/* Watch Plans - Hidden on small mobile */}
                        <Link to="/watch-plans" className="hidden sm:block">
                            <button
                                className={`px-2 sm:px-3 md:px-4 py-1 text-xs sm:text-sm font-medium rounded-full transition ${watchPlansBtn}`}
                            >
                                Watch Plans
                            </button>
                        </Link>

                        {/* Premium - Hidden on mobile */}
                        <Link to="/premium" className="hidden md:block">
                            <button
                                className={`px-3 md:px-4 py-1 text-sm font-medium rounded-full transition ${premiumBtn}`}
                            >
                                Premium
                            </button>
                        </Link>

                        {/* Downloads - Hidden on mobile */}
                        <Link to="/downloads" className="hidden lg:block">
                            <button
                                className={`px-3 md:px-4 py-1 text-sm font-medium rounded-full transition ${downloadsBtn}`}
                            >
                                Downloads
                            </button>
                        </Link>

                        {/* User Section */}
                        {user ? (
                            <div className="relative" ref={dropdownRef}>
                                <img
                                    src={user.picture}
                                    alt={user.name}
                                    className={`w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full cursor-pointer ${avatarRing} transition-all ${isLight ? 'border-2 border-gray-200' : ''}`}
                                    onClick={() => setShowDropdown(!showDropdown)}
                                />

                                {/* Dropdown Menu */}
                                {showDropdown && (
                                    <div className={`absolute right-0 mt-2 w-64 sm:w-72 ${dropdownBg} rounded-lg shadow-lg border ${dropdownBorder} overflow-hidden z-50`}>
                                        {/* User Info Section */}
                                        <div className={`px-4 py-3 border-b ${dropdownDivider}`}>
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={user.picture}
                                                    alt={user.name}
                                                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${isLight ? 'border-2 border-gray-200' : ''}`}
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <p className={`${dropdownText} font-medium text-sm truncate`}>{user.name}</p>
                                                    <p className={`${dropdownMuted} text-xs truncate`}>{user.email}</p>
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
                            <div className={`${isLight ? 'google-btn-light' : ''} scale-75 sm:scale-90 md:scale-100 origin-right`}>
                                <GoogleLogin
                                    onSuccess={handleGoogleSuccess}
                                    onError={() => console.log("Login Failed")}
                                />
                            </div>
                        )}

                        {/* Mobile Search Icon */}
                        <button className="md:hidden p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-[#272727] transition-colors">
                            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Menu - Slide in from left */}
                {showMobileMenu && (
                    <div className="md:hidden fixed inset-0 z-50">
                        {/* Overlay */}
                        <div
                            className="absolute inset-0 bg-black/50"
                            onClick={() => setShowMobileMenu(false)}
                        />

                        {/* Menu */}
                        <div
                            ref={mobileMenuRef}
                            className={`absolute top-0 left-0 h-full w-72 ${mobileMenuBg} ${textColor} shadow-2xl transform transition-transform duration-300`}
                            style={{ transform: showMobileMenu ? 'translateX(0)' : 'translateX(-100%)' }}
                        >
                            {/* User Info */}
                            {user ? (
                                <div className={`px-4 py-4 border-b ${dropdownDivider}`}>
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={user.picture}
                                            alt={user.name}
                                            className="w-12 h-12 rounded-full"
                                        />
                                        <div>
                                            <p className={`${dropdownText} font-medium`}>{user.name}</p>
                                            <p className={`${dropdownMuted} text-sm`}>{user.email}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className={`px-4 py-4 border-b ${dropdownDivider}`}>
                                    <p className={`${dropdownText} font-medium`}>Sign in to YouTube</p>
                                </div>
                            )}

                            {/* Menu Items */}
                            <div className="py-2">
                                {user && (
                                    <button
                                        onClick={handleViewChannel}
                                        className={`w-full px-4 py-3 text-left ${dropdownText} ${mobileMenuItemHover} transition-colors flex items-center gap-3`}
                                    >
                                        <svg className={`w-5 h-5 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        Your channel
                                    </button>
                                )}

                                <Link
                                    to="/friends"
                                    onClick={() => setShowMobileMenu(false)}
                                >
                                    <button
                                        className={`w-full px-4 py-3 text-left ${dropdownText} ${mobileMenuItemHover} transition-colors flex items-center gap-3`}
                                    >
                                        <svg
                                            className={`w-5 h-5 ${iconColor}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M17 20h5V18a4 4 0 00-5-3.87M9 20H4V18a4 4 0 015-3.87m8-6a3 3 0 11-6 0 3 3 0 016 0zM9 8a3 3 0 11-6 0 3 3 0 016 0z"
                                            />
                                        </svg>

                                        Friends
                                    </button>
                                </Link>

                                <Link to="/watch-plans" onClick={() => setShowMobileMenu(false)}>
                                    <button className={`w-full px-4 py-3 text-left ${dropdownText} ${mobileMenuItemHover} transition-colors flex items-center gap-3`}>
                                        <svg className={`w-5 h-5 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Watch Plans
                                    </button>
                                </Link>

                                <Link to="/premium" onClick={() => setShowMobileMenu(false)}>
                                    <button className={`w-full px-4 py-3 text-left ${dropdownText} ${mobileMenuItemHover} transition-colors flex items-center gap-3`}>
                                        <svg className={`w-5 h-5 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                        </svg>
                                        Premium
                                    </button>
                                </Link>

                                <Link to="/downloads" onClick={() => setShowMobileMenu(false)}>
                                    <button className={`w-full px-4 py-3 text-left ${dropdownText} ${mobileMenuItemHover} transition-colors flex items-center gap-3`}>
                                        <svg className={`w-5 h-5 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Downloads
                                    </button>
                                </Link>

                                {user && (
                                    <>
                                        <div className={`border-t ${dropdownDivider} my-1`}></div>
                                        <button
                                            onClick={handleLogout}
                                            className={`w-full px-4 py-3 text-left ${dropdownText} ${mobileMenuItemHover} transition-colors flex items-center gap-3`}
                                        >
                                            <svg className={`w-5 h-5 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                            Logout
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            {/* OTP and Phone Modals */}
            {showPhoneModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-xl w-full max-w-sm">
                        <h2 className="text-black text-xl font-bold mb-4">
                            Enter Mobile Number
                        </h2>
                        <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="9876543210"
                            className="w-full border p-2 rounded mb-4 text-black"
                        />
                        <button
                            onClick={handleSavePhone}
                            className="w-full bg-blue-600 text-white py-2 rounded"
                        >
                            Continue
                        </button>
                    </div>
                </div>
            )}

            {showOtpModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-xl w-full max-w-sm">
                        <h2 className="text-black text-xl font-bold mb-4">
                            Enter OTP
                        </h2>
                        <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="Enter OTP"
                            className="w-full border p-2 rounded mb-4 text-black"
                        />
                        <button
                            onClick={handleVerifyOTP}
                            className="w-full bg-blue-600 text-white py-2 rounded"
                        >
                            Verify OTP
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default Navbar;