import { useState } from "react";
import { upgradeToPremium } from "../../services/user.service";
import { getUserByEmail } from "../../services/user.service";

const SubscriptionPage = () => {
    const [loading, setLoading] = useState(false);

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
                key: "YOUR_TEST_KEY",
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
        <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-[#1a1a1a] rounded-2xl border border-[#2a2a2a] shadow-xl overflow-hidden">

                {/* Header */}
                <div className="bg-linear-to-r from-yellow-500 to-orange-500 p-6 text-center">
                    <h1 className="text-3xl font-bold text-white">
                        Premium Plan
                    </h1>

                    <p className="text-white/90 mt-2">
                        Unlock Unlimited Downloads
                    </p>
                </div>

                {/* Price */}
                <div className="p-6 text-center">
                    <h2 className="text-5xl font-bold text-white">
                        ₹99
                    </h2>

                    <p className="text-gray-400 mt-2">
                        One Time Upgrade
                    </p>
                </div>

                {/* Features */}
                <div className="px-6 pb-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-white">
                            <span className="text-green-500 text-xl">
                                ✓
                            </span>
                            Unlimited Video Downloads
                        </div>

                        <div className="flex items-center gap-3 text-white">
                            <span className="text-green-500 text-xl">
                                ✓
                            </span>
                            No Daily Download Limit
                        </div>

                        <div className="flex items-center gap-3 text-white">
                            <span className="text-green-500 text-xl">
                                ✓
                            </span>
                            Faster Access to Content
                        </div>

                        <div className="flex items-center gap-3 text-white">
                            <span className="text-green-500 text-xl">
                                ✓
                            </span>
                            Download History Tracking
                        </div>
                    </div>

                    {/* Button */}
                    <button
                        onClick={handleUpgrade}
                        disabled={loading}
                        className="w-full mt-8 bg-red-600 hover:bg-red-700 transition text-white py-3 rounded-xl font-semibold"
                    >
                        {loading
                            ? "Processing..."
                            : "Upgrade to Premium"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionPage;