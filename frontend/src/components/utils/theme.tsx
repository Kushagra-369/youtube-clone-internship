export const getThemeByLocationAndTime = (
  state: string
) => {
  const southStates = [
    "Tamil Nadu",
    "Kerala",
    "Karnataka",
    "Andhra Pradesh",
    "Telangana",
    "Haryana"
  ];

  const hour = new Date().getHours();

  const isSouth =
    southStates.includes(state);

  const isTimeValid =
    hour >= 10 && hour < 18;

  return isSouth && isTimeValid
    ? "light"
    : "dark";
};