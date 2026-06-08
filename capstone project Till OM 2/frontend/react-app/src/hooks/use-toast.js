import { toast as hToast } from "react-hot-toast";

export const toast = ({ title, description, variant }) => {
  if (variant === "destructive") {
    hToast.error(description || title);
  } else {
    hToast.success(description || title);
  }
};

export const useToast = () => {
  return {
    toast
  };
};
