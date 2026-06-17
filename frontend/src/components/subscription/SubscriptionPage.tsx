import { useState, useEffect } from "react";
import { upgradeToPremium } from "../../services/user.service";
import { getUserByEmail } from "../../services/user.service";
import { getThemeByLocationAndTime } from "../utils/theme";

const SubscriptionPage = () => {
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
    }, []);

    // Get theme
    const theme = getThemeByLocationAndTime(user?.state || "");
    const isLight = theme === "light";

    // Theme-based classes
    const bgColor = isLight ? "bg-gray-50" : "bg-[#0f0f0f]";
    const cardBg = isLight ? "bg-white" : "bg-[#1a1a1a]";
    const cardBorder = isLight ? "border-gray-200" : "border-[#2a2a2a]";
    const textColor = isLight ? "text-black" : "text-white";
    const mutedText = isLight ? "text-gray-600" : "text-gray-400";
    const featureText = isLight ? "text-gray-800" : "text-white";
    const headerGradient = isLight ? "from-yellow-400 to-orange-400" : "from-yellow-500 to-orange-500";
    const buttonBg = isLight ? "bg-black hover:bg-gray-800" : "bg-red-600 hover:bg-red-700";

    const handleUpgrade = async () => {
        try {
            setLoading(true);

            const localUser = JSON.parse(
                localStorage.getItem("user") || "null"
            );

            if (!localUser?.email) {
                alert("Please login first");
                return;
            }

            const userResponse =
                await getUserByEmail(localUser.email);

            const userId = userResponse.data._id;

            const options = {
                key: "rzp_test_T2ZbYFJccZl7R6",
                amount: 9900,
                currency: "INR",
                name: "YouTube Clone",
                description: "Premium Upgrade",

                handler: async function () {
                    await upgradeToPremium(userId);
                    alert("Payment Successful");
                },
            };

            const razor = new (window as any).Razorpay(options);
            razor.open();

            alert("Premium Activated Successfully!");
        } catch (error) {
            console.error(error);
            alert("Failed to upgrade");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`min-h-screen ${bgColor} flex items-center justify-center p-6`}>
            <div className={`w-full max-w-md ${cardBg} rounded-2xl border ${cardBorder} shadow-xl overflow-hidden`}>
                {/* Header */}
                <div className={`bg-linear-to-r ${headerGradient} p-6 text-center`}>
                    <h1 className="text-3xl font-bold text-white">
                        Premium Plan
                    </h1>
                    <p className="text-white/90 mt-2">
                        Unlock Unlimited Downloads
                    </p>
                </div>

                {/* Price */}
                <div className="p-6 text-center">
                    <h2 className={`text-5xl font-bold ${textColor}`}>
                        ₹99
                    </h2>
                    <p className={`${mutedText} mt-2`}>
                        One Time Upgrade
                    </p>
                </div>

                {/* Features */}
                <div className="px-6 pb-6">
                    <div className="space-y-4">
                        <div className={`flex items-center gap-3 ${featureText}`}>
                            <span className="text-green-500 text-xl">✓</span>
                            Unlimited Video Downloads
                        </div>
                        <div className={`flex items-center gap-3 ${featureText}`}>
                            <span className="text-green-500 text-xl">✓</span>
                            No Daily Download Limit
                        </div>
                        <div className={`flex items-center gap-3 ${featureText}`}>
                            <span className="text-green-500 text-xl">✓</span>
                            Faster Access to Content
                        </div>
                        <div className={`flex items-center gap-3 ${featureText}`}>
                            <span className="text-green-500 text-xl">✓</span>
                            Download History Tracking
                        </div>
                    </div>

                    {/* Button */}
                    <button
                        onClick={handleUpgrade}
                        disabled={loading}
                        className={`w-full mt-8 ${buttonBg} transition text-white py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {loading ? "Processing..." : "Upgrade to Premium"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionPage;