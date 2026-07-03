export const getThemeByLocationAndTime = (
  state: string
) => {
  const southStates = [
    "Tamil Nadu",
    "Kerala",
    "Karnataka",
    "Andhra Pradesh",
    "Telangana",
  ];

  const hour = new Date().getHours();

  const isSouth =
    southStates.includes(state);

  const isTimeValid =
    hour >= 10 && hour < 12;

  return isSouth && isTimeValid
    ? "light"
    : "dark";
};