export const findPlaceHolder = (phoneCode: string): string => {
  switch (phoneCode) {
    case "+58":
      return "XXX-XXX-XXXX";

    default:
      return "";
  }
};
