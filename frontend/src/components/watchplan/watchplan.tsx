import { useState, useEffect } from "react";
import { getUserByEmail } from "../../services/user.service";
import { upgradeWatchPlan } from "../../services/user.service";
import { Check, Crown, Star, Zap, Sparkles } from "lucide-react";
import { getThemeByLocationAndTime } from "../utils/theme";

const WatchPlanPage = () => {
  const [loading, setLoading] = useState(false);
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);
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
  const bgGradient = isLight 
    ? "bg-linear-to-b from-gray-50 via-gray-100 to-gray-50" 
    : "bg-linear-to-b from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a]";
  const textColor = isLight ? "text-black" : "text-white";
  const mutedText = isLight ? "text-gray-600" : "text-gray-400";
  const headerBg = isLight ? "bg-white/80" : "bg-white/5";
  const headerBorder = isLight ? "border-gray-200" : "border-white/10";
  const cardBg = isLight ? "bg-white" : "bg-[#0f0f0f]";
  const cardBorder = isLight ? "border-gray-200" : "border-white/10";
  const cardHoverBorder = isLight ? "border-gray-400" : "border-yellow-500/30";
  const featureText = isLight ? "text-gray-700" : "text-gray-300";
  const shadowColor = isLight ? "shadow-lg" : "shadow-2xl";
  const popularBadge = isLight 
    ? "bg-linear-to-r from-yellow-400 to-orange-400" 
    : "bg-linear-to-r from-yellow-500 to-orange-500";

  const handlePlanPurchase = async (
    plan: "bronze" | "silver" | "gold",
    amount: number
  ) => {
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
        amount: amount * 100,
        currency: "INR",
        name: "YouTube Clone",
        description: `${plan.toUpperCase()} Plan`,

        handler: async function () {
          await upgradeWatchPlan(
            userId,
            plan
          );

          alert(
            `${plan.toUpperCase()} Plan Activated Successfully`
          );

          window.location.reload();
        },
      };

      const razor = new (window as any).Razorpay(
        options
      );

      razor.open();
    } catch (error) {
      console.error(error);
      alert("Payment failed");
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    {
      id: "bronze",
      name: "Bronze",
      icon: Star,
      color: "yellow",
      gradient: isLight ? "from-yellow-400 to-yellow-500" : "from-yellow-600 to-yellow-700",
      bgGradient: isLight ? "from-yellow-100/30 to-yellow-200/20" : "from-yellow-500/10 to-yellow-600/5",
      borderColor: isLight ? "border-yellow-400/40" : "border-yellow-500/30",
      textColor: isLight ? "text-yellow-600" : "text-yellow-400",
      badgeColor: isLight ? "bg-yellow-100" : "bg-yellow-500/20",
      price: "₹10",
      duration: "7 minutes",
      description: "Perfect for quick viewing sessions",
      features: [
        "Watch videos for 7 minutes",
        "HD Quality Streaming",
        "Basic Support",
        "Cancel anytime"
      ],
      popular: false
    },
    {
      id: "silver",
      name: "Silver",
      icon: Zap,
      color: "gray",
      gradient: isLight ? "from-gray-400 to-gray-500" : "from-gray-500 to-gray-600",
      bgGradient: isLight ? "from-gray-100/30 to-gray-200/20" : "from-gray-400/10 to-gray-500/5",
      borderColor: isLight ? "border-gray-400/40" : "border-gray-400/30",
      textColor: isLight ? "text-gray-600" : "text-gray-300",
      badgeColor: isLight ? "bg-gray-100" : "bg-gray-500/20",
      price: "₹50",
      duration: "10 minutes",
      description: "Extended viewing for movie lovers",
      features: [
        "Watch videos for 10 minutes",
        "Full HD Quality",
        "Priority Support",
        "Cancel anytime",
        "Ad-free experience"
      ],
      popular: true
    },
    {
      id: "gold",
      name: "Gold",
      icon: Crown,
      color: "orange",
      gradient: isLight ? "from-orange-400 to-amber-500" : "from-orange-500 to-amber-600",
      bgGradient: isLight ? "from-orange-100/30 to-amber-200/20" : "from-orange-500/10 to-amber-600/5",
      borderColor: isLight ? "border-orange-400/40" : "border-orange-500/30",
      textColor: isLight ? "text-orange-600" : "text-orange-400",
      badgeColor: isLight ? "bg-orange-100" : "bg-orange-500/20",
      price: "₹100",
      duration: "Unlimited",
      description: "Ultimate experience for power users",
      features: [
        "Unlimited Video Watching",
        "4K Ultra HD Quality",
        "24/7 Premium Support",
        "Cancel anytime",
        "Ad-free experience",
        "Exclusive content access"
      ],
      popular: false
    }
  ];

  return (
    <div className={`min-h-screen ${bgGradient} p-6 md:p-8`}>
      {/* Header Section */}
      <div className="max-w-6xl mx-auto mb-12">
        <div className="text-center space-y-4">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${headerBg} border ${headerBorder} backdrop-blur-sm`}>
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span className={`text-sm ${mutedText} font-medium`}>Choose Your Plan</span>
          </div>
          <h1 className={`text-5xl md:text-6xl font-bold bg-linear-to-r from-${isLight ? 'gray-800' : 'white'} via-${isLight ? 'gray-600' : 'gray-200'} to-${isLight ? 'gray-400' : 'gray-400'} bg-clip-text text-transparent`}>
            Watch Plans
          </h1>
          <p className={`${mutedText} text-lg max-w-2xl mx-auto`}>
            Select the perfect plan that fits your viewing needs. Upgrade anytime.
          </p>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isHovered = hoveredPlan === plan.id;
          const isPopular = plan.popular;

          return (
            <div
              key={plan.id}
              className="relative group"
              onMouseEnter={() => setHoveredPlan(plan.id)}
              onMouseLeave={() => setHoveredPlan(null)}
            >
              {/* Popular Badge */}
              {isPopular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <div className={`${popularBadge} text-white text-xs font-bold px-6 py-1.5 rounded-full shadow-lg shadow-yellow-500/25 animate-pulse`}>
                    MOST POPULAR
                  </div>
                </div>
              )}

              {/* Card */}
              <div
                className={`relative h-full rounded-2xl p-8 transition-all duration-300 ${
                  isHovered
                    ? `transform -translate-y-2 scale-[1.02] ${shadowColor} ${cardHoverBorder}`
                    : `border ${cardBorder}`
                } bg-linear-to-b ${plan.bgGradient} backdrop-blur-sm overflow-hidden ${cardBg}`}
              >
                {/* Animated linear overlay */}
                <div
                  className={`absolute inset-0 bg-linear-to-r ${plan.gradient} opacity-0 transition-opacity duration-300 ${
                    isHovered ? 'opacity-10' : ''
                  }`}
                />

                {/* Plan Icon */}
                <div className={`w-16 h-16 rounded-2xl bg-linear-to-br ${plan.gradient} p-3.5 mb-6 shadow-lg shadow-${plan.color}-500/20`}>
                  <Icon className="w-full h-full text-white" />
                </div>

                {/* Plan Name */}
                <h2 className={`text-3xl font-bold ${plan.textColor} mb-2`}>
                  {plan.name}
                </h2>

                {/* Description */}
                <p className={`${mutedText} text-sm mb-4`}>
                  {plan.description}
                </p>

                {/* Price */}
                <div className="flex items-baseline gap-1 mb-2">
                  <span className={`text-5xl font-bold ${textColor}`}>
                    {plan.price}
                  </span>
                  <span className={`${mutedText} text-sm`}>/month</span>
                </div>

                {/* Duration */}
                <p className={`${mutedText} text-sm mb-6`}>
                  ⏱️ {plan.duration}
                </p>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className={`flex items-center gap-3 ${featureText} text-sm`}>
                      <div className={`w-5 h-5 rounded-full bg-linear-to-r ${plan.gradient} flex items-center justify-center shrink-0`}>
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Buy Button */}
                <button
                  onClick={() => handlePlanPurchase(plan.id as any, parseInt(plan.price.replace('₹', '')))}
                  disabled={loading}
                  className={`w-full py-3.5 rounded-xl font-semibold text-white transition-all duration-300 relative overflow-hidden ${
                    isHovered
                      ? `bg-linear-to-r ${plan.gradient} shadow-lg shadow-${plan.color}-500/30 scale-[1.02]`
                      : `bg-linear-to-r ${plan.gradient} opacity-90`
                  } hover:scale-[1.02] hover:shadow-lg hover:shadow-${plan.color}-500/20 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <span className="relative z-10">
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </div>
                    ) : (
                      `Buy ${plan.name} Plan`
                    )}
                  </span>
                </button>

                {/* Bottom decorative line */}
                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r ${plan.gradient} opacity-0 transition-opacity duration-300 ${isHovered ? 'opacity-100' : ''}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Note */}
      <div className="max-w-6xl mx-auto mt-12 text-center">
        <p className={`${isLight ? 'text-gray-500' : 'text-gray-500'} text-sm`}>
          🔒 Secure payment powered by Razorpay • Cancel anytime • No hidden fees
        </p>
      </div>
    </div>
  );
};

export default WatchPlanPage;