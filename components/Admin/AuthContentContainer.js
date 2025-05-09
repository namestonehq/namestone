import NameStoneLogo from "../NameStoneLogo";
import CustomConnectButton from "../CustomConnectButton";

export default function AuthContentContainer(props) {
  return (
    <div className="flex flex-col items-center justify-center w-screen min-h-screen bg-neutral-900 overflow-x-hidden">
      {/* Nav bar */}
      <div className="flex items-center justify-between w-full px-4 py-4 md:px-20">
        <NameStoneLogo />
        <CustomConnectButton />
      </div>
      {/* Wrapper */}
      <div className="flex flex-grow w-full max-w-full bg-white">{props.children}</div>
    </div>
  );
}
