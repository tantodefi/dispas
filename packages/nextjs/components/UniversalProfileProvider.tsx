import { UniversalProfileProvider as UPProvider } from "~~/contexts/UniversalProfileContext";

type Props = {
  children: JSX.Element;
};
export const UniversalProfileProvider = ({ children }: Props) => {
  return <UPProvider>{children}</UPProvider>;
};
